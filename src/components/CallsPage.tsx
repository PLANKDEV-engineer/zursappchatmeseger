import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing, Clock } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { useCalls } from '@/hooks/useCalls';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface CallsPageProps {
  onCall: (userId: string, type: 'voice' | 'video') => void;
}

export function CallsPage({ onCall }: CallsPageProps) {
  const { user } = useAuth();
  const { calls, loading } = useCalls(user?.id);

  const getCallIcon = (call: (typeof calls)[0]) => {
    const isCaller = call.caller_id === user?.id;
    
    if (call.status === 'missed') {
      return <PhoneMissed className="w-4 h-4 text-destructive" />;
    }
    if (isCaller) {
      return <PhoneOutgoing className="w-4 h-4 text-primary" />;
    }
    return <PhoneIncoming className="w-4 h-4 text-green-500" />;
  };

  const getOtherPerson = (call: (typeof calls)[0]) => {
    const isCaller = call.caller_id === user?.id;
    return isCaller ? call.receiverProfile : call.callerProfile;
  };

  const getOtherUserId = (call: (typeof calls)[0]) => {
    return call.caller_id === user?.id ? call.receiver_id : call.caller_id;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <h1 className="text-2xl font-display font-bold text-gradient-primary">
          Panggilan
        </h1>
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : calls.length > 0 ? (
          <div className="space-y-2">
            {calls.map((call, index) => {
              const otherPerson = getOtherPerson(call);
              const otherUserId = getOtherUserId(call);
              
              return (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-card transition-all"
                >
                  <Avatar
                    src={otherPerson?.avatar_url || undefined}
                    name={otherPerson?.name || 'Unknown'}
                    size="md"
                    showStatus={false}
                  />

                  <div className="flex-1">
                    <h3
                      className={`font-display font-semibold ${
                        call.status === 'missed' ? 'text-destructive' : 'text-foreground'
                      }`}
                    >
                      {otherPerson?.name || 'Unknown'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getCallIcon(call)}
                      <span className="capitalize">{call.type}</span>
                      {call.duration_seconds && call.duration_seconds > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(call.duration_seconds)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {call.started_at
                          ? formatDistanceToNow(new Date(call.started_at), {
                              addSuffix: true,
                              locale: id,
                            })
                          : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onCall(otherUserId, 'voice')}
                      className="w-10 h-10 rounded-full bg-card hover:bg-primary/20 flex items-center justify-center transition-colors"
                    >
                      <Phone className="w-5 h-5 text-primary" />
                    </button>
                    <button
                      onClick={() => onCall(otherUserId, 'video')}
                      className="w-10 h-10 rounded-full bg-card hover:bg-primary/20 flex items-center justify-center transition-colors"
                    >
                      <Video className="w-5 h-5 text-primary" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
              <Phone className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              Belum Ada Riwayat
            </h2>
            <p className="text-muted-foreground">
              Panggilan terbaru Anda akan muncul di sini
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
