"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "./supabase/browser";

/**
 * Supabase Realtime: agent_runs and projects changes for one project (RLS applies, so a user
 * only ever receives their own rows). Calls `onChange` debounced.
 */
export function useProjectRealtime(projectId: string, onChange: () => void) {
  const callback = useRef(onChange);
  callback.current = onChange;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fire = () => {
      clearTimeout(timer);
      timer = setTimeout(() => callback.current(), 250);
    };
    const channel = supabase
      .channel(`project-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_runs", filter: `project_id=eq.${projectId}` }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter: `id=eq.${projectId}` }, fire)
      .subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [projectId]);
}
