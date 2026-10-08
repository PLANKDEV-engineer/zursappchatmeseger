import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  Video,
  FileText,
  Camera,
  Music,
  X,
  Send,
  Mic,
  Square,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface MediaUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (type: string, content: string, mediaUrl?: string) => void;
  chatId: string;
  userId: string;
}

export function MediaUpload({
  isOpen,
  onClose,
  onSend,
  chatId,
  userId,
}: MediaUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const mediaTypes = [
    { type: 'image', icon: Image, label: 'Foto', accept: 'image/*', color: 'text-green-400' },
    { type: 'video', icon: Video, label: 'Video', accept: 'video/*', color: 'text-blue-400' },
    { type: 'file', icon: FileText, label: 'Dokumen', accept: '*/*', color: 'text-purple-400' },
    { type: 'camera', icon: Camera, label: 'Kamera', accept: 'image/*', color: 'text-orange-400' },
    { type: 'audio', icon: Music, label: 'Audio', accept: 'audio/*', color: 'text-pink-400' },
  ];

  const handleFileSelect = (accept: string, useCamera: boolean = false) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      if (useCamera) {
        fileInputRef.current.capture = 'environment';
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images/videos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const uploadFile = async (file: File | Blob, path: string) => {
    const { data, error } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSend = async () => {
    setUploading(true);
    try {
      let mediaUrl: string | undefined;
      let type = 'text';

      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop();
        const path = `${userId}/${chatId}/${Date.now()}.${ext}`;
        mediaUrl = await uploadFile(selectedFile, path);

        if (selectedFile.type.startsWith('image/')) type = 'image';
        else if (selectedFile.type.startsWith('video/')) type = 'video';
        else type = 'file';
      } else if (audioBlob) {
        const path = `${userId}/${chatId}/${Date.now()}.webm`;
        mediaUrl = await uploadFile(audioBlob, path);
        type = 'voice';
      }

      onSend(type, caption || selectedFile?.name || 'Voice message', mediaUrl);
      
      // Reset state
      setSelectedFile(null);
      setPreview(null);
      setCaption('');
      setAudioBlob(null);
      setRecordingTime(0);
      onClose();
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border"
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3" />

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="p-4">
              {!selectedFile && !audioBlob && !isRecording ? (
                <>
                  <h3 className="text-lg font-display font-bold mb-4">Kirim Media</h3>
                  
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    {mediaTypes.map((media) => (
                      <button
                        key={media.type}
                        onClick={() => handleFileSelect(
                          media.accept,
                          media.type === 'camera'
                        )}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <media.icon className={`w-6 h-6 ${media.color}`} />
                        </div>
                        <span className="text-xs text-muted-foreground">{media.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Voice Recording */}
                  <div className="border-t border-border pt-4">
                    <Button
                      variant="outline"
                      onClick={startRecording}
                      className="w-full"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Rekam Pesan Suara
                    </Button>
                  </div>
                </>
              ) : isRecording ? (
                <div className="flex flex-col items-center py-8">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-4"
                  >
                    <Mic className="w-10 h-10 text-destructive" />
                  </motion.div>
                  <p className="text-2xl font-mono mb-4">{formatTime(recordingTime)}</p>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={cancelRecording}>
                      <X className="w-5 h-5 mr-2" />
                      Batal
                    </Button>
                    <Button onClick={stopRecording}>
                      <Square className="w-5 h-5 mr-2" />
                      Selesai
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview */}
                  {preview && (
                    <div className="relative rounded-xl overflow-hidden bg-muted">
                      {selectedFile?.type.startsWith('image/') ? (
                        <img src={preview} alt="Preview" className="w-full max-h-60 object-contain" />
                      ) : selectedFile?.type.startsWith('video/') ? (
                        <video src={preview} controls className="w-full max-h-60" />
                      ) : null}
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreview(null);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-full bg-background/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* File info for documents */}
                  {selectedFile && !preview && (
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                      <FileText className="w-10 h-10 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button onClick={() => setSelectedFile(null)}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Audio preview */}
                  {audioBlob && (
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                      <Mic className="w-10 h-10 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Pesan Suara</p>
                        <p className="text-sm text-muted-foreground">{formatTime(recordingTime)}</p>
                      </div>
                      <button onClick={cancelRecording}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Caption input */}
                  <input
                    type="text"
                    placeholder="Tambahkan keterangan..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full p-3 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                  />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      Batal
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={uploading}
                      className="flex-1"
                    >
                      {uploading ? (
                        <div className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Kirim
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
