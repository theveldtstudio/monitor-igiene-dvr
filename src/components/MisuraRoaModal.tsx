import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraRoaModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type BandaSpettrale = '' | 'UV-C' | 'UV-B' | 'UV-A' | 'Visibile' | 'IR-A' | 'IR-B' | 'IR-C' | 'Laser'

function parseNumeroIT(s: string): number | null {
  const trimmed = s.trim()
  if (trimmed === '') return null
  const normalized = trimmed.replace(',', '.')
  const n = Number(normalized)
  if (!isFinite(n)) return null
  return n
}

function numToString(n: unknown): string {
  if (typeof n !== 'number' || !isFinite(n)) return ''
  return String(n).replace('.', ',')
}

function formatNum(n: number, decimals = 2): string {
  return (Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals).replace('.', ',')
}

export default function MisuraRoaModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraRoaModalProps) {
  const [durata, setDurata] = useState('')
  const [postazioneId, setPostazioneId] = useState<string | null>(null)
  const [faseId, setFaseId] = useState<string | null>(null)
  const [sorgente, setSorgente] = useState('')
  const [banda, setBanda] = useState<BandaSpettrale>('')
  const [lunghezzaOnda, setLunghezzaOnda] = useState('')
  const [distanza, setDistanza] = useState('')
  const [irradianzaE, setIrradianzaE] = useState('')
  const [radianzaL, setRadianzaL] = useState('')
  const [tempoEsposizione, setTempoEsposizione] = useState('')
  const [hManuale, setHManuale] = useState('')
  const [limite, setLimite] = useState('')
  const [indice, setIndice] = useState('')
  const [note, setNote] = useState('')

  const [postazioneModalOpen, setPostazioneModalOpen] = useState(false)
  const [faseModalOpen, setFaseModalOpen] = useState(false)

  const [misuraIdCorrente, setMisuraIdCorrente] = useState<string | null>(
    misuraDaModificare?.id ?? null
  )
  const [numeroMisuraCorrente, setNumeroMisuraCorrente] = useState<number | undefined>(
    misuraDaModificare?.numero
  )

  const isModifica = misuraIdCorrente != null

  const { risorse: postazioni } = useRisorseCantiere(cantiereId, 'postazione')
  const { risorse: fasi } = useRisorseCantiere(cantiereId, 'fase')

  const createHook = useCreateMisura()
  const updateHook = useUpdateMisura()
  const saving = isModifica ? updateHook.saving : createHook.saving
  const error = isModifica ? updateHook.error : createHook.error
  const resetError = isModifica ? updateHook.resetError : createHook.resetError

  const initialSnapshot = useMemo(() => {
    if (!misuraDaModificare) return null
    const d = misuraDaModificare.dati as Record<string, unknown>
    return {
      durata: (d.durata as string) ?? '',
      postazioneId: (d.postazione_id as string) ?? null,
      faseId: (d.fase_id as string) ?? null,
      sorgente: (d.sorgente as string) ?? '',
      banda: (d.banda as BandaSpettrale) ?? '',
      lunghezzaOnda: numToString(d.lunghezza_onda),
      distanza: numToString(d.distanza),
      irradianzaE: numToString(d.irradianza_e),
      radianzaL: numToString(d.radianza_l),
      tempoEsposizione: numToString(d.tempo_esposizione),
      hManuale: numToString(d.h_manuale),
      limite: (d.limite_riferimento as string) ?? '',
      indice: numToString(d.indice_esposizione),
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setDurata(initialSnapshot.durata)
        setPostazioneId(initialSnapshot.postazioneId)
        setFaseId(initialSnapshot.faseId)
        setSorgente(initialSnapshot.sorgente)
        setBanda(initialSnapshot.banda)
        setLunghezzaOnda(initialSnapshot.lunghezzaOnda)
        setDistanza(initialSnapshot.distanza)
        setIrradianzaE(initialSnapshot.irradianzaE)
        setRadianzaL(initialSnapshot.radianzaL)
        setTempoEsposizione(initialSnapshot.tempoEsposizione)
        setHManuale(initialSnapshot.hManuale)
        setLimite(initialSnapshot.limite)
        setIndice(initialSnapshot.indice)
        setNote(initialSnapshot.note)
      } else {
        setDurata(''); setPostazioneId(null); setFaseId(null); setSorgente(''); setBanda('')
        setLunghezzaOnda(''); setDistanza(''); setIrradianzaE(''); setRadianzaL('')
        setTempoEsposizione(''); setHManuale(''); setLimite(''); setIndice(''); setNote('')
      }
      setPostazioneModalOpen(false); setFaseModalOpen(false)
      resetError()
    }
  }, [open, initialSnapshot, resetError])

  useEffect(() => {
    if (open) {
      setMisuraIdCorrente(misuraDaModificare?.id ?? null)
      setNumeroMisuraCorrente(misuraDaModificare?.numero)
    } else {
      setMisuraIdCorrente(null)
      setNumeroMisuraCorrente(undefined)
    }
  }, [open, misuraDaModificare?.id, misuraDaModificare?.numero])

  const postazioneNome = useMemo(() => postazioni.find((p) => p.id === postazioneId)?.valore ?? null, [postazioni, postazioneId])
  const faseNome = useMemo(() => fasi.find((f) => f.id === faseId)?.valore ?? null, [fasi, faseId])

  const lunghezzaOndaParsed = parseNumeroIT(lunghezzaOnda)
  const distanzaParsed = parseNumeroIT(distanza)
  const irradianzaEParsed = parseNumeroIT(irradianzaE)
  const radianzaLParsed = parseNumeroIT(radianzaL)
  const tempoParsed = parseNumeroIT(tempoEsposizione)
  const hManualeParsed = parseNumeroIT(hManuale)
  const indiceParsed = parseNumeroIT(indice)

  const hCalcolato = (irradianzaEParsed !== null && tempoParsed !== null) ? irradianzaEParsed * tempoParsed : null

  const isAlmenoUnCampoCompilato = (
    durata !== '' || postazioneId !== null || faseId !== null || sorgente !== '' || banda !== '' ||
    lunghezzaOnda !== '' || distanza !== '' || irradianzaE !== '' || radianzaL !== '' ||
    tempoEsposizione !== '' || hManuale !== '' || limite !== '' || indice !== '' || note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      durata !== initialSnapshot.durata || postazioneId !== initialSnapshot.postazioneId ||
      faseId !== initialSnapshot.faseId || sorgente !== initialSnapshot.sorgente ||
      banda !== initialSnapshot.banda || lunghezzaOnda !== initialSnapshot.lunghezzaOnda ||
      distanza !== initialSnapshot.distanza ||
      irradianzaE !== initialSnapshot.irradianzaE || radianzaL !== initialSnapshot.radianzaL ||
      tempoEsposizione !== initialSnapshot.tempoEsposizione || hManuale !== initialSnapshot.hManuale ||
      limite !== initialSnapshot.limite || indice !== initialSnapshot.indice ||
      note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (durata.trim()) dati.durata = durata.trim()
    if (postazioneId) {
      dati.postazione_id = postazioneId
      dati.postazione_nome = postazioneNome ?? ''
    }
    if (faseId) {
      dati.fase_id = faseId
      dati.fase_nome = faseNome ?? ''
    }
    if (sorgente.trim()) dati.sorgente = sorgente.trim()
    if (banda !== '') dati.banda = banda
    if (lunghezzaOndaParsed !== null) dati.lunghezza_onda = lunghezzaOndaParsed
    if (distanzaParsed !== null) dati.distanza = distanzaParsed
    if (irradianzaEParsed !== null) dati.irradianza_e = irradianzaEParsed
    if (radianzaLParsed !== null) dati.radianza_l = radianzaLParsed
    if (tempoParsed !== null) dati.tempo_esposizione = tempoParsed

    if (hManualeParsed !== null) {
      dati.h_radiant = hManualeParsed
      dati.h_manuale = hManualeParsed
    } else if (hCalcolato !== null) {
      dati.h_radiant = Math.round(hCalcolato * 100) / 100
    }
    if (hCalcolato !== null) {
      dati.h_calcolato = Math.round(hCalcolato * 100) / 100
    }

    if (limite.trim()) dati.limite_riferimento = limite.trim()
    if (indiceParsed !== null) dati.indice_esposizione = indiceParsed
    return dati
  }

  const handleSubmit = async () => {
    const dati = buildDati()
    const noteTrim = note.trim()
    let result: Misura | null
    if (misuraIdCorrente) {
      result = await updateHook.updateMisura({ id: misuraIdCorrente, dati, note: noteTrim })
    } else {
      result = await createHook.createMisura({ campagna_id: campagnaId, dati, note: noteTrim || undefined })
    }
    if (result) {
      onSaved(result)
      if (!misuraIdCorrente) {
        setMisuraIdCorrente(result.id)
        setNumeroMisuraCorrente(result.numero)
      } else {
        onClose()
      }
    }
  }

  const handleSavePostazione = async (id: string | null): Promise<boolean> => { setPostazioneId(id); return true }
  const handleSaveFase = async (id: string | null): Promise<boolean> => { setFaseId(id); return true }

  return (
    <>
      <MisuraModalShell
        open={open}
        onClose={onClose}
        isModifica={isModifica}
        numeroMisura={numeroMisuraCorrente}
        isValid={isValid}
        isDirty={isDirty}
        saving={saving}
        saveError={error}
        onSubmit={handleSubmit}
      >
        <div style={styles.field}>
          <label htmlFor="roa-durata" style={styles.label}>Durata</label>
          <input id="roa-durata" type="text" value={durata} onChange={(e) => setDurata(e.target.value)} placeholder="es. 30'" disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(durata ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Postazione</label>
          <button type="button" onClick={() => setPostazioneModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(postazioneNome ? styles.selectorBtnFilled : {}) }}>
            <span style={postazioneNome ? styles.selectorValue : styles.selectorPlaceholder}>{postazioneNome ?? 'Seleziona postazione'}</span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Fase lavorativa</label>
          <button type="button" onClick={() => setFaseModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(faseNome ? styles.selectorBtnFilled : {}) }}>
            <span style={faseNome ? styles.selectorValue : styles.selectorPlaceholder}>{faseNome ?? 'Seleziona fase'}</span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-sorg" style={styles.label}>Sorgente ROA</label>
          <input id="roa-sorg" type="text" value={sorgente} onChange={(e) => setSorgente(e.target.value)} placeholder="es. saldatrice ad arco MAG" disabled={saving} maxLength={120}
            style={{ ...styles.input, ...(sorgente ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-banda" style={styles.label}>Banda spettrale</label>
          <select id="roa-banda" value={banda} onChange={(e) => setBanda(e.target.value as BandaSpettrale)} disabled={saving}
            style={{ ...styles.input, ...(banda ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
            <option value="">— seleziona —</option>
            <option value="UV-C">UV-C (180-280 nm)</option>
            <option value="UV-B">UV-B (280-315 nm)</option>
            <option value="UV-A">UV-A (315-400 nm)</option>
            <option value="Visibile">Visibile (400-780 nm)</option>
            <option value="IR-A">IR-A (780-1400 nm)</option>
            <option value="IR-B">IR-B (1400-3000 nm)</option>
            <option value="IR-C">IR-C (3000+ nm)</option>
            <option value="Laser">Laser</option>
          </select>
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-lo" style={styles.label}>Lunghezza d'onda (nm)</label>
          <input id="roa-lo" type="text" value={lunghezzaOnda} onChange={(e) => setLunghezzaOnda(e.target.value)} placeholder="es. 254" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(lunghezzaOnda ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-dist" style={styles.label}>Distanza dalla sorgente (m)</label>
          <input id="roa-dist" type="text" value={distanza} onChange={(e) => setDistanza(e.target.value)} placeholder="es. 1,5" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(distanza ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-e" style={styles.label}>Irradianza E (W/m²)</label>
          <input id="roa-e" type="text" value={irradianzaE} onChange={(e) => setIrradianzaE(e.target.value)} placeholder="es. 0,5" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(irradianzaE ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-l" style={styles.label}>Radianza L (W/m²·sr)</label>
          <input id="roa-l" type="text" value={radianzaL} onChange={(e) => setRadianzaL(e.target.value)} placeholder="opzionale" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(radianzaL ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-t" style={styles.label}>Tempo esposizione (s)</label>
          <input id="roa-t" type="text" value={tempoEsposizione} onChange={(e) => setTempoEsposizione(e.target.value)} placeholder="es. 480" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(tempoEsposizione ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-h" style={styles.label}>Esposizione radiante H (J/m²)</label>
          <input id="roa-h" type="text" value={hManuale} onChange={(e) => setHManuale(e.target.value)} placeholder="opzionale (auto-calcolata se vuota)" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(hManuale ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.calcBox}>
          <div style={styles.calcLabel}>H definitivo</div>
          {hManualeParsed !== null ? (
            <div style={styles.calcValue}>
              <strong>{formatNum(hManualeParsed)} J/m²</strong>
              <span style={styles.calcAsse}>manuale</span>
            </div>
          ) : hCalcolato !== null ? (
            <div style={styles.calcValue}>
              <strong>{formatNum(hCalcolato)} J/m²</strong>
              <span style={styles.calcAsse}>auto: E × tempo</span>
            </div>
          ) : (
            <div style={styles.calcEmpty}>Compila E e tempo, oppure inserisci H manualmente</div>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-lim" style={styles.label}>Limite di riferimento</label>
          <input id="roa-lim" type="text" value={limite} onChange={(e) => setLimite(e.target.value)} placeholder='es. "30 J/m²"' disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(limite ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-ind" style={styles.label}>Indice di esposizione (%)</label>
          <input id="roa-ind" type="text" value={indice} onChange={(e) => setIndice(e.target.value)} placeholder="es. 80" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(indice ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="roa-note" style={styles.label}>Note</label>
          <textarea id="roa-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
            style={{ ...styles.textarea, ...(note ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <FotoUploader misuraId={misuraIdCorrente} maxFoto={5} />
        </div>
      </MisuraModalShell>

      <SelezionaRisorseModal
        open={postazioneModalOpen}
        onClose={() => setPostazioneModalOpen(false)}
        onSaveSingola={handleSavePostazione}
        modalita="singola"
        initialSelectedId={postazioneId}
        cantiereId={cantiereId}
        tipo="postazione"
        titolo="Postazione"
        labelSingolare="postazione"
        labelPlurale="postazioni"
        permettiNessuno={true}
        saving={false}
        saveError={null}
      />

      <SelezionaRisorseModal
        open={faseModalOpen}
        onClose={() => setFaseModalOpen(false)}
        onSaveSingola={handleSaveFase}
        modalita="singola"
        initialSelectedId={faseId}
        cantiereId={cantiereId}
        tipo="fase"
        titolo="Fase lavorativa"
        labelSingolare="fase"
        labelPlurale="fasi"
        permettiNessuno={true}
        saving={false}
        saveError={null}
      />
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 60 },
  inputFilled: { borderColor: 'var(--accent)' },
  inputDisabled: { background: 'var(--bg-toggle)', opacity: 0.7, cursor: 'not-allowed' },
  selectorBtn: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', boxSizing: 'border-box' },
  selectorBtnFilled: { borderColor: 'var(--accent)' },
  selectorValue: { color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 },
  selectorPlaceholder: { color: 'var(--text-tertiary)', flex: 1, marginRight: 8 },
  selectorChevron: { color: 'var(--text-tertiary)', fontSize: 16, flexShrink: 0 },
  calcBox: { background: 'var(--bg-toggle)', borderWidth: '0.5px', borderStyle: 'dashed', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 },
  calcLabel: { fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  calcValue: { display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 16, color: 'var(--text-primary)' },
  calcAsse: { fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' },
  calcEmpty: { fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' },
}
