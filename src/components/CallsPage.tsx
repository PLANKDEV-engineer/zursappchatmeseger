import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react';
import { Avatar } from '@/components/Avatar';

interface CallsPageProps {
  onCall: (userId: string, type: 'voice' | 'video') => void;
}

// Demo call history
const demoCalls = [
  {
    id: '1',
    userId: 'user1',
    name: 'John Doe',
    avatar: undefined,
    type: 'incoming' as const,
    callType: 'voice' as const,
    time: '10:30 AM',
    date: 'Today',
    missed: false,
  },
  {
    id: '2',
    userId: 'user2',
    name: 'Jane Smith',
    avatar: undefined,
    type: 'outgoing' as const,
    callType: 'video' as const,
    time: '9:15 AM',
    date: 'Today',
    missed: false,
  },
  {
    id: '3',
    userId: 'user3',
    name: 'Alex Johnson',
    avatar: undefined,
    type: 'incoming' as const,
    callType: 'voice' as const,
    time: '8:00 PM',
    date: 'Yesterday',
    missed: true,
  },
];

export function CallsPage({ onCall }: CallsPageProps) {
  const getCallIcon = (call: (typeof demoCalls)[0]) => {
    if (call.missed) {
      return <PhoneMissed className="w-4 h-4 text-destructive" />;
    }
    if (call.type === 'incoming') {
      return <PhoneIncoming className="w-4 h-4 text-success" />;
    }
    return <PhoneOutgoing className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <h1 className="text-2xl font-display font-bold text-gradient-primary">
          Calls
        </h1>
      </header>

      <main className="flex-1 p-4">
        {demoCalls.length > 0 ? (
          <div className="space-y-2">
            {demoCalls.map((call, index) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-card transition-all"
              >
                <Avatar
                  src={call.avatar}
                  name={call.name}
                  size="md"
                  showStatus={false}
                />

                <div className="flex-1">
                  <h3
                    className={`font-display font-semibold ${
                      call.missed ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {call.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getCallIcon(call)}
                    <span>{call.date}</span>
                    <span>•</span>
                    <span>{call.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCall(call.userId, 'voice')}
                    className="w-10 h-10 rounded-full bg-card hover:bg-primary/20 flex items-center justify-center transition-colors"
                  >
                    <Phone className="w-5 h-5 text-primary" />
                  </button>
                  <button
                    onClick={() => onCall(call.userId, 'video')}
                    className="w-10 h-10 rounded-full bg-card hover:bg-primary/20 flex items-center justify-center transition-colors"
                  >
                    <Video className="w-5 h-5 text-primary" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
              <Phone className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              No Call History
            </h2>
            <p className="text-muted-foreground">
              Your recent calls will appear here
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
