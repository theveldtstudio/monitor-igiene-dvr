import type React from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import type { Cantiere } from '../types'
import { useCantiere } from '../hooks/useCantiere'
import { CATEGORIE, ORDINE_CATEGORIE, moduliPerCategoria } from '../data/moduliCampionamento'
import type { CategoriaModulo, ModuloCampionamento } from '../data/moduliCampionamento'
import SezioneRisorse from '../components/SezioneRisorse'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import { useEsportaCantiere } from '../hooks/useEsportaCantiere'
import { EsportaCantiereModal } from '../components/EsportaCantiereModal'

function formatDataApertura(iso: string): string {
  const d = new Date(iso)
  const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
  return `aperto il ${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`
}

function ModuloIcona({ id, color }: { id: string; color: string }) {
  const stroke = color
  const sw = 1.4
  switch (id) {
    case 'rumore':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9 L5 9 M5 5 L5 13 M7 3 L7 15 M9 6 L9 12 M11 4 L11 14 M13 7 L13 11" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'vibrazioni-wbv':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2" stroke={stroke} strokeWidth={sw}/><circle cx="9" cy="9" r="5" stroke={stroke} strokeWidth={sw} opacity="0.5"/><circle cx="9" cy="9" r="7.5" stroke={stroke} strokeWidth={sw} opacity="0.25"/></svg>
    case 'vibrazioni-hav':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 13 Q5 7 9 7 Q13 7 13 11" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/><path d="M9 7 L9 4" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'microclima':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3 L9 13 M5 9 L13 9" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/><circle cx="9" cy="9" r="6" stroke={stroke} strokeWidth={sw}/></svg>
    case 'cem':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9 Q5 6 7 9 T11 9 T15 9" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'roa':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" fill={stroke}/><path d="M9 2 L9 4 M9 14 L9 16 M2 9 L4 9 M14 9 L16 9 M4 4 L5.5 5.5 M12.5 12.5 L14 14 M14 4 L12.5 5.5 M5.5 12.5 L4 14" stroke={stroke} strokeWidth={1.2} strokeLinecap="round"/></svg>
    case 'gas':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 2 L11 2 L11 6 L13 9 Q13 14 9 14 Q5 14 5 9 L7 6 Z" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'polveri':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="6" cy="9" r="1.5" fill={stroke}/><circle cx="11" cy="6" r="1" fill={stroke}/><circle cx="13" cy="11" r="1.2" fill={stroke}/><circle cx="9" cy="13" r="0.8" fill={stroke}/></svg>
    case 'carbonio-elementare':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="5" stroke={stroke} strokeWidth={sw}/><text x="9" y="11" textAnchor="middle" fontSize="6" fill={stroke} fontWeight="500">C</text></svg>
    case 'ipa':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 6 L7 4 L9 6 L7 8 Z M9 10 L11 8 L13 10 L11 12 Z" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'amianto':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 6 L15 6 M3 9 L15 9 M3 12 L15 12" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'biologico-sas':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" stroke={stroke} strokeWidth={sw}/><circle cx="5" cy="5" r="1.5" stroke={stroke} strokeWidth={sw}/><circle cx="13" cy="13" r="1.5" stroke={stroke} strokeWidth={sw}/></svg>
    case 'acqua':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3 Q5 8 5 11 Q5 14 9 14 Q13 14 13 11 Q13 8 9 3 Z" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'mmc':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="6" y="6" width="6" height="6" stroke={stroke} strokeWidth={sw} fill="none"/><path d="M9 3 L9 6 M3 9 L6 9 M9 12 L9 15" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'owas':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="4" r="1.5" stroke={stroke} strokeWidth={sw}/><path d="M9 6 L9 11 M9 11 L6 15 M9 11 L12 15 M5 8 L13 8" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'ocra':
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 9 Q9 5 13 9 Q9 13 5 9 Z" stroke={stroke} strokeWidth={sw} fill="none"/><circle cx="9" cy="9" r="1" fill={stroke}/></svg>
    default:
      return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="4" y="4" width="10" height="10" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
  }
}

function CardModulo({ modulo, cantiereId }: { modulo: ModuloCampionamento; cantiereId: string }) {
  const cat = CATEGORIE[modulo.categoria]
  return (
    <Link to={`/cantieri/${cantiereId}/moduli/${modulo.id}`} data-testid={`modulo-card-${modulo.id}`} style={styles.cardLink}>
      <article style={styles.cardModulo}>
        <div style={{ ...styles.iconWrap, background: cat.bgIcona }}>
          <ModuloIcona id={modulo.id} color={cat.colorAccento} />
        </div>
        <div style={styles.moduloBody}>
          <div style={styles.moduloNome}>{modulo.nome}</div>
          <div style={{ ...styles.moduloRif, color: cat.colorAccento }}>{modulo.riferimentoNormativo}</div>
          {modulo.descrizioneBreve && (
            <div style={styles.moduloDescr}>{modulo.descrizioneBreve}</div>
          )}
        </div>
        <div style={styles.chevron}>›</div>
      </article>
    </Link>
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
    flexShrink: 0,
  }
}

