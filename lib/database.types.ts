export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type LibraryStatus = "pending" | "approved" | "rejected"
export type LibraryKind = "luau" | "imgui" | "modern"

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          accent: string
          is_moderator: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          accent?: string
          is_moderator?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          accent?: string
          is_moderator?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      libraries: {
        Row: {
          id: string
          slug: string
          name: string
          author: string
          author_id: string
          platform: string
          kind: LibraryKind
          accent: string
          source_url: string
          description: string
          cover_url: string | null
          status: LibraryStatus
          likes_count: number
          views_count: number
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          author: string
          author_id: string
          platform: string
          kind: LibraryKind
          accent: string
          source_url: string
          description?: string
          cover_url?: string | null
          status?: LibraryStatus
          likes_count?: number
          views_count?: number
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          author?: string
          author_id?: string
          platform?: string
          kind?: LibraryKind
          accent?: string
          source_url?: string
          description?: string
          cover_url?: string | null
          status?: LibraryStatus
          likes_count?: number
          views_count?: number
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      library_screenshots: {
        Row: {
          id: string
          library_id: string
          url: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          library_id: string
          url: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          library_id?: string
          url?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      library_likes: {
        Row: {
          user_id: string
          library_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          library_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          library_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_moderator: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      library_status: LibraryStatus
      library_kind: LibraryKind
    }
    CompositeTypes: Record<string, never>
  }
}
