import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { uploadFoto, deleteFoto, getFotoUrls } from '../utils/fotoStorage';
import type { FotoMisura } from '../types';

const QUERY_KEY = 'foto_misura';

// ─────────────────────────────────────────────────────────
// Tipo arricchito: FotoMisura + signedUrl risolto
// ─────────────────────────────────────────────────────────

export interface FotoMisuraConUrl extends FotoMisura {
  signedUrl: string | null;
}

// ─────────────────────────────────────────────────────────
// useFotoMisure — query: tutte le foto di una misura
// ─────────────────────────────────────────────────────────

export function useFotoMisure(misuraId: string | null | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, misuraId],
    enabled: !!misuraId,
    queryFn: async (): Promise<FotoMisuraConUrl[]> => {
      if (!misuraId) return [];

      const { data, error } = await supabase
        .from('foto_misura')
        .select('*')
        .eq('misura_id', misuraId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const paths = data
        .map((row) => row.path_locale)
        .filter((p): p is string => !!p);

      const urlMap = paths.length > 0 ? await getFotoUrls(paths) : {};

      return data.map((row) => ({
        ...(row as FotoMisura),
        signedUrl: row.path_locale ? (urlMap[row.path_locale] ?? null) : null,
      }));
    },
    staleTime: 30 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────────────────
// useUploadFotoMisura — mutation: upload + insert
// ─────────────────────────────────────────────────────────

interface UploadFotoInput {
  misuraId: string;
  file: File;
}

export function useUploadFotoMisura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ misuraId, file }: UploadFotoInput): Promise<FotoMisura> => {
      const path = await uploadFoto(misuraId, file);

      const { data, error } = await supabase
        .from('foto_misura')
        .insert({
          misura_id: misuraId,
          path_locale: path,
          url_storage: null,
          sync_pending: false,
        })
        .select()
        .single();

      if (error) {
        try {
          await deleteFoto(path);
        } catch (rollbackError) {
          console.error('Rollback delete foto fallito:', rollbackError);
        }
        throw error;
      }

      return data as FotoMisura;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.misuraId] });
    },
  });
}

// ─────────────────────────────────────────────────────────
// useDeleteFotoMisura — mutation: cancella file + riga DB
// ─────────────────────────────────────────────────────────

interface DeleteFotoInput {
  fotoId: string;
  misuraId: string;
  pathLocale: string | null;
}

export function useDeleteFotoMisura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fotoId, pathLocale }: DeleteFotoInput): Promise<void> => {
      const { error } = await supabase.from('foto_misura').delete().eq('id', fotoId);
      if (error) throw error;

      if (pathLocale) {
        try {
          await deleteFoto(pathLocale);
        } catch (storageError) {
          console.warn('Cancellazione file storage fallita (file orfano):', storageError);
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.misuraId] });
    },
  });
}
