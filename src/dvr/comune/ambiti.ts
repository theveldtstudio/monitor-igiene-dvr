/**
 * Contesto degli ambiti di un documento: quali tipi di luogo di lavoro ci sono. I testi predefiniti dei
 * DVR cambiano con la galleria (scavo tradizionale o TBM), con le opere all'aperto (viadotti, opere in
 * esterno, piazzale) e con i luoghi di servizio (officina, campo base, uffici).
 */
import type { TipoAmbito } from './tipi'

export interface ContestoAmbiti {
  tradizionale: boolean
  tbm: boolean
  galleria: boolean
  viadotto: boolean
  esterno: boolean
  officina: boolean
  servizi: boolean
}

export function contestoAmbiti(tipi: readonly TipoAmbito[]): ContestoAmbiti {
  const c = (t: TipoAmbito) => tipi.includes(t)
  return {
    tradizionale: c('galleria_tradizionale'),
    tbm: c('galleria_tbm'),
    galleria: c('galleria_tradizionale') || c('galleria_tbm'),
    viadotto: c('viadotto'),
    esterno: c('viadotto') || c('opere_esterne') || c('piazzale'),
    officina: c('officina'),
    servizi: c('campo_base') || c('uffici'),
  }
}
