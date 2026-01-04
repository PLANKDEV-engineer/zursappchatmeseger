import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LocationShareProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (location: { lat: number; lng: number; address: string }) => void;
}

interface LocationData {
  lat: number;
  lng: number;
  address: string;
  accuracy: number;
}

export function LocationShare({ isOpen, onClose, onShare }: LocationShareProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestLocation();
    }
  }, [isOpen]);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    if (!navigator.geolocation) {
      setError('Geolokasi tidak didukung di browser ini');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Try to get address from coordinates using reverse geocoding
        let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        try {
          // Using a free geocoding API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data.display_name) {
            address = data.display_name;
          }
        } catch (e) {
          console.log('Geocoding failed, using coordinates');
        }

        setLocation({
          lat: latitude,
          lng: longitude,
          address,
          accuracy,
        });
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setPermissionDenied(true);
            setError('Izin lokasi ditolak. Aktifkan lokasi di pengaturan browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Informasi lokasi tidak tersedia.');
            break;
          case error.TIMEOUT:
            setError('Permintaan lokasi timeout. Coba lagi.');
            break;
          default:
            setError('Gagal mendapatkan lokasi.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleShare = () => {
    if (location) {
      onShare({
        lat: location.lat,
        lng: location.lng,
        address: location.address,
      });
      toast.success('Lokasi berhasil dibagikan');
      onClose();
    }
  };

  const openInMaps = () => {
    if (location) {
      window.open(
        `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        '_blank'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border p-6"
        >
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold">Bagikan Lokasi</h2>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Mendapatkan lokasi...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-destructive mb-4">{error}</p>
              {permissionDenied ? (
                <p className="text-sm text-muted-foreground mb-4">
                  Buka pengaturan browser dan izinkan akses lokasi untuk situs ini
                </p>
              ) : null}
              <Button onClick={requestLocation} variant="outline">
                <Navigation className="w-4 h-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          )}

          {location && !loading && (
            <div className="space-y-4">
              {/* Map Preview */}
              <div className="w-full h-48 rounded-xl overflow-hidden bg-muted relative">
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l+3b82f6(${location.lng},${location.lat})/${location.lng},${location.lat},15,0/400x200@2x?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG0xbGZ4YXQwMDFjM2RwZ3N0Zzd5YjBxIn0.q8RVP3xq8jBD-T7x7v6CvA`}
                  alt="Map preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x200/1a1a2e/ffffff?text=${encodeURIComponent(location.lat.toFixed(4) + ', ' + location.lng.toFixed(4))}`;
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground line-clamp-2">{location.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Akurasi: ±{Math.round(location.accuracy)}m
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={openInMaps} className="flex-1">
                  <Navigation className="w-4 h-4 mr-2" />
                  Buka di Maps
                </Button>
                <Button onClick={handleShare} className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Bagikan
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}