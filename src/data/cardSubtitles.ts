import type { Misura } from '../types'

export interface SubtitleData {
  /** Una stringa unica con i dettagli principali, separati da " — " */
  subtitle: string
  /** Eventuali righe meta sotto al subtitle (es. "posizione: seduto" per WBV). Vuote per moduli che non hanno meta. */
  metaLines: string[]
}

/**
 * Una funzione pura che dato un oggetto Misura ne estrae il subtitle visualizzato sulla card.
 */
export type SubtitleBuilder = (misura: Misura) => SubtitleData

/**
 * Subtitle per misura del modulo Rumore.
 */
export const subtitleRumore: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const leqDbA = dati.leq_dba as number | undefined
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined

  const parts: string[] = []
  if (postazione) parts.push(postazione)
  if (fase) parts.push(fase)
  if (leqDbA !== undefined) parts.push(`Leq ${leqDbA} dB(A)`)

  return {
    subtitle: parts.join(' — '),
    metaLines: [],
  }
}

/**
 * Subtitle per misura del modulo Vibrazioni WBV.
 */
export const subtitleWbv: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const macchina = dati.macchina_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const awMax = dati.aw_max as number | undefined
  const awAsse = dati.aw_max_asse as string | undefined
  const posizione = dati.posizione_operatore as string | undefined

  const parts: string[] = []
  if (macchina) parts.push(macchina)
  if (fase) parts.push(fase)
  if (awMax !== undefined && awAsse) {
    const valStr = (Math.round(awMax * 100) / 100).toFixed(2).replace('.', ',')
    parts.push(`A(w)max ${valStr} m/s² (${awAsse})`)
  }

  const metaLines: string[] = []
  if (posizione) metaLines.push(`posizione: ${posizione}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo Vibrazioni HAV (Mano-Braccio).
 */
export const subtitleHav: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const utensile = dati.utensile as string | undefined
  const fase = dati.fase_nome as string | undefined
  const awSum = dati.aw_sum as number | undefined
  const impugnatura = dati.impugnatura as string | undefined
  const impugnaturaAltro = dati.impugnatura_altro as string | undefined

  const parts: string[] = []
  if (utensile) parts.push(utensile)
  if (fase) parts.push(fase)
  if (awSum !== undefined) {
    const valStr = (Math.round(awSum * 100) / 100).toFixed(2).replace('.', ',')
    parts.push(`A(w)sum ${valStr} m/s²`)
  }

  const metaLines: string[] = []
  if (impugnatura) {
    const label = impugnatura === 'altro' && impugnaturaAltro ? impugnaturaAltro : impugnatura
    metaLines.push(`impugnatura: ${label}`)
  }

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo Microclima.
 */
export const subtitleMicroclima: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const wbgt = dati.wbgt as number | undefined
  const ta = dati.ta as number | undefined
  const ambiente = dati.ambiente as string | undefined

  const parts: string[] = []
  if (postazione) parts.push(postazione)
  if (fase) parts.push(fase)
  if (wbgt !== undefined) {
    const valStr = (Math.round(wbgt * 100) / 100).toFixed(2).replace('.', ',')
    parts.push(`WBGT ${valStr}°C`)
  } else if (ta !== undefined) {
    const valStr = numToStr(ta)
    parts.push(`Ta ${valStr}°C`)
  }

  const metaLines: string[] = []
  if (ambiente) metaLines.push(`ambiente: ${ambiente}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

function numToStr(n: number): string {
  return String(Math.round(n * 100) / 100).replace('.', ',')
}

/**
 * Subtitle per misura del modulo Polveri.
 */
export const subtitlePolveri: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const codiceFiltro = dati.codice_filtro as string | undefined
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const concPolveri = dati.conc_polveri as number | undefined
  const tipoMisura = dati.tipo_misura as string | undefined

  const parts: string[] = []
  if (codiceFiltro) parts.push(codiceFiltro)
  if (postazione) parts.push(postazione)
  else if (fase) parts.push(fase)
  if (concPolveri !== undefined) {
    const valStr = (Math.round(concPolveri * 1000) / 1000).toString().replace('.', ',')
    parts.push(`Polveri ${valStr} mg/m³`)
  }

  const metaLines: string[] = []
  if (tipoMisura) metaLines.push(`tipo: ${tipoMisura}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo ROA (radiazioni ottiche artificiali).
 */
export const subtitleRoa: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const sorgente = dati.sorgente as string | undefined
  const banda = dati.banda as string | undefined
  const indice = dati.indice_esposizione as number | undefined
  const hRadiant = dati.h_radiant as number | undefined
  const irradianzaE = dati.irradianza_e as number | undefined

  const parts: string[] = []
  if (postazione) parts.push(postazione)
  else if (sorgente) parts.push(sorgente)
  if (fase) parts.push(fase)

  if (indice !== undefined) {
    const valStr = (Math.round(indice * 10) / 10).toString().replace('.', ',')
    parts.push(`Ind. esp. ${valStr}%`)
  } else if (hRadiant !== undefined) {
    const valStr = (Math.round(hRadiant * 100) / 100).toString().replace('.', ',')
    parts.push(`H ${valStr} J/m²`)
  } else if (irradianzaE !== undefined) {
    const valStr = (Math.round(irradianzaE * 100) / 100).toString().replace('.', ',')
    parts.push(`E ${valStr} W/m²`)
  }

  const metaLines: string[] = []
  if (banda) metaLines.push(`banda: ${banda}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo Carbonio elementare.
 */
export const subtitleCarbonio: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const codiceFiltro = dati.codice_filtro as string | undefined
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const concEc = dati.conc_ec as number | undefined
  const sottoSoglia = dati.conc_ec_sotto_soglia as boolean | undefined
  const tipoMisura = dati.tipo_misura as string | undefined

  const parts: string[] = []
  if (codiceFiltro) parts.push(codiceFiltro)
  if (postazione) parts.push(postazione)
  else if (fase) parts.push(fase)
  if (concEc !== undefined) {
    const valStr = (Math.round(concEc * 10000) / 10000).toString().replace('.', ',')
    parts.push(`EC ${sottoSoglia ? '<' : ''}${valStr} ng/m³`)
  }

  const metaLines: string[] = []
  if (tipoMisura) metaLines.push(`tipo: ${tipoMisura}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo Gas e vapori.
 */
export const subtitleGas: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const tipoPrelievo = dati.tipo_prelievo as string | undefined

  const gasRilevati: string[] = []
  const gasMap: { key: string; label: string; unit: string }[] = [
    { key: 'no2', label: 'NO₂', unit: 'ppm' },
    { key: 'no', label: 'NO', unit: 'ppm' },
    { key: 'co', label: 'CO', unit: 'ppm' },
    { key: 'co2', label: 'CO₂', unit: '' },
    { key: 'h2s', label: 'H₂S', unit: 'ppm' },
    { key: 'o2', label: 'O₂', unit: '%' },
  ]
  for (const g of gasMap) {
    const v = dati[g.key] as number | undefined
    if (v !== undefined) {
      const valStr = (Math.round(v * 100) / 100).toString().replace('.', ',')
      gasRilevati.push(`${g.label} ${valStr}${g.unit ? ' ' + g.unit : ''}`)
    }
  }
  const altroNome = dati.altro_gas_nome as string | undefined
  const altroValore = dati.altro_gas_valore as number | undefined
  if (altroNome && altroValore !== undefined) {
    const valStr = (Math.round(altroValore * 100) / 100).toString().replace('.', ',')
    gasRilevati.push(`${altroNome} ${valStr}`)
  }

  const parts: string[] = []
  if (postazione) parts.push(postazione)
  else if (fase) parts.push(fase)
  if (gasRilevati.length > 0) {
    parts.push(gasRilevati.slice(0, 3).join(' · '))
  }

  const metaLines: string[] = []
  if (gasRilevati.length > 3) {
    metaLines.push(`+ ${gasRilevati.length - 3} altri gas`)
  }
  if (tipoPrelievo) metaLines.push(`tipo: ${tipoPrelievo}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo CEM (campi elettromagnetici).
 */
export const subtitleCem: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const sorgente = dati.sorgente as string | undefined
  const frequenza = dati.frequenza as number | undefined
  const unita = dati.unita_frequenza as string | undefined
  const campoE = dati.campo_e as number | undefined
  const induzioneB = dati.induzione_b as number | undefined
  const indice = dati.indice_esposizione as number | undefined

  const parts: string[] = []
  if (postazione) parts.push(postazione)
  else if (sorgente) parts.push(sorgente)
  if (fase) parts.push(fase)

  if (indice !== undefined) {
    const valStr = (Math.round(indice * 10) / 10).toString().replace('.', ',')
    parts.push(`Ind. esp. ${valStr}%`)
  } else if (campoE !== undefined) {
    const valStr = (Math.round(campoE * 10) / 10).toString().replace('.', ',')
    parts.push(`E ${valStr} V/m`)
  } else if (induzioneB !== undefined) {
    const valStr = (Math.round(induzioneB * 10) / 10).toString().replace('.', ',')
    parts.push(`B ${valStr} μT`)
  }

  const metaLines: string[] = []
  if (frequenza !== undefined && unita) {
    const valStr = (Math.round(frequenza * 100) / 100).toString().replace('.', ',')
    metaLines.push(`frequenza: ${valStr} ${unita}`)
  }

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo Biologico (SAS).
 */
export const subtitleBiologico: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const codiceFiltro = dati.codice_filtro as string | undefined
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const conta22 = dati.conta_22 as number | undefined
  const conta22SottoSoglia = dati.conta_22_sotto_soglia as boolean | undefined
  const conta36 = dati.conta_36 as number | undefined
  const conta36SottoSoglia = dati.conta_36_sotto_soglia as boolean | undefined
  const muffe = dati.muffe_lieviti as number | undefined
  const muffeSottoSoglia = dati.muffe_lieviti_sotto_soglia as boolean | undefined

  const parts: string[] = []
  if (codiceFiltro) parts.push(codiceFiltro)
  if (postazione) parts.push(postazione)
  else if (fase) parts.push(fase)

  if (conta22 !== undefined) {
    const valStr = (Math.round(conta22 * 100) / 100).toString().replace('.', ',')
    parts.push(`22°C ${conta22SottoSoglia ? '<' : ''}${valStr} UFC/m³`)
  } else if (conta36 !== undefined) {
    const valStr = (Math.round(conta36 * 100) / 100).toString().replace('.', ',')
    parts.push(`36°C ${conta36SottoSoglia ? '<' : ''}${valStr} UFC/m³`)
  } else if (muffe !== undefined) {
    const valStr = (Math.round(muffe * 100) / 100).toString().replace('.', ',')
    parts.push(`Muffe ${muffeSottoSoglia ? '<' : ''}${valStr} UFC/m³`)
  }

  const metaLines: string[] = []
  const valoriExtra: string[] = []
  if (conta22 !== undefined) {
    if (conta36 !== undefined) {
      const v = (Math.round(conta36 * 100) / 100).toString().replace('.', ',')
      valoriExtra.push(`36°C ${conta36SottoSoglia ? '<' : ''}${v}`)
    }
    if (muffe !== undefined) {
      const v = (Math.round(muffe * 100) / 100).toString().replace('.', ',')
      valoriExtra.push(`muffe ${muffeSottoSoglia ? '<' : ''}${v}`)
    }
  } else if (conta36 !== undefined && muffe !== undefined) {
    const v = (Math.round(muffe * 100) / 100).toString().replace('.', ',')
    valoriExtra.push(`muffe ${muffeSottoSoglia ? '<' : ''}${v}`)
  }
  if (valoriExtra.length > 0) {
    metaLines.push(valoriExtra.join(' · '))
  }

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo IPA.
 */
export const subtitleIpa: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const codice = dati.codice_campione as string | undefined
  const fiala = dati.numero_fiala as string | undefined
  const membrana = dati.numero_membrana as string | undefined
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const tipoMisura = dati.tipo_misura as string | undefined

  const parts: string[] = []
  if (codice) parts.push(codice)
  if (postazione) parts.push(postazione)
  else if (fase) parts.push(fase)

  if (fiala && membrana) {
    parts.push(`F: ${fiala} · M: ${membrana}`)
  } else if (fiala) {
    parts.push(`Fiala: ${fiala}`)
  } else if (membrana) {
    parts.push(`Membrana: ${membrana}`)
  }

  const metaLines: string[] = []
  if (tipoMisura) metaLines.push(`tipo: ${tipoMisura}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo Amianto.
 */
export const subtitleAmianto: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const codiceFiltro = dati.codice_filtro as string | undefined
  const postazione = dati.postazione_nome as string | undefined
  const fase = dati.fase_nome as string | undefined
  const concAmianto = dati.conc_amianto as number | undefined
  const sottoSoglia = dati.conc_amianto_sotto_soglia as boolean | undefined
  const concFibreTotali = dati.conc_fibre_totali as number | undefined
  const tipoMisura = dati.tipo_misura as string | undefined

  const parts: string[] = []
  if (codiceFiltro) parts.push(codiceFiltro)
  if (postazione) parts.push(postazione)
  else if (fase) parts.push(fase)

  if (concAmianto !== undefined) {
    const valStr = (Math.round(concAmianto * 1000) / 1000).toString().replace('.', ',')
    parts.push(`Amianto ${sottoSoglia ? '<' : ''}${valStr} ff/L`)
  } else if (concFibreTotali !== undefined) {
    const valStr = (Math.round(concFibreTotali * 1000) / 1000).toString().replace('.', ',')
    parts.push(`Fibre ${valStr} ff/L`)
  }

  const metaLines: string[] = []
  if (tipoMisura) metaLines.push(`tipo: ${tipoMisura}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo MMC.
 * Priorità: sollevamento (carico) > spinta > traino > forza mantenimento > distanza trasporto.
 */
export const subtitleMmc: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const carico = dati.carico as number | undefined
  const giudizioPresa = dati.giudizio_presa as string | undefined
  const frequenza = dati.frequenza_gesti as number | undefined
  const frequenzaUnita = dati.frequenza_unita as string | undefined
  const spinta = dati.spinta as number | undefined
  const traino = dati.traino as number | undefined
  const forza = dati.forza_mantenimento as number | undefined
  const distTrasporto = dati.distanza_trasporto as number | undefined

  const parts: string[] = []

  if (carico !== undefined) {
    const valStr = (Math.round(carico * 100) / 100).toString().replace('.', ',')
    parts.push(`Carico ${valStr} kg`)
    if (frequenza !== undefined) {
      const f = (Math.round(frequenza * 10) / 10).toString().replace('.', ',')
      const unita = frequenzaUnita || 'atti/min'
      parts.push(`${f} ${unita}`)
    }
  } else if (spinta !== undefined) {
    const valStr = (Math.round(spinta * 100) / 100).toString().replace('.', ',')
    parts.push(`Spinta ${valStr} kg`)
  } else if (traino !== undefined) {
    const valStr = (Math.round(traino * 100) / 100).toString().replace('.', ',')
    parts.push(`Traino ${valStr} kg`)
  } else if (forza !== undefined) {
    const valStr = (Math.round(forza * 100) / 100).toString().replace('.', ',')
    parts.push(`Forza ${valStr} kg`)
  } else if (distTrasporto !== undefined) {
    const valStr = (Math.round(distTrasporto * 100) / 100).toString().replace('.', ',')
    parts.push(`Trasporto ${valStr} m`)
  }

  const metaLines: string[] = []
  if (giudizioPresa) metaLines.push(`presa: ${giudizioPresa.toLowerCase()}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo OWAS.
 */
export const subtitleOwas: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const mansione = ((dati.mansione as string) ?? '').trim()
  const attivita = ((dati.attivita as string) ?? '').trim()
  const s = dati.schiena
  const b = dati.braccia
  const g = dati.gambe
  const c = dati.carico
  const classe = dati.classe as number | undefined

  const codice = (s != null && b != null && g != null && c != null) ? `${s}-${b}-${g}-${c}` : null
  const owasPart = (codice && classe != null) ? `OWAS ${codice} (cl. ${classe})` : null

  const parts: string[] = []
  if (mansione) parts.push(mansione)
  if (attivita) parts.push(attivita)
  if (owasPart) parts.push(owasPart)

  return {
    subtitle: parts.join(' — '),
    metaLines: [],
  }
}

/**
 * Subtitle per misura del modulo OCRA Checklist.
 */
export const subtitleOcra: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const denominazione = dati.denominazione as string | undefined
  const arto = dati.arto_valutato as string | undefined
  const punteggioReale = dati.punteggio_reale as number | undefined
  const fasciaLabel = dati.fascia_label as string | undefined

  const parts: string[] = []
  if (denominazione) parts.push(denominazione)
  if (punteggioReale !== undefined) {
    const valStr = (Math.round(punteggioReale * 100) / 100).toString().replace('.', ',')
    parts.push(`OCRA ${valStr}`)
  }

  const metaLines: string[] = []
  if (fasciaLabel) metaLines.push(fasciaLabel)
  if (arto) metaLines.push(`arto: ${arto}`)

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}

/**
 * Subtitle per misura del modulo Acqua.
 */
export const subtitleAcqua: SubtitleBuilder = (misura) => {
  const dati = misura.dati as Record<string, unknown>
  const punto = dati.punto_monitoraggio as string | undefined
  const ph = dati.ph as number | undefined
  const cond = dati.conducibilita as number | undefined
  const tAcqua = dati.t_acqua as number | undefined
  const o2Perc = dati.o2_perc as number | undefined
  const o2MgL = dati.o2_mg_l as number | undefined

  const parts: string[] = []
  if (punto) parts.push(punto)
  if (ph !== undefined) {
    const valStr = (Math.round(ph * 100) / 100).toString().replace('.', ',')
    parts.push(`pH ${valStr}`)
  }

  const altriParam: string[] = []
  if (cond !== undefined) {
    const v = (Math.round(cond * 10) / 10).toString().replace('.', ',')
    altriParam.push(`${v} μS/cm`)
  }
  if (tAcqua !== undefined) {
    const v = (Math.round(tAcqua * 10) / 10).toString().replace('.', ',')
    altriParam.push(`${v}°C`)
  }
  if (o2MgL !== undefined) {
    const v = (Math.round(o2MgL * 100) / 100).toString().replace('.', ',')
    altriParam.push(`O₂ ${v} mg/l`)
  } else if (o2Perc !== undefined) {
    const v = (Math.round(o2Perc * 10) / 10).toString().replace('.', ',')
    altriParam.push(`O₂ ${v}%`)
  }

  const metaLines: string[] = []
  if (altriParam.length > 0) metaLines.push(altriParam.join(' · '))

  return {
    subtitle: parts.join(' — '),
    metaLines,
  }
}
