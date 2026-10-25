"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { ProfileLanguage } from "@/server/profile/types";
import type { Lang } from "../shared/languages";
import { ApiError, apiFetch } from "./api";

export interface PhraseGroupsPage {
  items: PhraseGroupDTO[];
  nextCursor: string | null;
  /** The cap that applies to this list: history or phrasebook size. */
  limit: number;
}

export interface UsageResponse {
  usedToday: number;
  dailyLimit: number;
  resetAt: string;
}

export const queryKeys = {
  usage: ["usage"] as const,
  profile: ["profile"] as const,
  phraseGroups: ["phrase-groups"] as const,
  history: ["phrase-groups", { favorite: false }] as const,
  favorites: ["phrase-groups", { favorite: true }] as const,
  allFavorites: ["phrase-groups", { favorite: true, all: true }] as const,
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

const PAGE_SIZE = 20;

/** History (or, with `favorite`, the phrasebook) one page at a time. */
export function usePhraseGroups({ favorite }: { favorite: boolean }) {
  return useInfiniteQuery({
    queryKey: favorite ? queryKeys.favorites : queryKeys.history,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      apiFetch<PhraseGroupsPage>(
        `/api/phrase-groups?favorite=${favorite}&limit=${PAGE_SIZE}${
          pageParam ? `&cursor=${pageParam}` : ""
        }`,
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** The whole phrasebook in one request (it holds at most 100 groups). */
export function useAllFavorites() {
  return useQuery({
    queryKey: queryKeys.allFavorites,
    queryFn: () =>
      apiFetch<PhraseGroupsPage>("/api/phrase-groups?favorite=true&limit=100"),
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

/** The region the user picked for a language (Bolivia for Spanish, say), or undefined when it is not one of theirs. */
export function useProfileRegion(lang: Lang): string | undefined {
  const { data } = useProfile();
  return data?.languages.find((l) => l.lang === lang)?.region;
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

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    // A 404 means it is already gone (say, deleted in another tab), which is what was asked for.
    mutationFn: async (id: string) => {
      try {
        await apiFetch<void>(`/api/phrase-groups/${id}`, { method: "DELETE" });
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.phraseGroups }),
  });
}

export function useAcceptCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ group: PhraseGroupDTO }>(`/api/phrase-groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ acceptCorrection: true }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.phraseGroups }),
  });
}
