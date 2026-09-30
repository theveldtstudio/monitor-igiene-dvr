/**
 * Sezioni comuni alle pagine di redazione dei DVR (dati del documento, revisioni).
 */
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import * as api from '../api'
import { FASI_AVANZAMENTO, totaleMetro, type Avanzamento, type MetodoScavo } from '../comune/avanzamento'
import type { Ingresso } from '../comune/ingresso'
import { adattaLogo } from '../rumore/generaDvrRumore'
import { cicloPredefinito, type BloccoTesto } from '../rumore/testiPredefiniti'
import { AreaTesto, Bottone, Campo, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { numeroDa, stili } from '../ui/stili'

// ---------------------------------------------------------------- dati del documento

export function DatiDocumento({
  ing,
  aggiorna,
  tipiCampagna,
  etichettaCampagne,
  conTarature = true,
}: {
  ing: Ingresso
  aggiorna: () => Promise<void>
  tipiCampagna: string[]
  etichettaCampagne: string
  /** false per i rischi valutati senza strumenti di misura (es. posture) */
  conTarature?: boolean
}) {
  const [d, setD] = useState(ing.documento)
  const campagne = useQuery({ queryKey: ['dvr', 'campagne', d.cantiere_id, tipiCampagna.join()], queryFn: () => api.leggiCampagne(d.cantiere_id, tipiCampagna) })
  const tarature = useQuery({ queryKey: ['dvr', 'tarature'], queryFn: api.leggiTarature })
  const taratureScelte = d.contenuti.tarature_ids ?? (tarature.data ?? []).map((t) => t.id)
  const alterna = (lista: string[], id: string) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id])

  return (
    <Sezione
      titolo="Dati del documento"
      azioni={
        <Bottone
          tipo="primario"
          onClick={() =>
            void esegui(async () => {
              await api.aggiornaDocumento(d.id, {
                periodo_riferimento: d.periodo_riferimento,
                data_emissione: d.data_emissione,
                integrazione: d.integrazione,
                stato: d.stato,
                campagne_ids: d.campagne_ids,
                ambiti_ids: d.ambiti_ids,
              })
              await api.aggiornaContenuti(d.id, conTarature ? { logoCliente: d.contenuti.logoCliente ?? null, tarature_ids: taratureScelte } : { logoCliente: d.contenuti.logoCliente ?? null })
              await aggiorna()
            }, 'Documento salvato')
          }
        >
          Salva
        </Bottone>
      }
    >
      <div style={stili.griglia}>
        <Campo etichetta="Periodo di riferimento" valore={d.periodo_riferimento} onChange={(v) => setD({ ...d, periodo_riferimento: v })} segnaposto="es. Maggio – Giugno 2026" />
        <Campo etichetta="Data di emissione" tipo="date" valore={d.data_emissione} onChange={(v) => setD({ ...d, data_emissione: v || null })} />
        <Campo etichetta="Integrazione (facoltativa)" tipo="number" valore={d.integrazione} onChange={(v) => setD({ ...d, integrazione: numeroDa(v) })} />
        <label style={stili.campo}>
          Stato
          <select value={d.stato} onChange={(e) => setD({ ...d, stato: e.target.value as 'bozza' | 'emesso' })} style={stili.input}>
            <option value="bozza">Bozza</option>
            <option value="emesso">Emesso</option>
          </select>
        </label>
        <div style={stili.campo}>
          Revisione
          <div style={{ fontSize: 14, color: 'var(--text-primary)', paddingTop: 8 }}>{String(d.revisione).padStart(2, '0')}</div>
        </div>
      </div>

      <p style={{ ...stili.nota, marginTop: 12 }}>Campagne da cui prendere le misure ({etichettaCampagne}):</p>
      <div style={stili.riga}>
        {(campagne.data ?? []).map((c) => (
          <label key={c.id} style={{ fontSize: 13 }}>
            <input type="checkbox" checked={d.campagne_ids.includes(c.id)} onChange={() => setD({ ...d, campagne_ids: alterna(d.campagne_ids, c.id) })} />{' '}
            {new Date(c.data_ora).toLocaleDateString('it-IT')} – {c.tipo_campionamento} ({c.stato})
          </label>
        ))}
        {campagne.data?.length === 0 && <span style={stili.nota}>Nessuna campagna di questo tipo nel cantiere.</span>}
      </div>

      <p style={{ ...stili.nota, marginTop: 12 }}>Ambiti valutati:</p>
      <div style={stili.riga}>
        {ing.ambiti.map((a) => (
          <label key={a.id} style={{ fontSize: 13 }}>
            <input type="checkbox" checked={d.ambiti_ids.includes(a.id)} onChange={() => setD({ ...d, ambiti_ids: alterna(d.ambiti_ids, a.id) })} /> {a.nome}
          </label>
        ))}
        {ing.ambiti.length === 0 && <span style={stili.nota}>Nessun ambito: aggiungili nella pagina DVR del cantiere.</span>}
      </div>

      {conTarature && <p style={{ ...stili.nota, marginTop: 12 }}>Strumenti usati (dalle tarature):</p>}
      {conTarature && <div style={stili.riga}>
        {(tarature.data ?? []).map((t) => (
          <label key={t.id} style={{ fontSize: 13 }}>
            <input
              type="checkbox"
              checked={taratureScelte.includes(t.id)}
              onChange={() => setD({ ...d, contenuti: { ...d.contenuti, tarature_ids: alterna(taratureScelte, t.id) } })}
            />{' '}
            {t.componente} {t.modello} {t.matricola ? `(${t.matricola})` : ''}
          </label>
        ))}
        {tarature.data?.length === 0 && <span style={stili.nota}>Nessuna taratura: aggiungile nella pagina DVR del cantiere.</span>}
      </div>}

      <p style={{ ...stili.nota, marginTop: 12 }}>Logo del cliente (copertina e intestazioni):</p>
      <div style={stili.riga}>
        {d.contenuti.logoCliente && <img src={d.contenuti.logoCliente} alt="Logo cliente" style={{ height: 40, borderWidth: 0.5, borderStyle: 'solid', borderColor: 'var(--border)' }} />}
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void adattaLogo(f).then((logo) => setD({ ...d, contenuti: { ...d.contenuti, logoCliente: logo } }))
          }}
        />
        {d.contenuti.logoCliente && <Bottone onClick={() => setD({ ...d, contenuti: { ...d.contenuti, logoCliente: null } })}>Togli logo</Bottone>}
      </div>
    </Sezione>
  )
}

