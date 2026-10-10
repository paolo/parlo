"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { apiFetch } from "./api";

export interface UsageResponse {
  usedToday: number;
  dailyLimit: number;
  resetAt: string;
}

export const queryKeys = {
  usage: ["usage"] as const,
  phraseGroups: ["phrase-groups"] as const,
};

export function useUsage() {
  return useQuery({
    queryKey: queryKeys.usage,
    queryFn: () => apiFetch<UsageResponse>("/api/usage"),
  });
}

export function useTranslate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<{ group: PhraseGroupDTO }>("/api/translations", {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
    // Refresh the quota either way: a 429 also means our cached count is stale.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.usage }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.phraseGroups }),
  });
}
