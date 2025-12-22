export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
      }
      team_spaces: {
        Row: {
          id: string
          name: string
          icon: string | null
          created_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          created_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          created_at?: string
          owner_id?: string
        }
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
        }
        Insert: {
          team_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
        }
        Update: {
          team_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
        }
      }
      pages: {
        Row: {
          id: string
          title: string
          icon: string | null
          cover_image: string | null
          type: 'blank' | 'database' | 'template'
          is_database: boolean
          parent_id: string | null
          team_space_id: string | null
          owner_id: string
          is_favorite: boolean
          position: number
          deleted_at: string | null
          created_at: string
          updated_at: string
          parent_database_id: string | null
        }
        Insert: {
          id?: string
          title?: string
          icon?: string | null
          cover_image?: string | null
          type?: 'blank' | 'database' | 'template'
          parent_id?: string | null
          team_space_id?: string | null
          owner_id: string
          is_favorite?: boolean
          is_database?: boolean
          position?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          parent_database_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          icon?: string | null
          cover_image?: string | null
          type?: 'blank' | 'database' | 'template'
          parent_id?: string | null
          team_space_id?: string | null
          owner_id?: string
          is_favorite?: boolean
          is_database?: boolean
          position?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          parent_database_id?: string | null
        }
      }
      blocks: {
        Row: {
          id: string
          page_id: string
          type: string
          content: Json | null // Changed to Json
          plain_text: string | null // Added
          version: number // Added
          properties: Json
          order: number
          position: number
          deleted_at: string | null
          parent_block_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_id: string
          type: string
          content?: Json | null // Changed to Json
          plain_text?: string | null // Added
          version?: number // Added
          properties?: Json
          order?: number
          position?: number
          deleted_at?: string | null
          parent_block_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          type?: string
          content?: Json | null // Changed to Json
          plain_text?: string | null // Added
          version?: number // Added
          properties?: Json
          order?: number
          position?: number
          deleted_at?: string | null
          parent_block_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      databases: {
        Row: {
          id: string
          page_id: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          description?: string | null
          created_at?: string
        }
      }
      database_properties: {
        Row: {
          id: string
          database_id: string
          name: string
          type: string
          options: Json | null
          config: Json | null
          order: number
          position: number
          deleted_at: string | null
        }
        Insert: {
          id?: string
          database_id: string
          name: string
          type: string
          options?: Json | null
          config?: Json | null
          order?: number
          position?: number
          deleted_at?: string | null
        }
        Update: {
          id?: string
          database_id?: string
          name?: string
          type?: string
          options?: Json | null
          config?: Json | null
          order?: number
          position?: number
          deleted_at?: string | null
        }
      }
      page_property_values: {
        Row: {
          id: string
          page_id: string
          property_id: string
          value: Json | null
        }
        Insert: {
          id?: string
          page_id: string
          property_id: string
          value?: Json | null
        }
        Update: {
          id?: string
          page_id?: string
          property_id?: string
          value?: Json | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          title: string
          date: string
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          date: string
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          date?: string
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      meeting_attendees: {
        Row: {
          meeting_id: string
          user_id: string
        }
        Insert: {
          meeting_id: string
          user_id: string
        }
        Update: {
          meeting_id?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
