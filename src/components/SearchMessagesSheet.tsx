import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface SearchResult {
  id: string;
  content: string | null;
  created_at: string;
  sender_id: string | null;
  senderProfile?: {
    name: string;
    avatar_url: string | null;
  };
}

interface SearchMessagesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  onScrollToMessage?: (messageId: string) => void;
}

export function SearchMessagesSheet({ 
  isOpen, 
  onClose, 
  chatId,
  onScrollToMessage 
}: SearchMessagesSheetProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      await searchMessages();
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, chatId]);

  const searchMessages = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Enrich with profiles
      const enriched: SearchResult[] = [];
      const profileCache: Record<string, { name: string; avatar_url: string | null }> = {};

      for (const msg of data || []) {
        if (msg.sender_id && !profileCache[msg.sender_id]) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', msg.sender_id)
            .single();
          
          if (profile) {
            profileCache[msg.sender_id] = profile;
          }
        }

        enriched.push({
          ...msg,
          senderProfile: msg.sender_id ? profileCache[msg.sender_id] : undefined,
        });
      }

      setResults(enriched);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (direction: 'up' | 'down') => {
    if (results.length === 0) return;

    const newIndex = direction === 'up' 
      ? (currentIndex - 1 + results.length) % results.length
      : (currentIndex + 1) % results.length;

    setCurrentIndex(newIndex);
    
    if (onScrollToMessage) {
      onScrollToMessage(results[newIndex].id);
    }
  };

  const handleResultClick = (messageId: string, index: number) => {
    setCurrentIndex(index);
    if (onScrollToMessage) {
      onScrollToMessage(messageId);
    }
  };

  const highlightMatch = (text: string | null) => {
    if (!text || !query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/30 text-foreground">{part}</mark>
        : part
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute top-0 left-0 right-0 z-40 bg-background border-b border-border shadow-lg"
        >
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
              
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari pesan..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {results.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1}/{results.length}
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleNavigate('up')}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleNavigate('down')}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Results List */}
          {query.trim() && (
            <div className="max-h-[300px] overflow-y-auto border-t border-border">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Mencari...
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Tidak ditemukan
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.id, index)}
                      className={`w-full p-3 flex items-start gap-3 hover:bg-muted transition-colors text-left ${
                        index === currentIndex ? 'bg-primary/10' : ''
                      }`}
                    >
                      <Avatar
                        src={result.senderProfile?.avatar_url || undefined}
                        name={result.senderProfile?.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {result.senderProfile?.name || 'Unknown'}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(result.created_at), { locale: id })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {highlightMatch(result.content)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
