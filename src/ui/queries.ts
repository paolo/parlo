"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { ProfileLanguage } from "@/server/profile/types";
import type { Lang } from "../shared/languages";
import { apiFetch } from "./api";

export interface UsageResponse {
  usedToday: number;
  dailyLimit: number;
  resetAt: string;
}

export const queryKeys = {
  usage: ["usage"] as const,
  profile: ["profile"] as const,
  phraseGroups: ["phrase-groups"] as const,
  favorites: ["phrase-groups", { favorite: true }] as const,
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

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () =>
      apiFetch<{ items: PhraseGroupDTO[] }>("/api/phrase-groups?favorite=true"),
  });
}

export function useSetFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      apiFetch<{ group: PhraseGroupDTO }>(`/api/phrase-groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isFavorite }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.phraseGroups }),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiFetch<{ languages: ProfileLanguage[] }>("/api/profile"),
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (languages: { lang: Lang; region?: string }[]) =>
      apiFetch<{ languages: ProfileLanguage[] }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ languages }),
      }),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.profile, data),
  });
}
