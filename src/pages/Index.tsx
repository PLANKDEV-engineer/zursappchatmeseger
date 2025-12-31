import React, { useState } from 'react';
import { MessageCircle, Radio, Phone, Settings, Shield } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useAuth';
import { ChatProvider } from '@/context/ChatContext';
import { AuthPage } from '@/pages/AuthPage';
import { ChatDashboard } from '@/components/ChatDashboard';
import { StatusPage } from '@/components/StatusPage';
import { CallsPage } from '@/components/CallsPage';
import { SettingsPage } from '@/components/SettingsPage';
import { BottomNav } from '@/components/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton';

type View = 'chats' | 'status' | 'calls' | 'settings';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse" />
      <div className="space-y-2 w-48">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useSupabaseAuth();
  const [currentView, setCurrentView] = useState<View>('chats');
  const [activeNavIndex, setActiveNavIndex] = useState(0);

  const navItems = [
    { icon: MessageCircle, label: 'Chats', path: 'chats' },
    { icon: Radio, label: 'Status', path: 'status' },
    { icon: Phone, label: 'Calls', path: 'calls' },
    { icon: Settings, label: 'Settings', path: 'settings' },
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleNavigate = (index: number) => {
    setActiveNavIndex(index);
    setCurrentView(navItems[index].path as View);
  };

  return (
    <div className="min-h-screen bg-background">
      {currentView === 'chats' && (
        <ChatDashboard
          onChatSelect={() => {}}
          onAddContact={() => {}}
          onAddGroup={() => {}}
          onAddChannel={() => {}}
          onSettings={() => handleNavigate(3)}
        />
      )}

      {currentView === 'status' && (
        <StatusPage onViewStatus={() => {}} onCreateStatus={() => {}} />
      )}

      {currentView === 'calls' && <CallsPage onCall={() => {}} />}

      {currentView === 'settings' && <SettingsPage onEditProfile={() => {}} />}

      <BottomNav
        items={navItems}
        activeIndex={activeNavIndex}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

const Index = () => {
  return (
    <ChatProvider>
      <AppContent />
      <Toaster />
    </ChatProvider>
  );
};

export default Index;
