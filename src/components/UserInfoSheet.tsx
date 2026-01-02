import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, Phone, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";

export interface UserInfoSheetUser {
  user_id: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
  public_id?: string;
}

interface UserInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserInfoSheetUser | null;
  onChat?: (userId: string) => void;
}

export function UserInfoSheet({ isOpen, onClose, user, onChat }: UserInfoSheetProps) {
  if (!user) return null;

  const userIdDerived = user.phone ? user.phone.replace(/\D/g, "").slice(-11) : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed inset-0 bg-background z-50 flex flex-col"
        >
          <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
            <div className="flex items-center gap-3 p-4">
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-display font-bold">Info Akun</h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center py-8 px-4">
              <Avatar
                src={user.avatar_url || undefined}
                name={user.name}
                size="xl"
                showStatus={false}
              />

              <h2 className="text-2xl font-display font-bold text-foreground mt-4 text-center">
                {user.name}
              </h2>

              {onChat && (
                <Button
                  className="mt-5 w-full max-w-xs"
                  onClick={() => {
                    onChat(user.user_id);
                    onClose();
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              )}
            </div>

            <section className="px-4 space-y-3 pb-8">
              <div className="bg-card rounded-xl border border-border/50 p-4 space-y-4">
                {(user.public_id || userIdDerived) && (
                  <div className="flex items-center gap-3">
                    <AtSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="text-foreground font-mono">
                        {user.public_id || userIdDerived}
                      </p>
                    </div>
                  </div>
                )}

                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telepon</p>
                      <p className="text-foreground">{user.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
