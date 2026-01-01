import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PollCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (question: string, options: string[]) => void;
}

export function PollCreator({ isOpen, onClose, onCreatePoll }: PollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    const validOptions = options.filter(o => o.trim());
    if (question.trim() && validOptions.length >= 2) {
      onCreatePoll(question.trim(), validOptions);
      setQuestion('');
      setOptions(['', '']);
      onClose();
    }
  };

  const isValid = question.trim() && options.filter(o => o.trim()).length >= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-display font-bold">Buat Polling</h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-foreground">Pertanyaan</label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Tulis pertanyaan polling..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Pilihan</label>
                <div className="space-y-2 mt-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Pilihan ${index + 1}`}
                      />
                      {options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {options.length < 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="mt-2 w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Pilihan
                  </Button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!isValid}
                className="flex-1"
              >
                Buat Polling
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Poll display component
interface PollDisplayProps {
  question: string;
  options: { text: string; votes: number; voters: string[] }[];
  totalVotes: number;
  userVote?: number;
  onVote: (optionIndex: number) => void;
}

export function PollDisplay({
  question,
  options,
  totalVotes,
  userVote,
  onVote,
}: PollDisplayProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-primary" />
        <span className="text-xs font-medium text-primary">POLLING</span>
      </div>
      
      <h4 className="font-medium text-foreground mb-4">{question}</h4>
      
      <div className="space-y-2">
        {options.map((option, index) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isSelected = userVote === index;
          
          return (
            <button
              key={index}
              onClick={() => onVote(index)}
              disabled={userVote !== undefined}
              className={`w-full p-3 rounded-lg border transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {userVote !== undefined && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className="absolute left-0 top-0 bottom-0 bg-primary/20"
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="font-medium">{option.text}</span>
                {userVote !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <p className="text-xs text-muted-foreground mt-3">
        {totalVotes} suara
      </p>
    </div>
  );
}
