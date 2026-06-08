import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { uploadFoto, deleteFoto, getFotoUrls, compressImage } from '../utils/fotoStorage';
import {
  db,
  getFotoBlobsByMisura,
  putFotoBlob,
  deleteFotoBlob,
  enqueueSyncOperation,
} from '../lib/offline';
import type { FotoMisura } from '../types';
import { humanizeError } from '../lib/humanizeError';
import { toast } from '../lib/toast/toastApi';

const QUERY_KEY = 'foto_misura';

// ─────────────────────────────────────────────────────────
// Tipo arricchito: FotoMisura + signedUrl risolto
// ─────────────────────────────────────────────────────────

export interface FotoMisuraConUrl extends Omit<FotoMisura, 'created_at'> {
  signedUrl: string | null;
  // sync_pending ereditato da FotoMisura: true = solo locale, non ancora su Storage
  localObjectUrl?: string; // object URL della preview locale (popolato dal componente)
  localBlob?: Blob; // blob sorgente per le foto locali pendenti
  created_at?: string | number | null; // usato per ordinare il merge (number per blob locali)
  sync_error?: boolean; // true = upload fallito >=3 volte (badge 'error')
}

// Soglia coerente con fotoSyncExecutor: retries>=3 = errore terminale.
const MAX_SYNC_RETRIES = 3;

// ─────────────────────────────────────────────────────────
// useFotoMisure — query: tutte le foto di una misura
// ─────────────────────────────────────────────────────────

export function useFotoMisure(misuraId: string | null | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, misuraId],
    enabled: !!misuraId,
    queryFn: async (): Promise<FotoMisuraConUrl[]> => {
      if (!misuraId) return [];

      // ── Remote: solo se online (offline le signed URL fallirebbero) ──
      let remote: FotoMisuraConUrl[] = [];
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('foto_misura')
          .select('*')
          .eq('misura_id', misuraId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const paths = data
            .map((row) => row.path_locale)
            .filter((p): p is string => !!p);

          const urlMap = paths.length > 0 ? await getFotoUrls(paths) : {};

          remote = data.map((row) => ({
            ...(row as FotoMisura),
            signedUrl: row.path_locale ? (urlMap[row.path_locale] ?? null) : null,
          }));
        }
      }

      // ── Locali pendenti: sempre (online e offline) ──
      const [blobs, localRecords, pendingOps] = await Promise.all([
        getFotoBlobsByMisura(misuraId),
        db.foto_misura.where('misura_id').equals(misuraId).toArray(),
        db._sync_queue
          .filter((op) => op.table === 'foto_misura' && op.operation === 'create')
          .toArray(),
      ]);
      const pendingIds = new Set(
        localRecords.filter((r) => r.sync_pending).map((r) => r.id),
      );
      // retries per foto -> stato 'error' quando >= MAX_SYNC_RETRIES
      const retriesById = new Map(pendingOps.map((op) => [op.record_id, op.retries]));
      const locali: FotoMisuraConUrl[] = blobs
        .filter((b) => pendingIds.has(b.id))
        .map((b) => ({
          id: b.id,
          misura_id: b.misura_id,
          url_storage: null,
          path_locale: '',
          sync_pending: true,
          signedUrl: null,
          localBlob: b.blob,
          created_at: b.created_at,
          sync_error: (retriesById.get(b.id) ?? 0) >= MAX_SYNC_RETRIES,
        }))
        .sort((a, b) => Number(a.created_at) - Number(b.created_at));

      // ── Merge + dedup per id (remote già ordinate, locali in coda) ──
      const remoteIds = new Set(remote.map((r) => r.id));
      const localiDedup = locali.filter((l) => !remoteIds.has(l.id));
      return [...remote, ...localiDedup];
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
      // ── Offline: salva blob + record locale, enqueue op. Nessuna Supabase. ──
      if (!navigator.onLine) {
        const id = crypto.randomUUID();
        const blob = await compressImage(file);
        await putFotoBlob({ id, misura_id: misuraId, blob, created_at: Date.now() });
        const record: FotoMisura = {
          id,
          misura_id: misuraId,
          url_storage: null,
          path_locale: '',
          sync_pending: true,
          created_at: null,
        };
        await db.foto_misura.put(record);
        await enqueueSyncOperation('foto_misura', 'create', id, { misura_id: misuraId });
        return record;
      }

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
      queryClient.invalidateQueries({ queryKey: ['foto-misure-campagna'] });
    },
    onError: (e: unknown) => {
      toast.error(humanizeError(e));
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
      // pathLocale vuoto/null = foto locale pendente (mai arrivata su Storage)
      const isLocalPending = !pathLocale;

      if (isLocalPending) {
        await db.foto_misura.delete(fotoId);
        await deleteFotoBlob(fotoId);
        // _sync_queue.record_id non indicizzato -> filter()
        await db._sync_queue.filter((op) => op.record_id === fotoId).delete();
        return;
      }

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
      queryClient.invalidateQueries({ queryKey: ['foto-misure-campagna'] });
    },
    onError: (e: unknown) => {
      toast.error(humanizeError(e));
    },
  });
}
