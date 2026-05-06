import type React from 'react'
import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import NuovaCampagnaModal from '../components/NuovaCampagnaModal'
import { useCantiere } from '../hooks/useCantiere'
import { useCampagne } from '../hooks/useCampagne'
import type { Campagna } from '../types'
import { MODULI, CATEGORIE } from '../data/moduliCampionamento'
import type { ModuloCampionamento } from '../data/moduliCampionamento'
import EmptyState from '../components/EmptyState'
import { IconCampagna } from '../components/icons/EmptyIcons'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'

type StatoCampagna = Campagna['stato']

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

function formatData(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
}

function formatOra(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function ModuloIcona({ id, color }: { id: string; color: string }) {
  const stroke = color
  const sw = 1.4
  switch (id) {
    case 'rumore':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M3 9 L5 9 M5 5 L5 13 M7 3 L7 15 M9 6 L9 12 M11 4 L11 14 M13 7 L13 11" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'vibrazioni-wbv':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2" stroke={stroke} strokeWidth={sw}/><circle cx="9" cy="9" r="5" stroke={stroke} strokeWidth={sw} opacity="0.5"/><circle cx="9" cy="9" r="7.5" stroke={stroke} strokeWidth={sw} opacity="0.25"/></svg>
    case 'vibrazioni-hav':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M5 13 Q5 7 9 7 Q13 7 13 11" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/><path d="M9 7 L9 4" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'microclima':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M9 3 L9 13 M5 9 L13 9" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/><circle cx="9" cy="9" r="6" stroke={stroke} strokeWidth={sw}/></svg>
    case 'cem':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M3 9 Q5 6 7 9 T11 9 T15 9" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'roa':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" fill={stroke}/><path d="M9 2 L9 4 M9 14 L9 16 M2 9 L4 9 M14 9 L16 9 M4 4 L5.5 5.5 M12.5 12.5 L14 14 M14 4 L12.5 5.5 M5.5 12.5 L4 14" stroke={stroke} strokeWidth={1.2} strokeLinecap="round"/></svg>
    case 'gas':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M7 2 L11 2 L11 6 L13 9 Q13 14 9 14 Q5 14 5 9 L7 6 Z" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'polveri':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="6" cy="9" r="1.5" fill={stroke}/><circle cx="11" cy="6" r="1" fill={stroke}/><circle cx="13" cy="11" r="1.2" fill={stroke}/><circle cx="9" cy="13" r="0.8" fill={stroke}/></svg>
    case 'carbonio-elementare':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="5" stroke={stroke} strokeWidth={sw}/><text x="9" y="11" textAnchor="middle" fontSize="6" fill={stroke} fontWeight="500">C</text></svg>
    case 'ipa':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M5 6 L7 4 L9 6 L7 8 Z M9 10 L11 8 L13 10 L11 12 Z" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'amianto':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M3 6 L15 6 M3 9 L15 9 M3 12 L15 12" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'biologico-sas':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" stroke={stroke} strokeWidth={sw}/><circle cx="5" cy="5" r="1.5" stroke={stroke} strokeWidth={sw}/><circle cx="13" cy="13" r="1.5" stroke={stroke} strokeWidth={sw}/></svg>
    case 'acqua':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M9 3 Q5 8 5 11 Q5 14 9 14 Q13 14 13 11 Q13 8 9 3 Z" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'mmc':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x="6" y="6" width="6" height="6" stroke={stroke} strokeWidth={sw} fill="none"/><path d="M9 3 L9 6 M3 9 L6 9 M9 12 L9 15" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'owas':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="4" r="1.5" stroke={stroke} strokeWidth={sw}/><path d="M9 6 L9 11 M9 11 L6 15 M9 11 L12 15 M5 8 L13 8" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'ocra':
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M5 9 Q9 5 13 9 Q9 13 5 9 Z" stroke={stroke} strokeWidth={sw} fill="none"/><circle cx="9" cy="9" r="1" fill={stroke}/></svg>
    default:
      return <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x="4" y="4" width="10" height="10" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
  }
}

function badgeStato(stato: StatoCampagna): React.CSSProperties {
  if (stato === 'bozza') {
    return {
      background: '#FAEEDA',
      color: '#854F0B',
      padding: '4px 10px',
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: '0.3px',
    }
  }
  return {
    background: '#EAF3DE',
    color: '#3B6D11',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.3px',
  }
}

function CardCampagna({ campagna, cantiereId, moduloId }: { campagna: Campagna; cantiereId: string; moduloId: string }) {
  const isBozza = campagna.stato === 'bozza'
  return (
    <Link to={`/cantieri/${cantiereId}/moduli/${moduloId}/campagne/${campagna.id}`} style={styles.cardLink}>
      <article style={{ ...styles.card, ...(isBozza ? styles.cardBozza : {}) }}>
        <div style={styles.cardLeft}>
          <div style={styles.dataText}>{formatData(campagna.data_ora)}</div>
          <div style={styles.oraText}>{formatOra(campagna.data_ora)}</div>
        </div>
        <span style={badgeStato(campagna.stato)}>{campagna.stato.toUpperCase()}</span>
      </article>
    </Link>
  )
}

function SkeletonHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <Skeleton width={40} height={40} borderRadius={8} />
      <div style={{ flex: 1 }}>
        <Skeleton width="50%" height={18} marginBottom={6} />
        <Skeleton width="30%" height={11} />
      </div>
    </div>
  )
}

