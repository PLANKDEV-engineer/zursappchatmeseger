import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { CountryPicker } from '@/components/CountryPicker';
import { OtpInput } from '@/components/OtpInput';
import { Avatar } from '@/components/Avatar';
import { countries } from '@/data/countries';
import { Country } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function AuthPage() {
  const { authState, setAuthState, setCurrentUser } = useAuth();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 8) {
      toast({
        title: 'Invalid Number',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const newOtp = generateOtp();
    setGeneratedOtp(newOtp);

    // Simulate SMS sending delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setCountdown(60);
    setAuthState((prev) => ({
      ...prev,
      step: 'otp',
      phone,
      countryCode: selectedCountry.dialCode,
    }));

    toast({
      title: 'Verification Code Sent!',
      description: `Code: ${newOtp} (Demo mode - normally sent via SMS)`,
    });
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (otp === generatedOtp) {
      setIsLoading(false);
      setAuthState((prev) => ({ ...prev, step: 'profile', otpCode: otp }));
      toast({
        title: 'Verified!',
        description: 'Phone number verified successfully',
      });
    } else {
      setIsLoading(false);
      toast({
        title: 'Invalid Code',
        description: 'The verification code is incorrect',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteProfile = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newUser = {
      id: crypto.randomUUID(),
      phone: `${selectedCountry.dialCode}${phone}`,
      countryCode: selectedCountry.dialCode,
      name: name.trim(),
      avatar: avatar || undefined,
      description: description.trim() || undefined,
      isOnline: true,
      createdAt: new Date(),
    };

    setCurrentUser(newUser);
    setAuthState((prev) => ({ ...prev, step: 'complete', user: newUser }));
    setIsLoading(false);

    toast({
      title: 'Welcome to ZursApp!',
      description: 'Your account has been created successfully',
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResendOtp = () => {
    const newOtp = generateOtp();
    setGeneratedOtp(newOtp);
    setCountdown(60);
    toast({
      title: 'Code Resent!',
      description: `New code: ${newOtp} (Demo mode)`,
    });
  };

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col scan-line tech-grid">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex items-center justify-between">
        {authState.step !== 'phone' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setAuthState((prev) => ({
                ...prev,
                step: prev.step === 'profile' ? 'otp' : 'phone',
              }))
            }
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1 flex justify-center">
          <Logo size="lg" />
        </div>
        {authState.step !== 'phone' && <div className="w-10" />}
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Phone Step */}
        {authState.step === 'phone' && (
          <motion.div
            key="phone"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-display font-bold text-gradient-primary">
                Enter Your Phone Number
              </h1>
              <p className="text-muted-foreground">
                We'll send you a verification code via SMS
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <CountryPicker
                  selected={selectedCountry}
                  onSelect={setSelectedCountry}
                />
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  variant="glow"
                  className="flex-1"
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              By continuing, you agree to our{' '}
              <span className="text-primary cursor-pointer hover:underline">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-primary cursor-pointer hover:underline">
                Privacy Policy
              </span>
            </p>
          </motion.div>
        )}

        {/* OTP Step */}
        {authState.step === 'otp' && (
          <motion.div
            key="otp"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-display font-bold text-gradient-primary">
                Verify Your Number
              </h1>
              <p className="text-muted-foreground">
                Enter the 6-digit code sent to{' '}
                <span className="text-foreground font-medium">
                  {authState.countryCode} {authState.phone}
                </span>
              </p>
            </div>

            <div className="space-y-6">
              <OtpInput
                value={otp}
                onChange={setOtp}
                onComplete={handleVerifyOtp}
              />

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend code in{' '}
                    <span className="text-primary font-medium">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-sm text-primary hover:underline"
                  >
                    Resend verification code
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Step */}
        {authState.step === 'profile' && (
          <motion.div
            key="profile"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-display font-bold text-gradient-primary">
                Complete Your Profile
              </h1>
              <p className="text-muted-foreground">
                Tell us a bit about yourself
              </p>
            </div>

            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex justify-center">
                <label className="relative cursor-pointer group">
                  <div className="relative">
                    <Avatar
                      src={avatar || undefined}
                      name={name}
                      size="xl"
                      showStatus={false}
                    />
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        Change
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Your Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  variant="glow"
                  maxLength={50}
                />
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  About (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Write something about yourself..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  variant="glow"
                  maxLength={150}
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleCompleteProfile}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}