function SkeletonHeader() {
  return (
    <div>
      <Skeleton width="60%" height={22} marginBottom={8} />
      <Skeleton width="30%" height={13} marginBottom={4} />
      <Skeleton width="45%" height={11} />
    </div>
  )
}

function SkeletonModuli() {
  return (
    <div style={{ marginTop: 18 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          <Skeleton width="40%" height={11} marginBottom={8} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1].map((j) => (
              <div key={j} style={{ ...styles.cardModulo, alignItems: 'center' }}>
                <div style={{ ...styles.iconWrap, background: 'var(--skeleton-bg)' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="50%" height={14} marginBottom={6} />
                  <Skeleton width="30%" height={10} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PaginaCantiere() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cantiere, loading, error, notFound, refetch } = useCantiere(id)
  const exportZip = useEsportaCantiere(cantiere ?? ({ id: '', nome: '', indirizzo: '', committente: null, stato: 'aperto', created_at: '' } as Cantiere))

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

      {loading && (
        <>
          <SkeletonHeader />
          <SkeletonModuli />
        </>
      )}

      {!loading && error && (
        <ErrorState message={error} onRetry={() => refetch()} />
      )}

      {!loading && !error && notFound && (
        <EmptyState
          title="Cantiere non trovato"
          message="Il cantiere che cerchi non esiste o è stato rimosso."
          actionLabel="Torna ai cantieri"
          onAction={() => navigate('/')}
        />
      )}

      {!loading && !error && cantiere && (
        <>
          <div style={styles.headerCantiere}>
            <div style={styles.headerTopRow}>
              <h1 style={styles.titleCantiere}>{cantiere.nome}</h1>
              <div style={styles.headerActions}>
                <span style={badgeStyle()}>{cantiere.stato.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => { void exportZip.avvia() }}
                  disabled={exportZip.stato === 'in-corso'}
                  style={styles.btnEsportaZip}
                  title="Esporta tutte le campagne del cantiere in un file zip"
                >
                  📦 Esporta cantiere (zip)
                </button>
              </div>
            </div>
            {cantiere.indirizzo && <div style={styles.headerIndirizzo}>{cantiere.indirizzo}</div>}
            <div style={styles.headerData}>{formatDataApertura(cantiere.created_at)}</div>
          </div>

          {exportZip.stato !== 'idle' && (
            <EsportaCantiereModal
              open={true}
              onClose={() => exportZip.reset()}
              onAnnulla={() => { exportZip.annulla(); exportZip.reset() }}
              progress={exportZip.progress}
              stato={exportZip.stato}
              errore={exportZip.errore ?? undefined}
            />
          )}

          <section style={styles.section}>
            <div style={styles.sectionTitle}>CONFIGURAZIONE</div>
            <SezioneRisorse
              cantiereId={cantiere.id}
              tipo="macchina"
              titolo="Macchine"
              labelSingolare="macchina"
              labelPlurale="macchine"
            />
            <SezioneRisorse
              cantiereId={cantiere.id}
              tipo="fase"
              titolo="Fasi lavorative"
              labelSingolare="fase"
              labelPlurale="fasi"
            />
            <SezioneRisorse
              cantiereId={cantiere.id}
              tipo="postazione"
              titolo="Postazioni"
              labelSingolare="postazione"
              labelPlurale="postazioni"
            />
          </section>

          {ORDINE_CATEGORIE.map((catId) => {
            const cat = CATEGORIE[catId as CategoriaModulo]
            const moduli = moduliPerCategoria(catId as CategoriaModulo)
            return (
              <section key={catId} style={styles.section}>
                <div style={styles.sectionTitle}>{cat.label.toUpperCase()}</div>
                <div style={styles.sectionList}>
                  {moduli.map((m) => (
                    <CardModulo key={m.id} modulo={m} cantiereId={cantiere.id} />
                  ))}
                </div>
              </section>
            )
          })}
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
  },
  headerCantiere: {
    marginBottom: 18,
  },
  headerTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  titleCantiere: {
    fontSize: 20,
    fontWeight: 500,
    color: 'var(--text-primary)',
    margin: 0,
    lineHeight: 1.3,
  },
  headerIndirizzo: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 2,
  },
  headerData: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.5px',
    marginBottom: 8,
    paddingLeft: 2,
  },
  sectionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardLink: {
    display: 'block',
  },
  cardModulo: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 10,
    padding: 12,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduloBody: {
    flex: 1,
    minWidth: 0,
  },
  moduloNome: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  moduloRif: {
    fontSize: 10,
    marginTop: 2,
  },
  moduloDescr: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginTop: 4,
  },
  chevron: {
    color: 'var(--text-tertiary)',
    fontSize: 16,
    alignSelf: 'center',
  },
  headerActions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  btnEsportaZip: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 14,
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
}