function SkeletonCards() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={styles.card}>
          <div style={{ flex: 1 }}>
            <Skeleton width="40%" height={16} marginBottom={6} />
            <Skeleton width="20%" height={11} />
          </div>
          <Skeleton width={70} height={18} borderRadius={6} />
        </div>
      ))}
    </div>
  )
}

export default function ListaCampagne() {
  const { id, moduloId } = useParams<{ id: string; moduloId: string }>()
  const navigate = useNavigate()
  const { cantiere, loading: loadingCantiere, error: errorCantiere, notFound, refetch: refetchCantiere } = useCantiere(id)

  const modulo: ModuloCampionamento | undefined = MODULI.find((m) => m.id === moduloId)
  const moduloNonValido = !modulo

  const { campagne, loading: loadingCampagne, error: errorCampagne, refetch: refetchCampagne } = useCampagne(id, moduloId)

  const loading = loadingCantiere || loadingCampagne
  const error = errorCantiere || errorCampagne
  const refetch = async () => {
    await Promise.all([refetchCantiere(), refetchCampagne()])
  }

  const [modaleAperto, setModaleAperto] = useState(false)

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button
          type="button"
          onClick={() => navigate(id ? `/cantieri/${id}` : '/')}
          aria-label="Torna alla pagina cantiere"
          style={styles.backBtn}
        >
          ‹
        </button>
        <div style={styles.topBarLabel}>{cantiere?.nome ?? 'Cantiere'}</div>
      </div>

      {loading && (
        <>
          <SkeletonHeader />
          <SkeletonCards />
        </>
      )}

      {!loading && error && (
        <ErrorState message={error} onRetry={() => refetch()} />
      )}

      {!loading && !error && (notFound || moduloNonValido) && (
        <EmptyState
          title={notFound ? 'Cantiere non trovato' : 'Modulo non valido'}
          message={notFound
            ? 'Il cantiere che cerchi non esiste o è stato rimosso.'
            : `Il modulo "${moduloId}" non è riconosciuto.`}
          actionLabel="Torna ai cantieri"
          onAction={() => navigate('/')}
        />
      )}

      {!loading && !error && !notFound && cantiere && modulo && (
        <>
          <div style={styles.headerModulo}>
            <div style={{ ...styles.iconWrap, background: CATEGORIE[modulo.categoria].bgIcona }}>
              <ModuloIcona id={modulo.id} color={CATEGORIE[modulo.categoria].colorAccento} />
            </div>
            <div style={styles.headerBody}>
              <div style={styles.titleModulo}>{modulo.nome}</div>
              <div style={{ ...styles.headerRif, color: CATEGORIE[modulo.categoria].colorAccento }}>
                {modulo.riferimentoNormativo}
              </div>
            </div>
          </div>

          <div style={styles.sectionTitle}>
            CAMPAGNE{campagne.length > 0 ? ` (${campagne.length})` : ''}
          </div>

          {campagne.length === 0 ? (
            <EmptyState
              icon={<IconCampagna />}
              title="Nessuna campagna per questo modulo"
              message="Crea una nuova campagna per iniziare a registrare le misure."
              actionLabel="Crea campagna"
              onAction={() => setModaleAperto(true)}
            />
          ) : (
            <div style={styles.list}>
              {campagne.map((c) => (
                <CardCampagna
                  key={c.id}
                  campagna={c}
                  cantiereId={cantiere.id}
                  moduloId={modulo.id}
                />
              ))}
            </div>
          )}

          <div style={styles.fabWrap}>
            <button
              type="button"
              style={styles.fab}
              onClick={() => setModaleAperto(true)}
            >
              + Nuova campagna
            </button>
          </div>

          {cantiere && modulo && (
            <NuovaCampagnaModal
              open={modaleAperto}
              onClose={() => setModaleAperto(false)}
              cantiereId={cantiere.id}
              cantiereNome={cantiere.nome}
              modulo={modulo}
              onCreated={(campagna) => {
                setModaleAperto(false)
                navigate(`/cantieri/${cantiere.id}/moduli/${modulo.id}/campagne/${campagna.id}`)
              }}
            />
          )}
        </>
      )}
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerModulo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  titleModulo: {
    fontSize: 18,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  headerRif: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.5px',
    marginBottom: 8,
    paddingLeft: 2,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  cardLink: {
    display: 'block',
  },
  card: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 10,
    padding: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardBozza: {
    border: '1.5px dashed #BA7517',
    padding: 13,
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
  },
  dataText: {
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  oraText: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    marginTop: 2,
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
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
