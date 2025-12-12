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
      pages: {
        Row: {
          id: string
          title: string
          icon: string | null
          cover_image: string | null
          type: 'blank' | 'database' | 'template'
          parent_id: string | null
          team_space_id: string | null
          owner_id: string
          is_favorite: boolean
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
          content: string | null
          properties: Json
          order: number
          parent_block_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_id: string
          type: string
          content?: string | null
          properties?: Json
          order: number
          parent_block_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          type?: string
          content?: string | null
          properties?: Json
          order?: number
          parent_block_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed...
    }
  }
}
