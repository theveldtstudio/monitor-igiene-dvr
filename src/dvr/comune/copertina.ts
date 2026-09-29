/** Dati di copertina, revisioni e piè di pagina comuni a tutti i DVR generati dall'app. */
import { STUDIO_PREDEFINITO } from '../rumore/testiPredefiniti'
import type { AnagraficaDvr, RevisioneDvr } from './tipi'

export interface DocumentoCopertina {
  periodoRiferimento: string
  revisione: number
  integrazione?: number | null
  dataEmissioneTesto: string
  anno: number
  revisioni: RevisioneDvr[]
}

export const maiuscolo = (s: string | null | undefined) => (s ?? '').toLocaleUpperCase('it-IT')

export function slug(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/** "a", "a e b", "a, b e c" */
export const elenco = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`)

/**
 * @param rischioFile parte del nome file che identifica il rischio, es. "Posture"
 */
export function datiCopertina(
  a: Omit<AnagraficaDvr, 'cantiere_id'>,
  d: DocumentoCopertina,
  rischioFile: string,
  studio: { descrizione?: string; esecutore?: string } = {},
) {
  const s = { ...STUDIO_PREDEFINITO, ...studio }
  const revCodice = String(d.revisione).padStart(2, '0')
  const revisioni = [...d.revisioni].sort((x, y) => x.revisione - y.revisione)
  const maxRev = Math.max(3, ...revisioni.map((r) => r.revisione))
  const revisioniCopertina = [maxRev, maxRev - 1, maxRev - 2, maxRev - 3].map((num) => {
    const r = revisioni.find((x) => x.revisione === num)
    return {
      rev: String(num).padStart(2, '0'),
      data: r?.data ?? '',
      descrizione: r?.descrizione ?? '',
      collaborazione: r ? '/' : '',
      redatto: r?.redatto ?? '',
      verificato: r?.verificato ?? '',
      approvato: r?.approvato ?? '',
    }
  })
  return {
    comuneMaiuscolo: maiuscolo(a.comune),
    provinciaMaiuscolo: maiuscolo(a.provincia),
    operaMaiuscolo: maiuscolo(a.opera),
    denominazione: a.denominazione ?? '',
    denominazioneMaiuscolo: maiuscolo(a.denominazione),
    impresa: a.impresa ?? '',
    datoreLavoro: a.datore_lavoro ?? '',
    rspp: a.rspp ?? '',
    medicoCompetente: a.medico_competente ?? '',
    rls: a.rls,
    gruppoLavoro: a.gruppo_lavoro,
    redatto: a.redatto ?? '/',
    verificato: a.verificato ?? '/',
    approvato: a.approvato ?? '/',
    studioDescrizione: s.descrizione,
    studioEsecutore: s.esecutore,
    periodoRiferimento: d.periodoRiferimento,
    integrazioneTesto: d.integrazione ? String(d.integrazione).padStart(2, '0') : '/',
    dataEmissioneTesto: d.dataEmissioneTesto,
    revisioneCodice: revCodice,
    nomeFile: `DVR_${rischioFile}_${slug(a.impresa)}_${d.anno}_${slug(a.denominazione)}_rev${revCodice}.docx`,
    revisioniCopertina,
    revisioni: revisioni.map((r) => ({
      rev: String(r.revisione).padStart(2, '0'),
      integrazione: r.integrazione ? String(r.integrazione) : '/',
      data: r.data,
      descrizione: r.descrizione,
      redatto: r.redatto ?? '',
      verificato: r.verificato ?? '',
      approvato: r.approvato ?? '',
    })),
  }
}
