import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2,
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
  // WebRTC streams
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  callState?: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  callDuration?: number;
  isMuted?: boolean;
  isVideoOff?: boolean;
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
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
}: CallScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const callStatus = externalCallState || (isIncoming ? 'ringing' : 'calling');
  const duration = externalDuration || 0;
  const muted = externalMuted || false;
  const videoOff = externalVideoOff || false;

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video/audio element
  useEffect(() => {
    if (remoteStream) {
      if (callType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callType]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gradient-to-b from-background via-background to-primary/20"
        >
          {/* Hidden audio element for voice calls */}
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

          <div className="flex flex-col items-center justify-between h-full py-12 px-6">
            {/* Top Section */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="relative">
                  <Avatar
                    src={callerAvatar}
                    name={callerName}
                    size="xl"
                    showStatus={false}
                  />
                  {callStatus === 'ringing' || callStatus === 'calling' ? (
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
                  ) : null}
                </div>
              </motion.div>

              <h2 className="text-2xl font-display font-bold text-foreground mt-6">
                {callerName}
              </h2>
              
              <p className="text-muted-foreground mt-2">
                {callStatus === 'calling' && 'Memanggil...'}
                {callStatus === 'ringing' && (isIncoming ? 'Panggilan masuk...' : 'Berdering...')}
                {callStatus === 'connected' && formatDuration(duration)}
                {callStatus === 'ended' && 'Panggilan berakhir'}
              </p>

              <div className="flex items-center gap-2 mt-2">
                {callType === 'video' ? (
                  <Video className="w-4 h-4 text-primary" />
                ) : (
                  <Phone className="w-4 h-4 text-primary" />
                )}
                <span className="text-sm text-muted-foreground capitalize">
                  {callType === 'video' ? 'Video Call' : 'Voice Call'}
                </span>
              </div>
            </div>

            {/* Video Preview */}
            {callType === 'video' && callStatus === 'connected' && (
              <div className="flex-1 w-full max-w-md my-8 relative">
                {/* Remote video (large) */}
                <div className="w-full aspect-video rounded-2xl bg-card/50 overflow-hidden">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-muted-foreground">Menunggu video...</p>
                    </div>
                  )}
                </div>
                
                {/* Local video (small, picture-in-picture) */}
                <div className="absolute top-3 right-3 w-24 aspect-video rounded-xl bg-card overflow-hidden border-2 border-border shadow-lg">
                  {localStream && !videoOff ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoOff className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="w-full max-w-md">
              {callStatus === 'ringing' && isIncoming ? (
                <div className="flex justify-center gap-8">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      onDecline?.();
                      onClose();
                    }}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                  >
                    <PhoneOff className="w-7 h-7 text-destructive-foreground" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAnswer}
                    className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                  >
                    <Phone className="w-7 h-7 text-primary-foreground" />
                  </motion.button>
                </div>
              ) : (
                <>
                  {callStatus === 'connected' && (
                    <div className="flex justify-center gap-4 mb-8">
                      <button
                        onClick={onToggleMute || (() => {})}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                          muted ? 'bg-destructive/20' : 'bg-card'
                        }`}
                      >
                        {muted ? (
                          <MicOff className="w-6 h-6 text-destructive" />
                        ) : (
                          <Mic className="w-6 h-6 text-foreground" />
                        )}
                      </button>

                      {callType === 'video' && (
                        <button
                          onClick={onToggleVideo || (() => {})}
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                            videoOff ? 'bg-destructive/20' : 'bg-card'
                          }`}
                        >
                          {videoOff ? (
                            <VideoOff className="w-6 h-6 text-destructive" />
                          ) : (
                            <Video className="w-6 h-6 text-foreground" />
                          )}
                        </button>
                      )}

                      <button
                        className="w-14 h-14 rounded-full flex items-center justify-center bg-card"
                      >
                        <Volume2 className="w-6 h-6 text-foreground" />
                      </button>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleEndCall}
                      className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                    >
                      <PhoneOff className="w-7 h-7 text-destructive-foreground" />
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
