import type React from 'react'
import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppLock } from '../contexts/AppLockContext'
import type { Cantiere } from '../types'
import { useCantieri } from '../hooks/useCantieri'
import { useUpdateCantiere } from '../hooks/useUpdateCantiere'
import NuovoCantiereModal from '../components/NuovoCantiereModal'
import CardActionsMenu from '../components/CardActionsMenu'
import type { CardAction } from '../components/CardActionsMenu'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { IconCantiere } from '../components/icons/EmptyIcons'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'

type FiltroStato = 'aperti' | 'archiviati'
type StatoCantiere = Cantiere['stato']

interface PendingStateChange {
  cantiere: Cantiere
  nuovoStato: StatoCantiere
}

function formatDataApertura(iso: string): string {
  const d = new Date(iso)
  const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
  return `aperto il ${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`
}

function labelAzioneStato(da: StatoCantiere, a: StatoCantiere): string {
  if (a === 'aperto') return 'Riapri cantiere'
  if (a === 'chiuso') return 'Chiudi cantiere'
  if (a === 'sospeso') return da === 'aperto' ? 'Sospendi' : 'Sospendi cantiere'
  return 'Cambia stato'
}

function titoloConferma(nuovoStato: StatoCantiere): string {
  if (nuovoStato === 'aperto') return 'Riaprire il cantiere?'
  if (nuovoStato === 'chiuso') return 'Chiudere il cantiere?'
  return 'Sospendere il cantiere?'
}

function messaggioConferma(cantiere: Cantiere, nuovoStato: StatoCantiere): React.ReactNode {
  const nome = <strong style={{ color: 'var(--text-primary)' }}>{cantiere.nome}</strong>
  if (nuovoStato === 'aperto') {
    return <>{nome} tornerà tra i cantieri aperti.</>
  }
  if (nuovoStato === 'chiuso') {
    return <>{nome} verrà spostato negli archiviati. Potrai riaprirlo in qualsiasi momento.</>
  }
  return <>{nome} verrà sospeso e spostato negli archiviati. Potrai riaprirlo in qualsiasi momento.</>
}

