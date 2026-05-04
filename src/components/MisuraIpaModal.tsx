import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraIpaModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type TipoMisura = '' | 'personale' | 'ambientale'

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

function formatNum(n: number, decimals = 3): string {
  return (Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals).replace('.', ',')
}

export default function MisuraIpaModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraIpaModalProps) {
  const [codiceCampione, setCodiceCampione] = useState('')
  const [numeroFiala, setNumeroFiala] = useState('')
  const [numeroMembrana, setNumeroMembrana] = useState('')
  const [durata, setDurata] = useState('')
  const [postazioneId, setPostazioneId] = useState<string | null>(null)
  const [faseId, setFaseId] = useState<string | null>(null)
  const [macchineIds, setMacchineIds] = useState<string[]>([])
  const [tipoMisura, setTipoMisura] = useState<TipoMisura>('')
  const [temp, setTemp] = useState('')
  const [vAria, setVAria] = useState('')
  const [pompa, setPompa] = useState('')
  const [portataQ, setPortataQ] = useState('')
  const [note, setNote] = useState('')

  const [postazioneModalOpen, setPostazioneModalOpen] = useState(false)
  const [faseModalOpen, setFaseModalOpen] = useState(false)
  const [macchineModalOpen, setMacchineModalOpen] = useState(false)

  const [misuraIdCorrente, setMisuraIdCorrente] = useState<string | null>(
    misuraDaModificare?.id ?? null
  )
  const [numeroMisuraCorrente, setNumeroMisuraCorrente] = useState<number | undefined>(
    misuraDaModificare?.numero
  )

  const isModifica = misuraIdCorrente != null

  const { risorse: postazioni } = useRisorseCantiere(cantiereId, 'postazione')
  const { risorse: fasi } = useRisorseCantiere(cantiereId, 'fase')
  const { risorse: macchine } = useRisorseCantiere(cantiereId, 'macchina')

  const createHook = useCreateMisura()
  const updateHook = useUpdateMisura()
  const saving = isModifica ? updateHook.saving : createHook.saving
  const error = isModifica ? updateHook.error : createHook.error
  const resetError = isModifica ? updateHook.resetError : createHook.resetError

  const initialSnapshot = useMemo(() => {
    if (!misuraDaModificare) return null
    const d = misuraDaModificare.dati as Record<string, unknown>
    return {
      codiceCampione: (d.codice_campione as string) ?? '',
      numeroFiala: (d.numero_fiala as string) ?? '',
      numeroMembrana: (d.numero_membrana as string) ?? '',
      durata: numToString(d.durata_prelievo),
      postazioneId: (d.postazione_id as string) ?? null,
      faseId: (d.fase_id as string) ?? null,
      macchineIds: (d.macchine_ids as string[]) ?? [],
      tipoMisura: (d.tipo_misura as TipoMisura) ?? '',
      temp: numToString(d.temperatura),
      vAria: numToString(d.velocita_aria),
      pompa: (d.pompa as string) ?? '',
      portataQ: numToString(d.portata_q),
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setCodiceCampione(initialSnapshot.codiceCampione)
        setNumeroFiala(initialSnapshot.numeroFiala)
        setNumeroMembrana(initialSnapshot.numeroMembrana)
        setDurata(initialSnapshot.durata)
        setPostazioneId(initialSnapshot.postazioneId)
        setFaseId(initialSnapshot.faseId)
        setMacchineIds(initialSnapshot.macchineIds)
        setTipoMisura(initialSnapshot.tipoMisura)
        setTemp(initialSnapshot.temp)
        setVAria(initialSnapshot.vAria)
        setPompa(initialSnapshot.pompa)
        setPortataQ(initialSnapshot.portataQ)
        setNote(initialSnapshot.note)
      } else {
        setCodiceCampione(''); setNumeroFiala(''); setNumeroMembrana(''); setDurata('')
        setPostazioneId(null); setFaseId(null); setMacchineIds([])
        setTipoMisura(''); setTemp(''); setVAria(''); setPompa(''); setPortataQ('')
        setNote('')
      }
      setPostazioneModalOpen(false); setFaseModalOpen(false); setMacchineModalOpen(false)
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
  const macchineNomi = useMemo(() => macchine.filter((m) => macchineIds.includes(m.id)).map((m) => m.valore), [macchine, macchineIds])

  const durataParsed = parseNumeroIT(durata)
  const tempParsed = parseNumeroIT(temp)
  const vAriaParsed = parseNumeroIT(vAria)
  const portataParsed = parseNumeroIT(portataQ)

  const volume = (portataParsed !== null && durataParsed !== null) ? (portataParsed * durataParsed) / 1000 : null

  const isAlmenoUnCampoCompilato = (
    codiceCampione !== '' || numeroFiala !== '' || numeroMembrana !== '' || durata !== '' ||
    postazioneId !== null || faseId !== null || macchineIds.length > 0 ||
    tipoMisura !== '' || temp !== '' || vAria !== '' || pompa !== '' || portataQ !== '' ||
    note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      codiceCampione !== initialSnapshot.codiceCampione ||
      numeroFiala !== initialSnapshot.numeroFiala || numeroMembrana !== initialSnapshot.numeroMembrana ||
      durata !== initialSnapshot.durata ||
      postazioneId !== initialSnapshot.postazioneId || faseId !== initialSnapshot.faseId ||
      JSON.stringify(macchineIds) !== JSON.stringify(initialSnapshot.macchineIds) ||
      tipoMisura !== initialSnapshot.tipoMisura ||
      temp !== initialSnapshot.temp || vAria !== initialSnapshot.vAria ||
      pompa !== initialSnapshot.pompa || portataQ !== initialSnapshot.portataQ ||
      note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (codiceCampione.trim()) dati.codice_campione = codiceCampione.trim()
    if (numeroFiala.trim()) dati.numero_fiala = numeroFiala.trim()
    if (numeroMembrana.trim()) dati.numero_membrana = numeroMembrana.trim()
    if (durataParsed !== null) dati.durata_prelievo = durataParsed
    if (postazioneId) {
      dati.postazione_id = postazioneId
      dati.postazione_nome = postazioneNome ?? ''
    }
    if (faseId) {
      dati.fase_id = faseId
      dati.fase_nome = faseNome ?? ''
    }
    if (macchineIds.length > 0) {
      dati.macchine_ids = macchineIds
      dati.macchine_nomi = macchineNomi
    }
    if (tipoMisura !== '') dati.tipo_misura = tipoMisura
    if (tempParsed !== null) dati.temperatura = tempParsed
    if (vAriaParsed !== null) dati.velocita_aria = vAriaParsed
    if (pompa.trim()) dati.pompa = pompa.trim()
    if (portataParsed !== null) dati.portata_q = portataParsed
    if (volume !== null) dati.volume_campionato = Math.round(volume * 1000) / 1000
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
  const handleSaveMacchine = async (ids: string[]): Promise<boolean> => { setMacchineIds(ids); return true }

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
          <label htmlFor="ipa-cod" style={styles.label}>Codice campione</label>
          <input id="ipa-cod" type="text" value={codiceCampione} onChange={(e) => setCodiceCampione(e.target.value)} placeholder="es. C-IPA-01" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(codiceCampione ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="ipa-fia" style={styles.label}>Numero fiala</label>
          <input id="ipa-fia" type="text" value={numeroFiala} onChange={(e) => setNumeroFiala(e.target.value)} placeholder="es. F-001" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(numeroFiala ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="ipa-mem" style={styles.label}>Numero membrana</label>
          <input id="ipa-mem" type="text" value={numeroMembrana} onChange={(e) => setNumeroMembrana(e.target.value)} placeholder="es. M-001" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(numeroMembrana ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="ipa-dur" style={styles.label}>Durata prelievo (min)</label>
          <input id="ipa-dur" type="text" value={durata} onChange={(e) => setDurata(e.target.value)} placeholder="es. 480" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(durata ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Postazione di misura</label>
          <button type="button" onClick={() => setPostazioneModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(postazioneNome ? styles.selectorBtnFilled : {}) }}>
            <span style={postazioneNome ? styles.selectorValue : styles.selectorPlaceholder}>{postazioneNome ?? 'Seleziona postazione'}</span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Fase lavorativa / Mansione</label>
          <button type="button" onClick={() => setFaseModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(faseNome ? styles.selectorBtnFilled : {}) }}>
            <span style={faseNome ? styles.selectorValue : styles.selectorPlaceholder}>{faseNome ?? 'Seleziona fase'}</span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Macchine/impianti{macchineIds.length > 0 ? ` (${macchineIds.length})` : ''}</label>
          <button type="button" onClick={() => setMacchineModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(macchineIds.length > 0 ? styles.selectorBtnFilled : {}) }}>
            <span style={macchineIds.length > 0 ? styles.selectorValue : styles.selectorPlaceholder}>
              {macchineIds.length > 0 ? macchineNomi.join(', ') : 'Seleziona macchine'}
            </span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label htmlFor="ipa-tipo" style={styles.label}>Tipo di misura</label>
          <select id="ipa-tipo" value={tipoMisura} onChange={(e) => setTipoMisura(e.target.value as TipoMisura)} disabled={saving}
            style={{ ...styles.input, ...(tipoMisura ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
            <option value="">— seleziona —</option>
            <option value="personale">Personale</option>
            <option value="ambientale">Ambientale</option>
          </select>
        </div>

        <div style={styles.field}>
          <label htmlFor="ipa-temp" style={styles.label}>Temperatura (°C)</label>
          <input id="ipa-temp" type="text" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="es. 22" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(temp ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="ipa-va" style={styles.label}>Velocità aria (m/s)</label>
          <input id="ipa-va" type="text" value={vAria} onChange={(e) => setVAria(e.target.value)} placeholder="es. 0,3" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(vAria ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="ipa-pompa" style={styles.label}>Pompa utilizzata</label>
          <input id="ipa-pompa" type="text" value={pompa} onChange={(e) => setPompa(e.target.value)} placeholder="es. Gillian GilAir 5" disabled={saving} maxLength={120}
            style={{ ...styles.input, ...(pompa ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="ipa-q" style={styles.label}>Portata aspirazione Q (l/min)</label>
          <input id="ipa-q" type="text" value={portataQ} onChange={(e) => setPortataQ(e.target.value)} placeholder="es. 2,0" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(portataQ ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.calcBox}>
          <div style={styles.calcLabel}>Volume campionato</div>
          {volume !== null ? (
            <div style={styles.calcValue}>
              <strong>{formatNum(volume)} m³</strong>
              <span style={styles.calcAsse}>auto: Q × durata / 1000</span>
            </div>
          ) : (
            <div style={styles.calcEmpty}>Compila Q e durata per calcolare il volume</div>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="ipa-note" style={styles.label}>Note</label>
          <textarea id="ipa-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
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

      <SelezionaRisorseModal
        open={macchineModalOpen}
        onClose={() => setMacchineModalOpen(false)}
        onSaveMultipla={handleSaveMacchine}
        modalita="multipla"
        initialSelectedIds={macchineIds}
        cantiereId={cantiereId}
        tipo="macchina"
        titolo="Macchine"
        labelSingolare="macchina"
        labelPlurale="macchine"
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
