export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_blocks: {
        Row: {
          appeal_message: string | null
          appeal_status: Database["public"]["Enums"]["appeal_status"] | null
          blocked_at: string
          blocked_by: string | null
          duration_hours: number | null
          expires_at: string | null
          id: string
          lifted_at: string | null
          reason: string | null
          status: Database["public"]["Enums"]["block_status"] | null
          user_id: string
        }
        Insert: {
          appeal_message?: string | null
          appeal_status?: Database["public"]["Enums"]["appeal_status"] | null
          blocked_at?: string
          blocked_by?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["block_status"] | null
          user_id: string
        }
        Update: {
          appeal_message?: string | null
          appeal_status?: Database["public"]["Enums"]["appeal_status"] | null
          blocked_at?: string
          blocked_by?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["block_status"] | null
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          attachments: Json
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          attachments?: Json
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      call_history: {
        Row: {
          caller_id: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          receiver_id: string
          started_at: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          caller_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          receiver_id: string
          started_at?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          caller_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          receiver_id?: string
          started_at?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      chat_blocks: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          chat_id: string
          duration_hours: number | null
          expires_at: string | null
          id: string
          lifted_at: string | null
          reason: string
          status: string
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          chat_id: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          reason: string
          status?: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          chat_id?: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_blocks_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_id: string
          id: string
          is_admin: boolean | null
          is_archived: boolean | null
          is_muted: boolean | null
          is_owner: boolean | null
          is_pinned: boolean | null
          is_starred: boolean | null
          joined_at: string
          unread_count: number | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          is_admin?: boolean | null
          is_archived?: boolean | null
          is_muted?: boolean | null
          is_owner?: boolean | null
          is_pinned?: boolean | null
          is_starred?: boolean | null
          joined_at?: string
          unread_count?: number | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          is_admin?: boolean | null
          is_archived?: boolean | null
          is_muted?: boolean | null
          is_owner?: boolean | null
          is_pinned?: boolean | null
          is_starred?: boolean | null
          joined_at?: string
          unread_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reports: {
        Row: {
          chat_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          allow_reactions: boolean | null
          avatar_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          followers_count: number | null
          id: string
          invite_link: string | null
          is_closed: boolean | null
          is_official: boolean | null
          name: string | null
          only_admins_can_send: boolean | null
          type: Database["public"]["Enums"]["chat_type"]
          updated_at: string | null
        }
        Insert: {
          allow_reactions?: boolean | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          followers_count?: number | null
          id?: string
          invite_link?: string | null
          is_closed?: boolean | null
          is_official?: boolean | null
          name?: string | null
          only_admins_can_send?: boolean | null
          type?: Database["public"]["Enums"]["chat_type"]
          updated_at?: string | null
        }
        Update: {
          allow_reactions?: boolean | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          followers_count?: number | null
          id?: string
          invite_link?: string | null
          is_closed?: boolean | null
          is_official?: boolean | null
          name?: string | null
          only_admins_can_send?: boolean | null
          type?: Database["public"]["Enums"]["chat_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          contact_user_id: string | null
          created_at: string
          id: string
          is_saved: boolean | null
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          contact_user_id?: string | null
          created_at?: string
          id?: string
          is_saved?: boolean | null
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          contact_user_id?: string | null
          created_at?: string
          id?: string
          is_saved?: boolean | null
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          message_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          message_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          deleted_for_everyone: boolean | null
          id: string
          is_deleted: boolean | null
          is_starred: boolean | null
          media_url: string | null
          reply_to_id: string | null
          sender_id: string | null
          starred_by: string[] | null
          status: Database["public"]["Enums"]["message_status"] | null
          type: Database["public"]["Enums"]["message_type"] | null
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          deleted_for_everyone?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_starred?: boolean | null
          media_url?: string | null
          reply_to_id?: string | null
          sender_id?: string | null
          starred_by?: string[] | null
          status?: Database["public"]["Enums"]["message_status"] | null
          type?: Database["public"]["Enums"]["message_type"] | null
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          deleted_for_everyone?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_starred?: boolean | null
          media_url?: string | null
          reply_to_id?: string | null
          sender_id?: string | null
          starred_by?: string[] | null
          status?: Database["public"]["Enums"]["message_status"] | null
          type?: Database["public"]["Enums"]["message_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string
          description: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          name: string
          phone: string | null
          public_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          name: string
          phone?: string | null
          public_id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          name?: string
          phone?: string | null
          public_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      status_viewers: {
        Row: {
          id: string
          status_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          status_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          status_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_viewers_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          background_color: string | null
          caption: string | null
          content: string | null
          created_at: string
          excluded_contacts: string[] | null
          expires_at: string | null
          font_family: string | null
          id: string
          media_url: string | null
          music_url: string | null
          text_color: string | null
          type: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
        }
        Insert: {
          background_color?: string | null
          caption?: string | null
          content?: string | null
          created_at?: string
          excluded_contacts?: string[] | null
          expires_at?: string | null
          font_family?: string | null
          id?: string
          media_url?: string | null
          music_url?: string | null
          text_color?: string | null
          type?: string | null
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Update: {
          background_color?: string | null
          caption?: string | null
          content?: string | null
          created_at?: string
          excluded_contacts?: string[] | null
          expires_at?: string | null
          font_family?: string | null
          id?: string
          media_url?: string | null
          music_url?: string | null
          text_color?: string | null
          type?: string | null
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Relationships: []
      }
      typing_status: {
        Row: {
          chat_id: string
          id: string
          is_typing: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_status_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      user_is_chat_member: {
        Args: { p_chat_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      appeal_status: "none" | "pending" | "approved" | "rejected"
      block_status: "active" | "expired" | "lifted"
      chat_type: "private" | "group" | "channel"
      message_status: "sending" | "sent" | "delivered" | "read"
      message_type: "text" | "image" | "video" | "voice" | "file" | "poll"
      report_reason: "spam" | "sexual" | "scam" | "illegal" | "hack" | "other"
      visibility_type: "all" | "contacts" | "contacts_except" | "only_me"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      appeal_status: ["none", "pending", "approved", "rejected"],
      block_status: ["active", "expired", "lifted"],
      chat_type: ["private", "group", "channel"],
      message_status: ["sending", "sent", "delivered", "read"],
      message_type: ["text", "image", "video", "voice", "file", "poll"],
      report_reason: ["spam", "sexual", "scam", "illegal", "hack", "other"],
      visibility_type: ["all", "contacts", "contacts_except", "only_me"],
    },
  },
} as const
