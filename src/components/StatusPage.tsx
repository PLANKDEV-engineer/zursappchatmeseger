import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Logo } from '@/components/Logo';
import { Status } from '@/types';

interface StatusPageProps {
  onViewStatus: (status: Status) => void;
  onCreateStatus: () => void;
}

// Demo statuses
const demoStatuses = [
  {
    id: '1',
    userId: 'user1',
    name: 'John Doe',
    avatar: undefined,
    hasUnviewed: true,
    count: 3,
    time: '10m ago',
  },
  {
    id: '2',
    userId: 'user2',
    name: 'Jane Smith',
    avatar: undefined,
    hasUnviewed: true,
    count: 1,
    time: '1h ago',
  },
  {
    id: '3',
    userId: 'user3',
    name: 'Alex Johnson',
    avatar: undefined,
    hasUnviewed: false,
    count: 2,
    time: '3h ago',
  },
];

export function StatusPage({ onViewStatus, onCreateStatus }: StatusPageProps) {
  const [myStatus] = useState<{
    hasStatus: boolean;
    count: number;
    lastUpdated: string;
  }>({
    hasStatus: false,
    count: 0,
    lastUpdated: '',
  });

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <h1 className="text-2xl font-display font-bold text-gradient-primary">
          Status
        </h1>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* My Status */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            My Status
          </h2>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onCreateStatus}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:bg-card-hover transition-all"
          >
            <div className="relative">
              <Avatar name="You" size="lg" showStatus={false} />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className="text-left">
              <h3 className="font-display font-semibold text-foreground">
                {myStatus.hasStatus ? 'My Status' : 'Add Status'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {myStatus.hasStatus
                  ? `${myStatus.count} updates • ${myStatus.lastUpdated}`
                  : 'Tap to add status update'}
              </p>
            </div>
          </motion.button>
        </section>

        {/* Recent Updates */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Recent Updates
          </h2>
          <div className="space-y-2">
            {demoStatuses.map((status, index) => (
              <motion.button
                key={status.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() =>
                  onViewStatus({
                    id: status.id,
                    userId: status.userId,
                    type: 'text',
                    content: 'Status content',
                    viewers: [],
                    visibility: 'all',
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  })
                }
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-card transition-all"
              >
                <div
                  className={`relative p-0.5 rounded-full ${
                    status.hasUnviewed
                      ? 'bg-gradient-to-br from-primary to-accent'
                      : 'bg-muted'
                  }`}
                >
                  <div className="bg-background rounded-full p-0.5">
                    <Avatar
                      src={status.avatar}
                      name={status.name}
                      size="md"
                      showStatus={false}
                    />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-display font-semibold text-foreground">
                    {status.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{status.time}</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">{status.count}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {demoStatuses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
              <Eye className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              No Status Updates
            </h2>
            <p className="text-muted-foreground">
              Status updates from your contacts will appear here
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
