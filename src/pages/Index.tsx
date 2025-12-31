import React, { useState } from 'react';
import { MessageCircle, Radio, Phone, Settings } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { AuthPage } from '@/pages/AuthPage';
import { ChatDashboard } from '@/components/ChatDashboard';
import { ChatRoom } from '@/components/ChatRoom';
import { StatusPage } from '@/components/StatusPage';
import { CallsPage } from '@/components/CallsPage';
import { SettingsPage } from '@/components/SettingsPage';
import { BottomNav } from '@/components/BottomNav';
import { Chat } from '@/types';
import { Toaster } from '@/components/ui/toaster';

type View = 'chats' | 'status' | 'calls' | 'settings' | 'chat-room';

const navItems = [
  { icon: MessageCircle, label: 'Chats', path: 'chats' },
  { icon: Radio, label: 'Status', path: 'status' },
  { icon: Phone, label: 'Calls', path: 'calls' },
  { icon: Settings, label: 'Settings', path: 'settings' },
];

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<View>('chats');
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeNavIndex, setActiveNavIndex] = useState(0);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleNavigate = (index: number) => {
    setActiveNavIndex(index);
    setCurrentView(navItems[index].path as View);
    setActiveChat(null);
  };

  const handleChatSelect = (chat: Chat) => {
    setActiveChat(chat);
    setCurrentView('chat-room');
  };

  const handleBackFromChat = () => {
    setActiveChat(null);
    setCurrentView('chats');
  };

  return (
    <div className="min-h-screen bg-background">
      {currentView === 'chats' && !activeChat && (
        <ChatDashboard
          onChatSelect={handleChatSelect}
          onAddContact={() => {}}
          onAddGroup={() => {}}
          onAddChannel={() => {}}
          onSettings={() => handleNavigate(3)}
        />
      )}

      {currentView === 'chat-room' && activeChat && (
        <ChatRoom
          chat={activeChat}
          onBack={handleBackFromChat}
          onCall={() => {}}
          onVideoCall={() => {}}
          onInfo={() => {}}
        />
      )}

      {currentView === 'status' && (
        <StatusPage onViewStatus={() => {}} onCreateStatus={() => {}} />
      )}

      {currentView === 'calls' && <CallsPage onCall={() => {}} />}

      {currentView === 'settings' && <SettingsPage onEditProfile={() => {}} />}

      {currentView !== 'chat-room' && (
        <BottomNav
          items={navItems}
          activeIndex={activeNavIndex}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

const Index = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppContent />
        <Toaster />
      </ChatProvider>
    </AuthProvider>
  );
};

export default Index;
