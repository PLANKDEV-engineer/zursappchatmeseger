import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useStatuses } from '@/hooks/useStatuses';
import { supabase } from '@/integrations/supabase/client';

interface StatusViewerProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: any[];
  onView: (statusId: string) => void;
}

interface Viewer {
  viewer_id: string;
  viewed_at: string;
  name: string;
  avatar_url: string | null;
}

export function StatusViewer({ isOpen, onClose, statuses, onView }: StatusViewerProps) {
  const { user, profile } = useAuth();
  const { deleteStatus } = useStatuses(user?.id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

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
    if (!isOpen || !currentStatus || showViewers) return;

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
  }, [isOpen, currentStatus, currentIndex, goToNext, onView, showViewers]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setProgress(0);
      setShowViewers(false);
    }
  }, [isOpen]);

  // Fetch viewers when showing viewers panel
  const fetchViewers = async () => {
    if (!currentStatus) return;
    setLoadingViewers(true);
    try {
      const { data, error } = await supabase
        .from('status_viewers')
        .select('viewer_id, viewed_at')
        .eq('status_id', currentStatus.id)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for viewers
      const viewersWithProfiles: Viewer[] = [];
      for (const v of data || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('user_id', v.viewer_id)
          .single();

        viewersWithProfiles.push({
          viewer_id: v.viewer_id,
          viewed_at: v.viewed_at,
          name: profile?.name || 'Unknown',
          avatar_url: profile?.avatar_url,
        });
      }

      setViewers(viewersWithProfiles);
    } catch (err) {
      console.error('Error fetching viewers:', err);
    } finally {
      setLoadingViewers(false);
    }
  };

  useEffect(() => {
    if (showViewers && isMyStatus) {
      fetchViewers();
    }
  }, [showViewers, currentStatus?.id]);

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

  const formatDetailedTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Swipe handler for viewers panel
  const handleSwipeUp = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isMyStatus && info.offset.y < -50) {
      setShowViewers(true);
    }
  };

  const handleSwipeDown = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 50) {
      setShowViewers(false);
    }
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
          <motion.div 
            className="flex-1 flex items-center justify-center relative"
            drag={isMyStatus ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleSwipeUp}
          >
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
          </motion.div>

          {/* Caption (for media) */}
          {currentStatus.caption && currentStatus.type !== 'text' && (
            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-center">{currentStatus.caption}</p>
            </div>
          )}

          {/* Viewers hint (for own status) */}
          {isMyStatus && !showViewers && (
            <div 
              className="p-4 bg-gradient-to-t from-black/80 to-transparent cursor-pointer"
              onClick={() => setShowViewers(true)}
            >
              <div className="flex items-center justify-center gap-2 text-white/60">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{currentStatus.viewCount || 0} dilihat</span>
              </div>
              <p className="text-xs text-white/40 text-center mt-1">
                Geser ke atas untuk melihat penonton
              </p>
            </div>
          )}

          {/* Viewers Panel (swipe up) */}
          <AnimatePresence>
            {showViewers && isMyStatus && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleSwipeDown}
                className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[60vh] overflow-hidden"
              >
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3" />
                
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-lg">
                      Dilihat oleh ({viewers.length})
                    </h3>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(60vh-80px)]">
                  {loadingViewers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  ) : viewers.length > 0 ? (
                    <div className="divide-y divide-border/30">
                      {viewers.map((viewer) => (
                        <div
                          key={viewer.viewer_id}
                          className="flex items-center gap-3 p-4"
                        >
                          <Avatar
                            src={viewer.avatar_url || undefined}
                            name={viewer.name}
                            size="sm"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{viewer.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDetailedTime(viewer.viewed_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Eye className="w-10 h-10 mb-2 opacity-50" />
                      <p>Belum ada yang melihat</p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewers(false)}
                    className="w-full"
                  >
                    Tutup
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}