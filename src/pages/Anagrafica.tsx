import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import NuovoTecnicoModal from '../components/NuovoTecnicoModal'
import NuovoStrumentoModal from '../components/NuovoStrumentoModal'
import type { Tecnico, Strumento } from '../types'
import { useTecnici } from '../hooks/useTecnici'
import { useStrumenti } from '../hooks/useStrumenti'
import EmptyState from '../components/EmptyState'
import { IconTecnico, IconStrumento } from '../components/icons/EmptyIcons'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'

function iniziali(nome: string, cognome: string): string {
  const a = (nome ?? '').trim().charAt(0).toUpperCase()
  const b = (cognome ?? '').trim().charAt(0).toUpperCase()
  return `${a}${b}` || '—'
}

function StrumentoIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <rect x="4" y="6" width="10" height="8" stroke={color} strokeWidth={1.4} fill="none" rx={1}/>
      <circle cx="9" cy="10" r="2" stroke={color} strokeWidth={1.4}/>
      <path d="M7 4 L11 4" stroke={color} strokeWidth={1.4}/>
    </svg>
  )
}

function CardTecnico({ tecnico }: { tecnico: Tecnico }) {
  return (
    <article style={styles.card}>
      <div style={styles.avatarTecnico}>{iniziali(tecnico.nome, tecnico.cognome)}</div>
      <div style={styles.cardBody}>
        <div style={styles.cardTitle}>{tecnico.nome} {tecnico.cognome}</div>
      </div>
      <div style={styles.dotsBtn} aria-hidden>⋯</div>
    </article>
  )
}

function CardStrumento({ strumento }: { strumento: Strumento }) {
  const sub = [strumento.modello, strumento.matricola ? `S/N ${strumento.matricola}` : null]
    .filter(Boolean)
    .join(' · ')
  return (
    <article style={styles.card}>
      <div style={styles.iconStrumento}>
        <StrumentoIcon color="#854F0B" />
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardTitle}>{strumento.nome}</div>
        {sub && <div style={styles.cardSub}>{sub}</div>}
      </div>
      <div style={styles.dotsBtn} aria-hidden>⋯</div>
    </article>
  )
}

function SkeletonRow({ avatar }: { avatar: 'tecnico' | 'strumento' }) {
  return (
    <div style={styles.card}>
      <div style={{ ...(avatar === 'tecnico' ? styles.avatarTecnico : styles.iconStrumento), background: 'var(--skeleton-bg)' }} />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={13} marginBottom={6} />
        <Skeleton width="35%" height={10} />
      </div>
    </div>
  )
}

export default function Anagrafica() {
  const navigate = useNavigate()
  const { tecnici, loading: loadingT, error: errorT, refetch: refetchT } = useTecnici()
  const { strumenti, loading: loadingS, error: errorS, refetch: refetchS } = useStrumenti()
  const [modaleTecnicoOpen, setModaleTecnicoOpen] = useState(false)
  const [modaleStrumentoOpen, setModaleStrumentoOpen] = useState(false)

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Torna ai cantieri"
          style={styles.backBtn}
        >
          ‹
        </button>
        <div style={styles.topBarLabel}>Cantieri</div>
      </div>

      <h1 style={styles.title}>Anagrafica</h1>

      {/* Sezione Tecnici */}
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>
          TECNICI{!loadingT && !errorT ? ` (${tecnici.length})` : ''}
        </div>
        <button type="button" style={styles.addLink} onClick={() => setModaleTecnicoOpen(true)}>+ Aggiungi</button>
      </div>

      {loadingT && (
        <div style={styles.list}>
          {[0, 1, 2].map((i) => <SkeletonRow key={i} avatar="tecnico" />)}
        </div>
      )}

      {!loadingT && errorT && <ErrorState message={errorT} onRetry={() => refetchT()} />}

      {!loadingT && !errorT && tecnici.length === 0 && (
        <EmptyState
          compact
          icon={<IconTecnico size={32} />}
          title="Nessun tecnico ancora"
          message="Aggiungi i tecnici che lavorano in cantiere per associarli alle campagne."
          actionLabel="Aggiungi tecnico"
          onAction={() => setModaleTecnicoOpen(true)}
        />
      )}

      {!loadingT && !errorT && tecnici.length > 0 && (
        <div style={styles.list}>
          {tecnici.map((t) => <CardTecnico key={t.id} tecnico={t} />)}
        </div>
      )}

      {/* Sezione Strumenti */}
      <div style={{ ...styles.sectionHeader, marginTop: 22 }}>
        <div style={styles.sectionTitle}>
          STRUMENTI{!loadingS && !errorS ? ` (${strumenti.length})` : ''}
        </div>
        <button type="button" style={styles.addLink} onClick={() => setModaleStrumentoOpen(true)}>+ Aggiungi</button>
      </div>

      {loadingS && (
        <div style={styles.list}>
          {[0, 1].map((i) => <SkeletonRow key={i} avatar="strumento" />)}
        </div>
      )}

      {!loadingS && errorS && <ErrorState message={errorS} onRetry={() => refetchS()} />}

      {!loadingS && !errorS && strumenti.length === 0 && (
        <EmptyState
          compact
          icon={<IconStrumento size={32} />}
          title="Nessuno strumento ancora"
          message="Aggiungi i tuoi strumenti di misura (fonometri, pompe, sonde) per associarli alle campagne."
          actionLabel="Aggiungi strumento"
          onAction={() => setModaleStrumentoOpen(true)}
        />
      )}

      {!loadingS && !errorS && strumenti.length > 0 && (
        <div style={styles.list}>
          {strumenti.map((s) => <CardStrumento key={s.id} strumento={s} />)}
        </div>
      )}

      <NuovoTecnicoModal
        open={modaleTecnicoOpen}
        onClose={() => setModaleTecnicoOpen(false)}
        onCreated={() => {
          refetchT()
        }}
      />

      <NuovoStrumentoModal
        open={modaleStrumentoOpen}
        onClose={() => setModaleStrumentoOpen(false)}
        onCreated={() => {
          refetchS()
        }}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-app)',
    padding: 'var(--space-page-top) var(--space-page-x) var(--space-page-bottom)',
    maxWidth: 640,
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    color: 'var(--accent)',
    fontSize: 18,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    fontFamily: 'inherit',
  },
  topBarLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    color: 'var(--text-primary)',
    margin: 0,
    marginBottom: 18,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: '0 2px',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.5px',
  },
  addLink: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 6,
    fontFamily: 'inherit',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 6,
  },
  card: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatarTecnico: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--bg-badge-open)',
    color: 'var(--text-badge-open)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 500,
    flexShrink: 0,
  },
  iconStrumento: {
    width: 32,
    height: 32,
    borderRadius: 6,
    background: '#FAEEDA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardSub: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginTop: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dotsBtn: {
    color: 'var(--text-tertiary)',
    fontSize: 14,
    paddingLeft: 6,
  },
}
