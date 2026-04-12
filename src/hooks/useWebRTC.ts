import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface UseWebRTCReturn {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (targetUserId: string, callType: 'voice' | 'video') => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;
  incomingCall: { callerId: string; callerName: string; callType: 'voice' | 'video' } | null;
}

export function useWebRTC(userId: string | undefined): UseWebRTCReturn {
  const [callState, setCallState] = useState<CallState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string; callType: 'voice' | 'video' } | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const targetUserIdRef = useRef<string | null>(null);
  const callTypeRef = useRef<'voice' | 'video'>('voice');
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Duration timer
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [callState]);

  // Listen for incoming calls
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`calls:${userId}`)
      .on('broadcast', { event: 'incoming-call' }, async (payload) => {
        const { callerId, callerName, callType, offer } = payload.payload;
        callTypeRef.current = callType;
        targetUserIdRef.current = callerId;
        
        // Store the offer for when user answers
        pendingCandidatesRef.current = [];
        
        // Create peer connection early to collect ICE candidates
        const pc = createPeerConnection();
        peerConnectionRef.current = pc;
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        setIncomingCall({ callerId, callerName, callType });
        setCallState('ringing');
      })
      .on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        } else {
          pendingCandidatesRef.current.push(payload.payload.candidate);
        }
      })
      .on('broadcast', { event: 'call-answer' }, async (payload) => {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.answer));
          // Add pending candidates
          for (const candidate of pendingCandidatesRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('Error adding pending ICE candidate:', e);
            }
          }
          pendingCandidatesRef.current = [];
          setCallState('connected');
        }
      })
      .on('broadcast', { event: 'call-ended' }, () => {
        cleanup();
        setCallState('ended');
        setTimeout(() => setCallState('idle'), 1500);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserIdRef.current) {
        supabase.channel(`calls:${targetUserIdRef.current}`).send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  }, []);

  const getMediaStream = useCallback(async (callType: 'voice' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      throw new Error('Tidak dapat mengakses mikrofon/kamera');
    }
  }, []);

  const startCall = useCallback(async (targetUserId: string, callType: 'voice' | 'video') => {
    if (!userId) return;

    targetUserIdRef.current = targetUserId;
    callTypeRef.current = callType;
    pendingCandidatesRef.current = [];

    try {
      setCallState('calling');

      const stream = await getMediaStream(callType);
      setLocalStream(stream);

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Get caller profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', userId)
        .single();

      // Send offer to target user
      await supabase.channel(`calls:${targetUserId}`).send({
        type: 'broadcast',
        event: 'incoming-call',
        payload: {
          callerId: userId,
          callerName: profile?.name || 'Unknown',
          callType,
          offer: pc.localDescription?.toJSON(),
        },
      });

      // Record call in history
      await supabase.from('call_history').insert({
        caller_id: userId,
        receiver_id: targetUserId,
        type: callType,
        status: 'ringing',
      });

    } catch (err: any) {
      console.error('Error starting call:', err);
      cleanup();
      setCallState('idle');
      throw err;
    }
  }, [userId, createPeerConnection, getMediaStream]);

  const answerCall = useCallback(async () => {
    if (!incomingCall || !peerConnectionRef.current) return;

    try {
      const stream = await getMediaStream(callTypeRef.current);
      setLocalStream(stream);

      const pc = peerConnectionRef.current;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer to caller
      await supabase.channel(`calls:${incomingCall.callerId}`).send({
        type: 'broadcast',
        event: 'call-answer',
        payload: { answer: pc.localDescription?.toJSON() },
      });

      // Add pending candidates
      for (const candidate of pendingCandidatesRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding pending ICE candidate:', e);
        }
      }
      pendingCandidatesRef.current = [];

      setCallState('connected');
      setIncomingCall(null);
    } catch (err) {
      console.error('Error answering call:', err);
      cleanup();
      setCallState('idle');
    }
  }, [incomingCall, getMediaStream]);

  const cleanup = useCallback(() => {
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    setIncomingCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [localStream]);

  const endCall = useCallback(() => {
    // Notify the other party
    if (targetUserIdRef.current) {
      supabase.channel(`calls:${targetUserIdRef.current}`).send({
        type: 'broadcast',
        event: 'call-ended',
        payload: {},
      });
    }

    cleanup();
    setCallState('ended');
    setTimeout(() => setCallState('idle'), 1500);
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(prev => !prev);
    }
  }, [localStream]);

  return {
    callState,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff,
    callDuration,
    incomingCall,
  };
}
