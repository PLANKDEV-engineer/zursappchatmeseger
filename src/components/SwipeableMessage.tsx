import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Reply } from 'lucide-react';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeReply: () => void;
  isMe: boolean;
}

export function SwipeableMessage({ children, onSwipeReply, isMe }: SwipeableMessageProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Show reply icon as user swipes
  const replyOpacity = useTransform(x, [0, 50], [0, 1]);
  const replyScale = useTransform(x, [0, 50], [0.5, 1]);
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x > 60) {
      onSwipeReply();
    }
  };

  return (
    <div className="relative overflow-visible">
      {/* Reply indicator */}
      <motion.div
        className={`absolute top-1/2 -translate-y-1/2 ${isMe ? 'right-full mr-2' : 'left-0 -translate-x-10'}`}
        style={{ opacity: replyOpacity, scale: replyScale }}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Reply className="w-4 h-4 text-primary" />
        </div>
      </motion.div>
      
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 80 }}
        dragElastic={{ left: 0, right: 0.3 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`cursor-grab active:cursor-grabbing ${isDragging ? 'z-10' : ''}`}
      >
        {children}
      </motion.div>
    </div>
  );
}