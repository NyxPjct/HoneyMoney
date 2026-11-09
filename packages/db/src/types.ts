/**
 * Database types in the shape produced by `supabase gen types typescript`.
 * Keep in sync with supabase/migrations. Regenerate with:
 *   npx supabase gen types typescript --local > packages/db/src/types.ts
 * (then re-add the helper exports at the bottom).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "user" | "admin";
export type ProjectStatus = "draft" | "generating" | "review" | "published";
export type AgentNameDb = "manager" | "researcher" | "strategist" | "copywriter" | "designer" | "sentinel";
export type AgentRunStatus = "queued" | "running" | "succeeded" | "failed" | "needs_input" | "changes_requested";
export type KeyProvider = "google" | "openai" | "anthropic";
export type ProjectAiProvider = "instance" | KeyProvider;

type Timestamps = { created_at: string; updated_at: string };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          age_confirmed_at: string | null;
          locale: string;
          role: UserRole;
        } & Timestamps;
        Insert: {
          id: string;
          display_name?: string | null;
          age_confirmed_at?: string | null;
          locale?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          age_confirmed_at?: string | null;
          locale?: string;
          role?: UserRole;
        };
        Relationships: [];
      };
      ai_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: KeyProvider;
          secret_id: string;
          last4: string;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          provider: KeyProvider;
          secret_id: string;
          last4: string;
        };
        Update: {
          last4?: string;
        };
        Relationships: [];
      };
      catalog_offers: {
        Row: {
          id: string;
          name: string;
          format: string;
          niche: string;
          language: string;
          price_cents: number | null;
          currency: string | null;
          price_observed_at: string | null;
          active_ads: number | null;
          active_ads_counted_at: string | null;
          funnel: string | null;
          audience: string | null;
          pains: string[];
          page_url: string | null;
          is_published: boolean;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          name: string;
          format: string;
          niche: string;
          language: string;
          price_cents?: number | null;
          currency?: string | null;
          price_observed_at?: string | null;
          active_ads?: number | null;
          active_ads_counted_at?: string | null;
          funnel?: string | null;
          audience?: string | null;
          pains?: string[];
          page_url?: string | null;
          is_published?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["catalog_offers"]["Insert"]>;
        Relationships: [];
      };
      catalog_sources: {
        Row: {
          id: string;
          catalog_offer_id: string;
          field: string;
          value: string;
          source_url: string;
          collected_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          catalog_offer_id: string;
          field: string;
          value: string;
          source_url: string;
          collected_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["catalog_sources"]["Insert"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: ProjectStatus;
          briefing: Json;
          catalog_offer_id: string | null;
          ai_provider: ProjectAiProvider;
          review_each_step: boolean;
          awaiting_agent: AgentNameDb | null;
          last_error: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          status?: ProjectStatus;
          briefing?: Json;
          catalog_offer_id?: string | null;
          ai_provider?: ProjectAiProvider;
          review_each_step?: boolean;
          awaiting_agent?: AgentNameDb | null;
          last_error?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      agent_runs: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          agent: AgentNameDb;
          status: AgentRunStatus;
          round: number;
          prompt_version: string;
          input: Json | null;
          output: Json | null;
          edited_output: Json | null;
          input_tokens: number | null;
          output_tokens: number | null;
          key_source: "user" | "instance" | null;
          error: string | null;
          started_at: string | null;
          finished_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          agent: AgentNameDb;
          status?: AgentRunStatus;
          round?: number;
          prompt_version: string;
          input?: Json | null;
          output?: Json | null;
          edited_output?: Json | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          key_source?: "user" | "instance" | null;
          error?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_runs"]["Insert"]>;
        Relationships: [];
      };
      offer_versions: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          version: number;
          promise: string;
          structure: Json;
          copy: Json;
          sentinel_report: Json | null;
        } & Timestamps;
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          version: number;
          promise: string;
          structure: Json;
          copy: Json;
          sentinel_report?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["offer_versions"]["Insert"]>;
        Relationships: [];
      };
      pages: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          slug: string;
          blocks: Json;
          approved_at: string | null;
          sentinel_report: Json | null;
          published_blocks: Json | null;
          published_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          slug: string;
          blocks?: Json;
          approved_at?: string | null;
          sentinel_report?: Json | null;
          published_blocks?: Json | null;
          published_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pages"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      upsert_ai_key: {
        Args: { p_user_id: string; p_provider: string; p_key: string };
        Returns: { id: string; provider: string; last4: string }[];
      };
      get_ai_key: { Args: { p_user_id: string; p_provider: string }; Returns: string | null };
      get_published_page: {
        Args: { p_slug: string };
        Returns: { slug: string; title: string; blocks: Json; published_at: string }[];
      };
    };
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      agent_name: AgentNameDb;
      agent_run_status: AgentRunStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
