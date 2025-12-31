import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/useAuth';

type AuthStep = 'choice' | 'login' | 'signup' | 'profile';

export function AuthPage() {
  const { toast } = useToast();
  const { signIn, signUp, updateProfile } = useSupabaseAuth();
  
  const [step, setStep] = useState<AuthStep>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: 'Missing Fields',
        description: 'Please enter your email and password',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Email or password is incorrect' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome Back!',
        description: 'Successfully logged in',
      });
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, name);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Account Exists',
          description: 'This email is already registered. Please login instead.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Welcome to ZursApp!',
        description: 'Your account has been created successfully',
      });
    }
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
        {step !== 'choice' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep('choice')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1 flex justify-center">
          <Logo size="lg" />
        </div>
        {step !== 'choice' && <div className="w-10" />}
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <AnimatePresence mode="wait">
          {/* Choice Step */}
          {step === 'choice' && (
            <motion.div
              key="choice"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-md space-y-8"
            >
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-display font-bold text-gradient-primary">
                  Welcome to ZursApp
                </h1>
                <p className="text-muted-foreground text-lg">
                  The next generation messaging platform
                </p>
              </div>

              <div className="space-y-4 pt-8">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep('login')}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Login with Email
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-primary/50 hover:bg-primary/10"
                  onClick={() => setStep('signup')}
                >
                  <User className="w-5 h-5 mr-2" />
                  Create Account
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground pt-8">
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

          {/* Login Step */}
          {step === 'login' && (
            <motion.div
              key="login"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-md space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-display font-bold text-gradient-primary">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground">
                  Login to your account
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      variant="glow"
                      className="pl-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      variant="glow"
                      className="pl-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Login
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setStep('signup')}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* Signup Step */}
          {step === 'signup' && (
            <motion.div
              key="signup"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-md space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-display font-bold text-gradient-primary">
                  Create Account
                </h1>
                <p className="text-muted-foreground">
                  Join ZursApp today
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      variant="glow"
                      className="pl-12"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      variant="glow"
                      className="pl-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      variant="glow"
                      className="pl-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">At least 6 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                      variant="glow"
                      className="pl-12"
                    />
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleSignup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    onClick={() => setStep('login')}
                    className="text-primary hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}
