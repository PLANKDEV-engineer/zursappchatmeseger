import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  X, Camera, SwitchCamera, Zap, ZapOff, 
  Image as ImageIcon, Send, Check, Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CameraPageProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSendToChat?: (mediaUrl: string, type: 'image' | 'video') => void;
  onPostStatus?: (mediaUrl: string, type: 'image' | 'video') => void;
}

export function CameraPage({ 
  isOpen, 
  onClose, 
  userId, 
  onSendToChat,
  onPostStatus 
}: CameraPageProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flash, setFlash] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isRecording, setIsRecording] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [galleryItems, setGalleryItems] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [showActions, setShowActions] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Tidak dapat mengakses kamera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedMedia(dataUrl);
    setMediaType('image');
    setShowActions(true);
  };

  const startRecording = () => {
    if (!stream) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setCapturedMedia(url);
      setMediaType('video');
      setShowActions(true);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!capturedMedia) return;

    try {
      // Convert data URL to blob
      const response = await fetch(capturedMedia);
      const blob = await response.blob();
      
      const fileName = `${userId}/${Date.now()}.${mediaType === 'image' ? 'jpg' : 'webm'}`;
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, blob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Gagal mengupload media');
      return null;
    }
  };

  const handleSendToChat = async () => {
    const url = await handleUpload();
    if (url && onSendToChat) {
      onSendToChat(url, mediaType);
      handleDiscard();
      onClose();
    }
  };

  const handlePostStatus = async () => {
    const url = await handleUpload();
    if (url && onPostStatus) {
      onPostStatus(url, mediaType);
      handleDiscard();
      onClose();
    }
  };

  const handleDiscard = () => {
    setCapturedMedia(null);
    setShowActions(false);
    setSelectedMedia([]);
  };

  const handleGallerySwipe = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -50) {
      setShowGallery(true);
    }
  };

  const toggleMediaSelection = (url: string) => {
    setSelectedMedia(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      }
      if (prev.length >= 5) {
        toast.error('Maksimal 5 media');
        return prev;
      }
      return [...prev, url];
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Camera View */}
      {!capturedMedia && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
              <X className="w-6 h-6" />
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setFlash(!flash)}
                className="text-white"
              >
                {flash ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={switchCamera} className="text-white">
                <SwitchCamera className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Bottom Controls */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 p-6"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleGallerySwipe}
          >
            <div className="flex items-center justify-center gap-8">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white"
                onClick={() => setShowGallery(true)}
              >
                <ImageIcon className="w-6 h-6" />
              </Button>

              {/* Capture Button */}
              <button
                onClick={isRecording ? stopRecording : capturePhoto}
                onTouchStart={() => {
                  const timer = setTimeout(() => {
                    startRecording();
                  }, 500);
                  return () => clearTimeout(timer);
                }}
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                  isRecording ? 'bg-red-500' : 'bg-transparent'
                }`}
              >
                <div className={`rounded-full transition-all ${
                  isRecording ? 'w-8 h-8 bg-white rounded-md' : 'w-16 h-16 bg-white'
                }`} />
              </button>

              <div className="w-10" />
            </div>

            <p className="text-center text-white/70 text-sm mt-4">
              Geser ke atas untuk galeri
            </p>
          </motion.div>
        </>
      )}

      {/* Preview */}
      {capturedMedia && (
        <div className="relative w-full h-full">
          {mediaType === 'image' ? (
            <img src={capturedMedia} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video src={capturedMedia} controls className="w-full h-full object-cover" />
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleDiscard}
                className="rounded-full"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Hapus
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={handlePostStatus}
                className="rounded-full"
              >
                <Camera className="w-5 h-5 mr-2" />
                Status
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={handleSendToChat}
                className="rounded-full bg-primary"
              >
                <Send className="w-5 h-5 mr-2" />
                Kirim
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute inset-0 bg-background"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Button variant="ghost" size="icon-sm" onClick={() => setShowGallery(false)}>
                <X className="w-5 h-5" />
              </Button>
              <h2 className="font-display font-bold">Galeri ({selectedMedia.length}/5)</h2>
              {selectedMedia.length > 0 && (
                <Button size="sm" onClick={() => {
                  // Handle selected media
                  toast.success(`${selectedMedia.length} media dipilih`);
                  setShowGallery(false);
                }}>
                  <Check className="w-4 h-4 mr-1" />
                  Pilih
                </Button>
              )}
            </div>
            
            <div className="p-2 grid grid-cols-3 gap-1 overflow-y-auto max-h-[calc(100vh-80px)]">
              {/* Placeholder for gallery items */}
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center p-2">
                  Galeri perangkat akan muncul di sini
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
