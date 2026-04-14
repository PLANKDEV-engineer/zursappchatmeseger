import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2,
  SwitchCamera,
  UserPlus,
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';

interface CallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'voice' | 'video';
  callerName: string;
  callerAvatar?: string;
  isIncoming?: boolean;
  onAnswer?: () => void;
  onDecline?: () => void;
  onEndCall: () => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  callState?: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  callDuration?: number;
  isMuted?: boolean;
  isVideoOff?: boolean;
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
  onSwitchCamera?: () => void;
  onInviteToCall?: () => void;
}

export function CallScreen({
  isOpen,
  onClose,
  callType,
  callerName,
  callerAvatar,
  isIncoming = false,
  onAnswer,
  onDecline,
  onEndCall,
  localStream,
  remoteStream,
  callState: externalCallState,
  callDuration: externalDuration,
  isMuted: externalMuted,
  isVideoOff: externalVideoOff,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  onInviteToCall,
}: CallScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const callStatus = externalCallState || (isIncoming ? 'ringing' : 'calling');
  const duration = externalDuration || 0;
  const muted = externalMuted || false;
  const videoOff = externalVideoOff || false;

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    onAnswer?.();
  };

  const handleEndCall = () => {
    onEndCall();
    onClose();
  };

  if (!isOpen) return null;

  const isVideoCall = callType === 'video';
  const isConnected = callStatus === 'connected';

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Hidden audio for voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* VIDEO CALL - Full screen layout */}
      {isVideoCall ? (
        <div className="relative w-full h-full">
          {/* Remote video - full screen */}
          {remoteStream && isConnected ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-primary/20">
              <Avatar
                src={callerAvatar}
                name={callerName}
                size="xl"
                showStatus={false}
              />
              <h2 className="text-2xl font-bold text-foreground mt-6">{callerName}</h2>
              <p className="text-muted-foreground mt-2">
                {callStatus === 'calling' && 'Memanggil...'}
                {callStatus === 'ringing' && (isIncoming ? 'Video call masuk...' : 'Berdering...')}
                {callStatus === 'connected' && formatDuration(duration)}
                {callStatus === 'ended' && 'Panggilan berakhir'}
              </p>
            </div>
          )}

          {/* Local video PiP - top right */}
          <div className="absolute top-12 right-4 w-32 aspect-[3/4] rounded-2xl bg-card overflow-hidden border-2 border-border shadow-lg z-10">
            {localStream && !videoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <VideoOff className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Top bar info */}
          {isConnected && (
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <p className="text-white text-sm font-medium">{callerName}</p>
              <p className="text-white/70 text-xs text-center">{formatDuration(duration)}</p>
            </div>
          )}

          {/* Controls overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 pb-12 px-6">
            {callStatus === 'ringing' && isIncoming ? (
              <div className="flex justify-center gap-12">
                <button
                  onClick={() => { onDecline?.(); onClose(); }}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
                <button
                  onClick={handleAnswer}
                  className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                >
                  <Video className="w-7 h-7 text-white" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-6 mb-6">
                  <button
                    onClick={onToggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${muted ? 'bg-white/30' : 'bg-white/10'}`}
                  >
                    {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>
                  <button
                    onClick={onToggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${videoOff ? 'bg-white/30' : 'bg-white/10'}`}
                  >
                    {videoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                  </button>
                  <button
                    onClick={onSwitchCamera}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10"
                  >
                    <SwitchCamera className="w-5 h-5 text-white" />
                  </button>
                  <button className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10">
                    <Volume2 className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* VOICE CALL layout */
        <div className="flex flex-col items-center justify-between h-full py-12 px-6 bg-gradient-to-b from-background via-background to-primary/20">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar src={callerAvatar} name={callerName} size="xl" showStatus={false} />
              {(callStatus === 'ringing' || callStatus === 'calling') && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  />
                </>
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground mt-6">{callerName}</h2>
            <p className="text-muted-foreground mt-2">
              {callStatus === 'calling' && 'Memanggil...'}
              {callStatus === 'ringing' && (isIncoming ? 'Panggilan masuk...' : 'Berdering...')}
              {callStatus === 'connected' && formatDuration(duration)}
              {callStatus === 'ended' && 'Panggilan berakhir'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Voice Call</span>
            </div>
          </div>

          <div className="w-full max-w-md">
            {callStatus === 'ringing' && isIncoming ? (
              <div className="flex justify-center gap-12">
                <button
                  onClick={() => { onDecline?.(); onClose(); }}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                >
                  <PhoneOff className="w-7 h-7 text-destructive-foreground" />
                </button>
                <button
                  onClick={handleAnswer}
                  className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                >
                  <Phone className="w-7 h-7 text-white" />
                </button>
              </div>
            ) : (
              <>
                {isConnected && (
                  <div className="flex justify-center gap-6 mb-8">
                    <button
                      onClick={onToggleMute}
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${muted ? 'bg-destructive/20' : 'bg-card'}`}
                    >
                      {muted ? <MicOff className="w-6 h-6 text-destructive" /> : <Mic className="w-6 h-6 text-foreground" />}
                    </button>
                    <button className="w-14 h-14 rounded-full flex items-center justify-center bg-card">
                      <Volume2 className="w-6 h-6 text-foreground" />
                    </button>
                  </div>
                )}
                <div className="flex justify-center">
                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                  >
                    <PhoneOff className="w-7 h-7 text-destructive-foreground" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
