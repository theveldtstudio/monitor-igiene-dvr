/**
 * Piccoli componenti di interfaccia del modulo DVR (stessi token grafici dell'app).
 * Il DVR si usa soprattutto da computer: layout più largo delle pagine di campo.
 */
import type React from 'react'
import { useState } from 'react'
import { numeroDa, stili } from './stili'

export function Bottone({
  children,
  onClick,
  tipo = 'secondario',
  disabled,
  title,
}: {
  children: React.ReactNode
  onClick?: () => void
  tipo?: 'primario' | 'secondario' | 'pericolo'
  disabled?: boolean
  title?: string
}) {
  const base: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 8,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 12,
    paddingRight: 12,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    borderWidth: 1,
    borderStyle: 'solid',
    whiteSpace: 'nowrap',
  }
  const varianti: Record<string, React.CSSProperties> = {
    primario: { background: 'var(--accent)', color: 'var(--text-on-accent)', borderColor: 'var(--accent)' },
    secondario: { background: 'var(--bg-card)', color: 'var(--accent)', borderColor: 'var(--border)' },
    pericolo: { background: 'var(--bg-card)', color: '#b42318', borderColor: 'var(--border)' },
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} style={{ ...base, ...varianti[tipo] }}>
      {children}
    </button>
  )
}

export function Campo({
  etichetta,
  valore,
  onChange,
  tipo = 'text',
  segnaposto,
  larghezza,
}: {
  etichetta: string
  valore: string | number | null | undefined
  onChange: (v: string) => void
  tipo?: 'text' | 'number' | 'date'
  segnaposto?: string
  larghezza?: number
}) {
  return (
    <label style={{ ...stili.campo, ...(larghezza ? { width: larghezza } : {}) }}>
      {etichetta}
      <input
        type={tipo === 'number' ? 'text' : tipo}
        inputMode={tipo === 'number' ? 'decimal' : undefined}
        value={valore ?? ''}
        placeholder={segnaposto}
        onChange={(e) => onChange(e.target.value)}
        style={stili.input}
      />
    </label>
  )
}

/** Campo numerico con virgola decimale: il numero passa al genitore solo quando è valido. */
export function CampoNumero({
  etichetta,
  valore,
  onChange,
  larghezza,
  unita,
}: {
  etichetta: string
  valore: number | null | undefined
  onChange: (v: number | null) => void
  larghezza?: number
  unita?: string
}) {
  const formatta = (x: number | null | undefined) => (x === null || x === undefined ? '' : String(x).replace('.', ','))
  const [testo, setTesto] = useState(formatta(valore))
  const [ultimo, setUltimo] = useState(valore)
  if (valore !== ultimo) {
    setUltimo(valore)
    if (numeroDa(testo) !== (valore ?? null)) setTesto(formatta(valore))
  }
  return (
    <label style={{ ...stili.campo, ...(larghezza ? { width: larghezza } : {}) }}>
      {etichetta}
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="text"
          inputMode="decimal"
          value={testo}
          onChange={(e) => {
            setTesto(e.target.value)
            const n = numeroDa(e.target.value)
            if (n !== null || e.target.value.trim() === '') {
              setUltimo(n)
              onChange(n)
            }
          }}
          style={{ ...stili.input, width: '100%' }}
        />
        {unita && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{unita}</span>}
      </span>
    </label>
  )
}

export function AreaTesto({
  etichetta,
  valore,
  onChange,
  righe = 4,
}: {
  etichetta: string
  valore: string
  onChange: (v: string) => void
  righe?: number
}) {
  return (
    <label style={stili.campo}>
      {etichetta}
      <textarea value={valore} rows={righe} onChange={(e) => onChange(e.target.value)} style={{ ...stili.input, resize: 'vertical' }} />
    </label>
  )
}

export function Sezione({
  titolo,
  children,
  azioni,
  chiusa = false,
}: {
  titolo: string
  children: React.ReactNode
  azioni?: React.ReactNode
  chiusa?: boolean
}) {
  const [aperta, setAperta] = useState(!chiusa)
  return (
    <section style={stili.sezione}>
      <div style={{ ...stili.riga, justifyContent: 'space-between', marginBottom: aperta ? 10 : 0 }}>
        <button
          type="button"
          onClick={() => setAperta(!aperta)}
          style={{ ...stili.sezioneTitolo, margin: 0, background: 'none', borderWidth: 0, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
        >
          {aperta ? '▾' : '▸'} {titolo.toUpperCase()}
        </button>
        {aperta && azioni && <div style={stili.riga}>{azioni}</div>}
      </div>
      {aperta && children}
    </section>
  )
}
