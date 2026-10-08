import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2,
  X 
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';

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
}: CallScreenProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>(
    isIncoming ? 'ringing' : 'ringing'
  );

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  useEffect(() => {
    // Simulate call connection after 3 seconds for outgoing calls
    if (!isIncoming && callStatus === 'ringing') {
      const timeout = setTimeout(() => {
        setCallStatus('connected');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isIncoming, callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    setCallStatus('connected');
    onAnswer?.();
  };

  const handleEndCall = () => {
    setCallStatus('ended');
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
                  {/* Ripple effect for ringing */}
                  {callStatus === 'ringing' && (
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
              </motion.div>

              <h2 className="text-2xl font-display font-bold text-foreground mt-6">
                {callerName}
              </h2>
              
              <p className="text-muted-foreground mt-2">
                {callStatus === 'ringing' && (isIncoming ? 'Panggilan masuk...' : 'Memanggil...')}
                {callStatus === 'connected' && formatDuration(callDuration)}
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

            {/* Video Preview (for video calls) */}
            {callType === 'video' && callStatus === 'connected' && (
              <div className="flex-1 w-full max-w-md my-8">
                <div className="w-full aspect-video rounded-2xl bg-card/50 flex items-center justify-center">
                  {isVideoOff ? (
                    <VideoOff className="w-12 h-12 text-muted-foreground" />
                  ) : (
                    <p className="text-muted-foreground">Video preview</p>
                  )}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="w-full max-w-md">
              {callStatus === 'ringing' && isIncoming ? (
                <div className="flex justify-center gap-8">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      onDecline?.();
                      onClose();
                    }}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAnswer}
                    className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                  >
                    <Phone className="w-7 h-7 text-white" />
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* Control buttons during call */}
                  {callStatus === 'connected' && (
                    <div className="flex justify-center gap-4 mb-8">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                          isMuted ? 'bg-destructive/20' : 'bg-card'
                        }`}
                      >
                        {isMuted ? (
                          <MicOff className="w-6 h-6 text-destructive" />
                        ) : (
                          <Mic className="w-6 h-6 text-foreground" />
                        )}
                      </button>

                      {callType === 'video' && (
                        <button
                          onClick={() => setIsVideoOff(!isVideoOff)}
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                            isVideoOff ? 'bg-destructive/20' : 'bg-card'
                          }`}
                        >
                          {isVideoOff ? (
                            <VideoOff className="w-6 h-6 text-destructive" />
                          ) : (
                            <Video className="w-6 h-6 text-foreground" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                          isSpeakerOn ? 'bg-primary/20' : 'bg-card'
                        }`}
                      >
                        <Volume2
                          className={`w-6 h-6 ${
                            isSpeakerOn ? 'text-primary' : 'text-foreground'
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {/* End call button */}
                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleEndCall}
                      className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
                    >
                      <PhoneOff className="w-7 h-7 text-white" />
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
