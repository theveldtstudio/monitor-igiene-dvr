import { useCallback, useRef, useState } from 'react'
import type { ExportProgress, CampagnaCompleta } from '../lib/exportCantiereZip'
import { exportCantiereZip } from '../lib/exportCantiereZip'
import type { Cantiere, Campagna, Misura, RisorsaCantiere, FotoMisura } from '../types'
import type { Tecnico, Strumento } from '../types'
import { supabase } from '../lib/supabase'
import type { ExportContext } from '../data/exportSchemas'
import type { PdfFotoContext } from '../lib/pdf'

export type EsportaStato = 'idle' | 'in-corso' | 'completato' | 'annullato' | 'errore'

interface UseEsportaCantiereResult {
  stato: EsportaStato
  progress: ExportProgress | null
  errore: string | null
  avvia: () => Promise<void>
  annulla: () => void
  reset: () => void
}

export function useEsportaCantiere(cantiere: Cantiere): UseEsportaCantiereResult {
  const [stato, setStato] = useState<EsportaStato>('idle')
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const avvia = useCallback(async () => {
    if (stato === 'in-corso') return

    setStato('in-corso')
    setProgress(null)
    setErrore(null)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // 1. Campagne del cantiere
      const { data: campagne, error: errCampagne } = await supabase
        .from('campagne')
        .select('*')
        .eq('cantiere_id', cantiere.id)
      if (errCampagne) throw new Error(`Errore caricamento campagne: ${errCampagne.message}`)
      if (!campagne || campagne.length === 0) throw new Error('Nessuna campagna trovata per questo cantiere')

      // 2. Risorse cantiere (tutte le categorie in un'unica query)
      const { data: risorse, error: errRisorse } = await supabase
        .from('risorse_cantiere')
        .select('*')
        .eq('cantiere_id', cantiere.id)
      if (errRisorse) throw new Error(`Errore caricamento risorse: ${errRisorse.message}`)

      // 3. Tecnici e strumenti (globali)
      const { data: tecnici, error: errTecnici } = await supabase
        .from('tecnici')
        .select('*')
        .order('cognome', { ascending: true })
        .order('nome', { ascending: true })
      if (errTecnici) throw new Error(`Errore caricamento tecnici: ${errTecnici.message}`)

      const { data: strumenti, error: errStrumenti } = await supabase
        .from('strumenti')
        .select('*')
        .order('nome', { ascending: true })
      if (errStrumenti) throw new Error(`Errore caricamento strumenti: ${errStrumenti.message}`)

      if (abortController.signal.aborted) throw new DOMException('Annullato', 'AbortError')

      // 4. Misure per ciascuna campagna
      const misurePerCampagna = new Map<string, Misura[]>()
      for (const c of campagne as Campagna[]) {
        if (abortController.signal.aborted) throw new DOMException('Annullato', 'AbortError')
        const { data: misure, error: errMisure } = await supabase
          .from('misure')
          .select('*')
          .eq('campagna_id', c.id)
          .order('numero', { ascending: true })
        if (errMisure) throw new Error(`Errore caricamento misure campagna ${c.id}: ${errMisure.message}`)
        misurePerCampagna.set(c.id, (misure ?? []) as Misura[])
      }

      // 5. Foto per tutte le misure (query IN)
      const tutteLeMisureIds: string[] = []
      for (const ms of misurePerCampagna.values()) {
        for (const m of ms) tutteLeMisureIds.push(m.id)
      }

      const fotoPerMisura = new Map<string, FotoMisura[]>()
      if (tutteLeMisureIds.length > 0) {
        const { data: foto, error: errFoto } = await supabase
          .from('foto_misura')
          .select('*')
          .in('misura_id', tutteLeMisureIds)
          .order('created_at', { ascending: true })
        if (errFoto) throw new Error(`Errore caricamento foto: ${errFoto.message}`)
        for (const f of (foto ?? []) as FotoMisura[]) {
          if (!fotoPerMisura.has(f.misura_id)) fotoPerMisura.set(f.misura_id, [])
          fotoPerMisura.get(f.misura_id)!.push(f)
        }
      }

      if (abortController.signal.aborted) throw new DOMException('Annullato', 'AbortError')

      // Risorse separate per categoria (per PdfFotoContext)
      const risorseAll = (risorse ?? []) as RisorsaCantiere[]
      const postazioni = risorseAll.filter((r) => r.tipo === 'postazione')
      const fasi = risorseAll.filter((r) => r.tipo === 'fase')
      const macchine = risorseAll.filter((r) => r.tipo === 'macchina')

      // 6. Raggruppa campagne per moduloId (tipo_campionamento)
      const campagnePerModulo = new Map<string, CampagnaCompleta[]>()

      for (const c of campagne as Campagna[]) {
        const moduloId = c.tipo_campionamento
        const misureC = misurePerCampagna.get(c.id) ?? []

        const fotoMisuraSubset = new Map<string, FotoMisura[]>()
        for (const m of misureC) {
          const f = fotoPerMisura.get(m.id)
          if (f && f.length > 0) fotoMisuraSubset.set(m.id, f)
        }

        const fotoCtx: PdfFotoContext | undefined = fotoMisuraSubset.size > 0
          ? {
              misure: misureC,
              fotoPerMisura: fotoMisuraSubset,
              risorse: { postazioni, fasi, macchine },
            }
          : undefined

        if (!campagnePerModulo.has(moduloId)) campagnePerModulo.set(moduloId, [])
        campagnePerModulo.get(moduloId)!.push({
          campagna: c,
          misure: misureC,
          risorse: risorseAll,
          fotoCtx,
        })
      }

      // 7. buildExportContext: costruisce ExportContext per ogni campagna
      const tecniciAll = (tecnici ?? []) as Tecnico[]
      const strumentiAll = (strumenti ?? []) as Strumento[]

      const buildExportContext = (
        campagna: Campagna,
        misure: Misura[],
        risorseLocal: RisorsaCantiere[],
      ): ExportContext => ({
        cantiere,
        campagna,
        misure,
        tecnici: tecniciAll.filter((t) => campagna.tecnici_ids.includes(t.id)),
        strumento: strumentiAll.find((s) => s.id === campagna.strumento_id) ?? null,
        risorse: risorseLocal,
      })

      await exportCantiereZip({
        cantiere,
        campagnePerModulo,
        buildExportContext,
        onProgress: (p) => setProgress(p),
        signal: abortController.signal,
      })

      setStato('completato')
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStato('annullato')
      } else {
        console.error('Errore esportazione cantiere:', err)
        setErrore(err instanceof Error ? err.message : 'Errore sconosciuto')
        setStato('errore')
      }
    } finally {
      abortControllerRef.current = null
    }
  }, [cantiere, stato])

  const annulla = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    setStato('idle')
    setProgress(null)
    setErrore(null)
  }, [])

  return { stato, progress, errore, avvia, annulla, reset }
}
