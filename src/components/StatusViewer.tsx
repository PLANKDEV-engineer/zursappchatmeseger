import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useStatuses } from '@/hooks/useStatuses';

interface StatusViewerProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: any[];
  onView: (statusId: string) => void;
}

export function StatusViewer({ isOpen, onClose, statuses, onView }: StatusViewerProps) {
  const { user, profile } = useAuth();
  const { deleteStatus } = useStatuses(user?.id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStatus = statuses[currentIndex];
  const isMyStatus = currentStatus?.user_id === user?.id;

  const goToNext = useCallback(() => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, statuses.length, onClose]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || !currentStatus) return;

    const duration = currentStatus.type === 'video' ? 30000 : 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    // Mark as viewed
    onView(currentStatus.id);

    return () => clearInterval(timer);
  }, [isOpen, currentStatus, currentIndex, goToNext, onView]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!currentStatus) return;
    await deleteStatus(currentStatus.id);
    goToNext();
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const statusDate = new Date(date);
    const diff = now.getTime() - statusDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 0) return `${hours}j lalu`;
    if (minutes > 0) return `${minutes}m lalu`;
    return 'Baru saja';
  };

  if (!currentStatus) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-50 flex flex-col"
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
            {statuses.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{
                    width: index < currentIndex ? '100%' :
                           index === currentIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <header className="flex items-center justify-between p-4 pt-8 z-10">
            <div className="flex items-center gap-3">
              <Avatar
                src={isMyStatus ? profile?.avatar_url || undefined : currentStatus.profile?.avatar_url}
                name={isMyStatus ? profile?.name : currentStatus.profile?.name}
                size="sm"
              />
              <div>
                <h3 className="font-medium text-white text-sm">
                  {isMyStatus ? 'Status Saya' : currentStatus.profile?.name}
                </h3>
                <p className="text-xs text-white/60">{formatTime(currentStatus.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isMyStatus && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDelete}
                  className="text-white hover:bg-white/10"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Navigation Areas */}
            <button
              onClick={goToPrev}
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
              disabled={currentIndex === 0}
            />
            <button
              onClick={goToNext}
              className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            />

            {currentStatus.type === 'text' ? (
              <div
                className="w-full h-full flex items-center justify-center p-8"
                style={{ backgroundColor: currentStatus.background_color || '#1a1a2e' }}
              >
                <p
                  className="text-2xl font-medium text-center"
                  style={{ color: currentStatus.text_color || '#ffffff' }}
                >
                  {currentStatus.content}
                </p>
              </div>
            ) : currentStatus.type === 'image' ? (
              <img
                src={currentStatus.media_url}
                alt="Status"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={currentStatus.media_url}
                autoPlay
                className="max-w-full max-h-full"
                onEnded={goToNext}
              />
            )}
          </div>

          {/* Caption (for media) */}
          {currentStatus.caption && currentStatus.type !== 'text' && (
            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-center">{currentStatus.caption}</p>
            </div>
          )}

          {/* Viewers (for own status) */}
          {isMyStatus && (
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-2 text-white/60">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{currentStatus.viewCount || 0} dilihat</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
