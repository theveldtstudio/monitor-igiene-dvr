/** Carica dal database tutto quello che serve per redigere un DVR (qualsiasi rischio). */
import * as api from '../api'

export async function caricaIngresso(cantiereId: string, documentoId: string) {
  const documento = await api.leggiDocumento(documentoId)
  const [anagrafica, revisioni, ambiti, mansioni, documentoMansioni, tempi, misure, macchine, dpi, tarature] = await Promise.all([
    api.leggiAnagrafica(cantiereId),
    api.leggiRevisioni(documentoId),
    api.leggiAmbiti(cantiereId),
    api.leggiMansioni(cantiereId),
    api.leggiDocumentoMansioni(documentoId),
    api.leggiTempi(documentoId),
    api.leggiMisure(cantiereId, documento.campagne_ids),
    api.leggiMacchine(cantiereId),
    api.leggiDpi(cantiereId),
    api.leggiTarature(),
  ])
  if (!anagrafica) throw new Error('Compila prima l’anagrafica DVR del cantiere.')
  return { anagrafica, documento, revisioni, ambiti, mansioni, documentoMansioni, tempi, misure, macchine, dpi, tarature }
}

export type Ingresso = Awaited<ReturnType<typeof caricaIngresso>>