// ---------------------------------------------------------------- revisioni

export function Revisioni({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const [righe, setRighe] = useState(ing.revisioni)
  const doc = ing.documento
  return (
    <Sezione
      titolo="Indice delle revisioni"
      chiusa
      azioni={
        <>
          {!righe.some((r) => r.revisione === doc.revisione) && (
            <Bottone
              onClick={() =>
                setRighe([
                  ...righe,
                  { id: '', documento_id: doc.id, revisione: doc.revisione, integrazione: doc.integrazione, data: '', descrizione: '', redatto: ing.anagrafica.redatto, verificato: ing.anagrafica.verificato, approvato: ing.anagrafica.approvato } as (typeof righe)[number],
                ])
              }
            >
              Aggiungi revisione {String(doc.revisione).padStart(2, '0')}
            </Bottone>
          )}
          <Bottone
            tipo="primario"
            onClick={() =>
              void esegui(async () => {
                for (const r of righe) {
                  const { id, ...resto } = r
                  await api.salvaRevisione({ ...resto, ...(id ? { id } : {}), documento_id: doc.id })
                }
                setRighe(await api.leggiRevisioni(doc.id))
                await aggiorna()
              }, 'Revisioni salvate')
            }
          >
            Salva
          </Bottone>
        </>
      }
    >
      <p style={stili.nota}>La data si scrive come deve comparire nel documento, es. “Luglio 2026”.</p>
      <table style={stili.tabella}>
        <thead>
          <tr>
            {['Rev', 'Data', 'Descrizione', 'Redatto', 'Verificato', 'Approvato'].map((h) => (
              <th key={h} style={stili.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => {
            const set = (k: 'data' | 'descrizione' | 'redatto' | 'verificato' | 'approvato') => (v: string) =>
              setRighe(righe.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
            return (
              <tr key={i}>
                <td style={stili.td}>{String(r.revisione).padStart(2, '0')}</td>
                {(['data', 'descrizione', 'redatto', 'verificato', 'approvato'] as const).map((k) => (
                  <td key={k} style={stili.td}>
                    <input style={{ ...stili.input, width: '100%' }} value={r[k] ?? ''} onChange={(e) => set(k)(e.target.value)} />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </Sezione>
  )
}

// ---------------------------------------------------------------- ciclo di lavoro

/** Testo del ciclo di lavoro (paragrafi con elenco puntato), predefinito secondo il tipo di ambito. */
/** Numero con la virgola in una cella (vuoto = null). */
function CellaNumero({ valore, onChange, etichetta }: { valore: number | null; onChange: (x: number | null) => void; etichetta: string }) {
  return (
    <input
      aria-label={etichetta}
      inputMode="decimal"
      style={{ ...stili.input, width: 90, padding: '4px 6px' }}
      defaultValue={valore == null ? '' : String(valore).replace('.', ',')}
      onChange={(e) => {
        const n = e.target.value.trim() === '' ? null : numeroDa(e.target.value)
        if (e.target.value.trim() === '' || n !== null) onChange(n)
      }}
    />
  )
}

/** Tempi per metro lineare di avanzamento (scavo tradizionale) e metri scavati nel periodo. */
function EditorAvanzamento({ a, cambia }: { a: Avanzamento; cambia: (a: Avanzamento | null) => void }) {
  const fase = (i: number, p: Partial<Avanzamento['fasi'][number]>) => cambia({ ...a, fasi: a.fasi.map((f, j) => (j === i ? { ...f, ...p } : f)) })
  const prod = (i: number, p: Partial<Avanzamento['produzione'][number]>) => cambia({ ...a, produzione: a.produzione.map((f, j) => (j === i ? { ...f, ...p } : f)) })
  const tot = (m: MetodoScavo) => {
    const t = totaleMetro(a, m)
    return t == null ? '–' : `${String(t).replace('.', ',')} min/m`
  }
  return (
    <div role="group" aria-label="Tempi per metro lineare di avanzamento" style={{ marginTop: 14 }}>
      <b style={{ fontSize: 14 }}>Tempi per metro lineare di avanzamento (scavo tradizionale)</b>
      <p style={stili.nota}>Dati della direzione di cantiere: durata media di ogni fase per metro di avanzamento. Il DVR riporta la tabella dopo il ciclo di lavoro; le fasi senza tempi non compaiono.</p>
      <table style={stili.tabella}>
        <thead>
          <tr>
            {['Fase', 'Esplosivo [min/m]', 'Martellone [min/m]', ''].map((h) => (
              <th key={h} style={stili.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {a.fasi.map((f, i) => (
            <tr key={i}>
              <td style={stili.td}>
                <input aria-label={`Fase di avanzamento ${i + 1}`} style={{ ...stili.input, padding: '4px 6px' }} value={f.fase} onChange={(e) => fase(i, { fase: e.target.value })} />
              </td>
              <td style={stili.td}>
                <CellaNumero etichetta={`${f.fase || `Fase ${i + 1}`} – esplosivo`} valore={f.esplosivo} onChange={(x) => fase(i, { esplosivo: x })} />
              </td>
              <td style={stili.td}>
                <CellaNumero etichetta={`${f.fase || `Fase ${i + 1}`} – martellone`} valore={f.martellone} onChange={(x) => fase(i, { martellone: x })} />
              </td>
              <td style={stili.td}>
                <Bottone tipo="pericolo" onClick={() => cambia({ ...a, fasi: a.fasi.filter((_, j) => j !== i) })}>
                  ×
                </Bottone>
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ ...stili.td, fontWeight: 600 }}>Totale per metro</td>
            <td style={stili.td}>{tot('esplosivo')}</td>
            <td style={stili.td}>{tot('martellone')}</td>
            <td style={stili.td} />
          </tr>
        </tbody>
      </table>
      <div style={{ ...stili.riga, marginTop: 6 }}>
        <Bottone onClick={() => cambia({ ...a, fasi: [...a.fasi, { fase: '', esplosivo: null, martellone: null }] })}>+ Fase</Bottone>
      </div>
      <div style={{ marginTop: 10 }}>
        <Campo etichetta="Periodo della produzione (vuoto = periodo di riferimento del documento)" valore={a.periodo ?? ''} onChange={(v) => cambia({ ...a, periodo: v })} />
      </div>
      {a.produzione.map((p, i) => (
        <div key={i} style={{ ...stili.riga, marginTop: 6 }}>
          <select aria-label={`Metodo di scavo ${i + 1}`} style={stili.input} value={p.metodo} onChange={(e) => prod(i, { metodo: e.target.value as MetodoScavo })}>
            <option value="martellone">Martellone</option>
            <option value="esplosivo">Esplosivo</option>
          </select>
          <label style={{ fontSize: 13 }}>
            metri <CellaNumero etichetta={`Metri di avanzamento ${i + 1}`} valore={p.metri} onChange={(x) => prod(i, { metri: x })} />
          </label>
          <label style={{ fontSize: 13 }}>
            in giorni <CellaNumero etichetta={`Giorni di avanzamento ${i + 1}`} valore={p.giorni} onChange={(x) => prod(i, { giorni: x })} />
          </label>
          <Bottone tipo="pericolo" onClick={() => cambia({ ...a, produzione: a.produzione.filter((_, j) => j !== i) })}>
            ×
          </Bottone>
        </div>
      ))}
      <div style={{ ...stili.riga, marginTop: 6 }}>
        <Bottone onClick={() => cambia({ ...a, produzione: [...a.produzione, { metodo: 'martellone', metri: null, giorni: null }] })}>+ Metri scavati</Bottone>
        <Bottone tipo="pericolo" onClick={() => cambia(null)}>
          Togli i tempi per metro
        </Bottone>
      </div>
    </div>
  )
}

export function CicloLavoro({ ing, aggiorna, titolo, predefinito }: { ing: Ingresso; aggiorna: () => Promise<void>; titolo: string; predefinito?: BloccoTesto[] }) {
  const doc = ing.documento
  const tipi = ing.ambiti.filter((a) => doc.ambiti_ids.includes(a.id)).map((a) => a.tipo)
  const [c, setC] = useState<api.ContenutiRumore>(doc.contenuti ?? {})
  const ciclo = c.ciclo ?? predefinito ?? (cicloPredefinito(tipi).length ? cicloPredefinito(tipi) : [{ testo: '', punti: [] }])
  const tradizionale = (tipi.length ? tipi : ing.ambiti.map((a) => a.tipo)).includes('galleria_tradizionale')
  const salva = () =>
    esegui(async () => {
      await api.aggiornaContenuti(doc.id, { ciclo: c.ciclo ?? null, avanzamento: c.avanzamento ?? null })
      await aggiorna()
    }, 'Salvato')
  return (
    <Sezione titolo={titolo} chiusa azioni={<Bottone tipo="primario" onClick={() => void salva()}>Salva</Bottone>}>
      {ciclo.map((b, i) => (
        <div key={i} style={{ ...stili.griglia, gridTemplateColumns: '1fr 1fr', marginTop: 10 }}>
          <AreaTesto etichetta={`Paragrafo ${i + 1}`} valore={b.testo} onChange={(v) => setC({ ...c, ciclo: ciclo.map((x, j) => (j === i ? { ...x, testo: v } : x)) })} righe={5} />
          <AreaTesto etichetta="Elenco puntato (una voce per riga)" valore={b.punti.join('\n')} onChange={(v) => setC({ ...c, ciclo: ciclo.map((x, j) => (j === i ? { ...x, punti: v.split('\n').filter((y) => y.trim()) } : x)) })} righe={5} />
        </div>
      ))}
      <div style={stili.riga}>
        <Bottone onClick={() => setC({ ...c, ciclo: [...ciclo, { testo: '', punti: [] }] })}>+ Paragrafo</Bottone>
        {c.ciclo && <Bottone onClick={() => setC({ ...c, ciclo: undefined })}>Ripristina testo predefinito</Bottone>}
        {!c.avanzamento && (
          <Bottone
            onClick={() => setC({ ...c, avanzamento: { fasi: FASI_AVANZAMENTO.map((f) => ({ fase: f, esplosivo: null, martellone: null })), produzione: [] } })}
            title="Tabella dei tempi medi per metro lineare di avanzamento, come nei DVR dello scavo tradizionale"
          >
            + Tempi per metro lineare{tradizionale ? '' : ' (scavo tradizionale)'}
          </Bottone>
        )}
      </div>
      {c.avanzamento && <EditorAvanzamento a={c.avanzamento} cambia={(a) => setC({ ...c, avanzamento: a })} />}
    </Sezione>
  )
}