export default function Home() {
  const navigate = useNavigate()
  const { cantieri, loading, error, refetch } = useCantieri()
  const { updateCantiere, saving: savingStato } = useUpdateCantiere()
  const { lock } = useAppLock()
  const [lockBtnHovered, setLockBtnHovered] = useState(false)
  const [filtro, setFiltro] = useState<FiltroStato>('aperti')
  const [modaleAperto, setModaleAperto] = useState(false)
  const [cantiereDaModificare, setCantiereDaModificare] = useState<Cantiere | null>(null)
  const [menuApertoId, setMenuApertoId] = useState<string | null>(null)
  const [pendingChange, setPendingChange] = useState<PendingStateChange | null>(null)

  const cantieriFiltrati = useMemo(() => {
    if (filtro === 'aperti') {
      return cantieri.filter((c) => c.stato === 'aperto')
    }
    return cantieri.filter((c) => c.stato !== 'aperto')
  }, [cantieri, filtro])

  const countAperti = useMemo(
    () => cantieri.filter((c) => c.stato === 'aperto').length,
    [cantieri]
  )
  const countArchiviati = useMemo(
    () => cantieri.filter((c) => c.stato !== 'aperto').length,
    [cantieri]
  )

  const showCounts = !loading && !error

  const handleApriNuovo = () => {
    setCantiereDaModificare(null)
    setModaleAperto(true)
  }

  const handleApriModifica = (c: Cantiere) => {
    setCantiereDaModificare(c)
    setModaleAperto(true)
  }

  const handleChiudiModale = () => {
    setModaleAperto(false)
    setCantiereDaModificare(null)
  }

  const handleRichiediCambioStato = (c: Cantiere, nuovoStato: StatoCantiere) => {
    setPendingChange({ cantiere: c, nuovoStato })
  }

  const handleConfermaCambioStato = async () => {
    if (!pendingChange) return
    const result = await updateCantiere({
      id: pendingChange.cantiere.id,
      stato: pendingChange.nuovoStato,
    })
    if (result) {
      setPendingChange(null)
      refetch()
    }
  }

  const azioniPerCantiere = (c: Cantiere): CardAction[] => {
    const azioni: CardAction[] = [
      { label: 'Modifica', onClick: () => handleApriModifica(c) },
    ]
    if (c.stato === 'aperto') {
      azioni.push({ label: labelAzioneStato(c.stato, 'chiuso'), onClick: () => handleRichiediCambioStato(c, 'chiuso'), variant: 'danger' })
      azioni.push({ label: labelAzioneStato(c.stato, 'sospeso'), onClick: () => handleRichiediCambioStato(c, 'sospeso') })
    } else if (c.stato === 'chiuso') {
      azioni.push({ label: labelAzioneStato(c.stato, 'aperto'), onClick: () => handleRichiediCambioStato(c, 'aperto') })
    } else if (c.stato === 'sospeso') {
      azioni.push({ label: labelAzioneStato(c.stato, 'aperto'), onClick: () => handleRichiediCambioStato(c, 'aperto') })
      azioni.push({ label: labelAzioneStato(c.stato, 'chiuso'), onClick: () => handleRichiediCambioStato(c, 'chiuso'), variant: 'danger' })
    }
    return azioni
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Cantieri</h1>
        <div style={styles.headerRight}>
          <button
            type="button"
            onClick={lock}
            title="Blocca app"
            aria-label="Blocca app"
            style={{
              ...styles.lockBtn,
              ...(lockBtnHovered ? styles.lockBtnHover : {}),
            }}
            onMouseEnter={() => setLockBtnHovered(true)}
            onMouseLeave={() => setLockBtnHovered(false)}
          >
            🔒
          </button>
          <button
            type="button"
            onClick={() => navigate('/anagrafica')}
            style={styles.anagraficaBtn}
            aria-label="Apri anagrafica tecnici e strumenti"
          >
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="6" cy="7" r="2.5" stroke="currentColor" strokeWidth={1.4}/>
              <circle cx="13" cy="7" r="2" stroke="currentColor" strokeWidth={1.4} opacity={0.7}/>
              <path d="M2 14 Q6 11 10 14 M10 14 Q12 12 16 14" stroke="currentColor" strokeWidth={1.4} fill="none"/>
            </svg>
            Anagrafica
          </button>
          <div style={styles.avatar}>M</div>
        </div>
      </header>

      <div style={styles.toggleWrap}>
        <button
          type="button"
          onClick={() => setFiltro('aperti')}
          style={{
            ...styles.toggleBtn,
            ...(filtro === 'aperti' ? styles.toggleBtnActive : {}),
          }}
        >
          {showCounts ? `Aperti (${countAperti})` : 'Aperti'}
        </button>
        <button
          type="button"
          onClick={() => setFiltro('archiviati')}
          style={{
            ...styles.toggleBtn,
            ...(filtro === 'archiviati' ? styles.toggleBtnActive : {}),
          }}
        >
          {showCounts ? `Archiviati (${countArchiviati})` : 'Archiviati'}
        </button>
      </div>

      {loading && <SkeletonList />}

      {!loading && error && (
        <ErrorState message={error} onRetry={() => refetch()} />
      )}

      {!loading && !error && cantieriFiltrati.length === 0 && (
        <EmptyState
          icon={<IconCantiere />}
          title={filtro === 'aperti' ? 'Nessun cantiere aperto' : 'Nessun cantiere archiviato'}
          message={filtro === 'aperti'
            ? 'Crea il tuo primo cantiere per iniziare a registrare le campagne di monitoraggio.'
            : 'I cantieri archiviati appariranno qui.'}
          actionLabel={filtro === 'aperti' ? 'Crea cantiere' : undefined}
          onAction={filtro === 'aperti' ? handleApriNuovo : undefined}
        />
      )}

      {!loading && !error && cantieriFiltrati.length > 0 && (
        <div style={styles.list}>
          {cantieriFiltrati.map((c) => {
            const menuOpen = menuApertoId === c.id
            return (
              <div key={c.id} style={styles.cardWrapper}>
                <Link to={`/cantieri/${c.id}`} data-testid="cantiere-card" style={styles.cardLink}>
                  <article style={styles.card}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardTitle}>{c.nome}</span>
                      <div style={styles.cardHeaderRight}>
                        <span style={badgeStyle()}>{c.stato.toUpperCase()}</span>
                        <button
                          type="button"
                          aria-label="Azioni cantiere"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setMenuApertoId(menuOpen ? null : c.id)
                          }}
                          style={{
                            ...styles.menuBtn,
                            ...(menuOpen ? styles.menuBtnActive : {}),
                          }}
                        >
                          ⋯
                        </button>
                      </div>
                    </div>
                    <div style={styles.cardAddress}>{c.indirizzo}</div>
                    <div style={styles.cardDate}>{formatDataApertura(c.created_at)}</div>
                  </article>
                </Link>
                <div style={styles.menuAnchor}>
                  <CardActionsMenu
                    open={menuOpen}
                    onClose={() => setMenuApertoId(null)}
                    actions={azioniPerCantiere(c)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={styles.fabWrap}>
        <button
          type="button"
          style={styles.fab}
          onClick={handleApriNuovo}
        >
          + Nuovo cantiere
        </button>
      </div>

      <NuovoCantiereModal
        open={modaleAperto}
        onClose={handleChiudiModale}
        onCreated={() => {
          refetch()
        }}
        cantiereDaModificare={cantiereDaModificare}
      />

      <ConfirmDialog
        open={pendingChange != null}
        title={pendingChange ? titoloConferma(pendingChange.nuovoStato) : ''}
        message={pendingChange ? messaggioConferma(pendingChange.cantiere, pendingChange.nuovoStato) : ''}
        confirmLabel={
          pendingChange?.nuovoStato === 'aperto'
            ? 'Sì, riapri'
            : pendingChange?.nuovoStato === 'chiuso'
              ? 'Sì, chiudi cantiere'
              : 'Sì, sospendi'
        }
        variant={pendingChange?.nuovoStato === 'chiuso' ? 'danger' : 'default'}
        loading={savingStato}
        onConfirm={handleConfermaCambioStato}
        onCancel={() => setPendingChange(null)}
      />
    </div>
  )
}

function SkeletonList() {
  return (
    <div style={styles.list}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={styles.card}>
          <Skeleton width="70%" height={14} marginBottom={8} />
          <Skeleton width="40%" height={10} marginBottom={8} />
          <Skeleton width="55%" height={9} />
        </div>
      ))}
    </div>
  )
}

function badgeStyle(): React.CSSProperties {
  return {
    background: 'var(--bg-badge-open)',
    color: 'var(--text-badge-open)',
    padding: '3px 8px',
    borderRadius: 'var(--radius-badge)',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.3px',
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-app)',
    padding: 'var(--space-page-top) var(--space-page-x) var(--space-page-bottom)',
    maxWidth: 640,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-section-gap)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  lockBtn: {
    background: 'transparent',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    borderRadius: 6,
    fontSize: 16,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBtnHover: {
    background: 'var(--bg-toggle)',
  },
  anagraficaBtn: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    color: 'var(--accent)',
    padding: '6px 12px',
    borderRadius: 18,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'inherit',
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    color: 'var(--text-primary)',
    margin: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-avatar)',
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 500,
  },
  toggleWrap: {
    display: 'flex',
    gap: 4,
    background: 'var(--bg-toggle)',
    padding: 4,
    borderRadius: 'var(--radius-toggle-outer)',
    marginBottom: 'var(--space-section-gap)',
  },
  toggleBtn: {
    flex: 1,
    padding: 8,
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--radius-toggle-inner)',
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 400,
  },
  toggleBtnActive: {
    background: 'var(--bg-card)',
    color: 'var(--text-badge-open)',
    fontWeight: 500,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-card-gap)',
    marginBottom: 24,
  },
  cardWrapper: {
    position: 'relative',
  },
  cardLink: {
    display: 'block',
  },
  card: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--space-card-pad)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)',
    flex: 1,
  },
  cardAddress: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
  },
  menuBtn: {
    width: 26,
    height: 26,
    border: 'none',
    background: 'transparent',
    borderRadius: 6,
    fontSize: 16,
    lineHeight: 1,
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  menuBtnActive: {
    background: 'var(--bg-toggle)',
    color: 'var(--accent)',
  },
  menuAnchor: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 0,
    height: 0,
  },
  fabWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  fab: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    padding: '12px 20px',
    borderRadius: 'var(--radius-fab)',
    fontSize: 14,
    fontWeight: 500,
    boxShadow: '0 2px 8px var(--accent-shadow)',
  },
}
