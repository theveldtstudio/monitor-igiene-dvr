import type React from 'react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import type { Tecnico, Strumento, Misura, FotoMisura } from '../types'
import { supabase } from '../lib/supabase'
import { useCampagna } from '../hooks/useCampagna'
import { useCantiere } from '../hooks/useCantiere'
import { useTecnici } from '../hooks/useTecnici'
import { useStrumenti } from '../hooks/useStrumenti'
import { useUpdateCampagna } from '../hooks/useUpdateCampagna'
import { useMisure } from '../hooks/useMisure'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useDeleteMisura } from '../hooks/useDeleteMisura'
import { useDeleteCampagna } from '../hooks/useDeleteCampagna'
import SelezioneTecniciModal from '../components/SelezioneTecniciModal'
import SelezioneStrumentoModal from '../components/SelezioneStrumentoModal'
import SelezionaCampagneModal from '../components/SelezionaCampagneModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { MODULI } from '../data/moduliCampionamento'
import type { ModuloCampionamento } from '../data/moduliCampionamento'

import CardMisuraGenerica from '../components/CardMisuraGenerica'
import { getModuloEntry } from '../data/moduliRegistry'
import { exportFromTemplate, exportMultiCampagne, type FotoSheetContext } from '../lib/exportExcel'
import { getExportSchema, type ExportContext } from '../data/exportSchemas'
import { campagneRepo, misureRepo } from '../lib/offline'
import { toast } from '../lib/toast/toastApi'
import Spinner from '../components/Spinner'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

function formatDataGrande(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
}

function formatDataOraInfo(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function badgeStato(stato: 'bozza' | 'completa'): React.CSSProperties {
  const isBozza = stato === 'bozza'
  return {
    background: isBozza ? '#FAEEDA' : '#EAF3DE',
    color: isBozza ? '#854F0B' : '#3B6D11',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.3px',
    flexShrink: 0,
  }
}

function SkeletonBlock() {
  return (
    <div>
      <Skeleton width="50%" height={22} marginBottom={8} />
      <Skeleton width="70%" height={12} marginBottom={18} />
      <Skeleton width="30%" height={11} marginBottom={8} />
      <div style={styles.infoCard}>
        <Skeleton width="60%" height={14} marginBottom={4} />
        <Skeleton width="40%" height={11} marginBottom={14} />
        <Skeleton width="60%" height={14} marginBottom={4} />
        <Skeleton width="40%" height={11} marginBottom={14} />
        <Skeleton width="60%" height={14} marginBottom={4} />
        <Skeleton width="40%" height={11} />
      </div>
    </div>
  )
}

export default function FoglioCampagna() {
  const { id, moduloId, campagnaId } = useParams<{ id: string; moduloId: string; campagnaId: string }>()
  const navigate = useNavigate()

  const { campagna, loading: loadingCa, error: errorCa, notFound: notFoundCa, refetch: refetchCa } = useCampagna(campagnaId)
  const { cantiere, loading: loadingCantiere } = useCantiere(id)
  const { tecnici: tuttiTecnici, loading: loadingT } = useTecnici()
  const { strumenti: tuttiStrumenti, loading: loadingS } = useStrumenti()
  const { saving, updateCampagna, resetError } = useUpdateCampagna()
  const [modaleTecniciOpen, setModaleTecniciOpen] = useState(false)
  const [modaleStrumentoOpen, setModaleStrumentoOpen] = useState(false)
  const [confirmCompletaOpen, setConfirmCompletaOpen] = useState(false)
  const [confirmRiapriOpen, setConfirmRiapriOpen] = useState(false)
  const { misure, loading: loadingMisure, refetch: refetchMisure } = useMisure(campagnaId)
  const { risorse: risorsePostazioni } = useRisorseCantiere(id, 'postazione')
  const { risorse: risorseFasi } = useRisorseCantiere(id, 'fase')
  const { risorse: risorseMacchine } = useRisorseCantiere(id, 'macchina')
  const risorse = useMemo(
    () => [...risorsePostazioni, ...risorseFasi, ...risorseMacchine],
    [risorsePostazioni, risorseFasi, risorseMacchine],
  )
  const [nuovaMisuraOpen, setNuovaMisuraOpen] = useState(false)
  const [misuraInModifica, setMisuraInModifica] = useState<Misura | null>(null)
  const [misuraDaEliminare, setMisuraDaEliminare] = useState<Misura | null>(null)
  const { deleteMisura, deleting: deletingMisura, error: deleteMisuraError, resetError: resetDeleteMisuraError } = useDeleteMisura()
  const { deleteCampagna, deleting: deletingCampagna, resetError: resetDeleteCampagnaError } = useDeleteCampagna()
  const numeroMisure = misure.length
  const [confirmEliminaCampagnaOpen, setConfirmEliminaCampagnaOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [selezionaCampagneOpen, setSelezionaCampagneOpen] = useState(false)

  const handleExportMultipleCampagne = async (campagneIds: string[]) => {
    if (!cantiere || !moduloId) return
    const schema = getExportSchema(moduloId)
    if (!schema) {
      toast.error('Export non disponibile per questo modulo')
      return
    }
    setExporting(true)
    setExportError(null)
    try {
      // Costruisce un ExportContext per campagna (offline-first via repo).
      // tecnici/strumento risolti dalle liste globali; risorse condivise (livello cantiere).
      const contexts: ExportContext[] = []
      for (const cid of campagneIds) {
        const ca = await campagneRepo.getById(cid)
        if (!ca) continue
        const ms = await misureRepo.list(cid)
        if (ms.length === 0) continue // salta campagne senza misure
        const tecnici = tuttiTecnici.filter((t) => ca.tecnici_ids.includes(t.id))
        const strumento = ca.strumento_id
          ? tuttiStrumenti.find((s) => s.id === ca.strumento_id) ?? null
          : null
        contexts.push({ cantiere, campagna: ca, misure: ms, tecnici, strumento, risorse })
      }

      if (contexts.length === 0) {
        toast.warning('Nessuna misura trovata nelle campagne selezionate')
        return
      }

      const safe = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
      const today = new Date().toISOString().slice(0, 10)
      const filename = `${safe}_${moduloId}_MultiCampagna_${today}.xlsx`

      await exportMultiCampagne(schema, contexts, filename)

      const nMisure = contexts.reduce((acc, c) => acc + c.misure.length, 0)
      toast.success(`Esportate ${nMisure} misure da ${contexts.length} campagne`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore export'
      setExportError(msg)
      toast.error(`Errore durante l'export: ${msg}`)
    } finally {
      setExporting(false)
    }
  }

  const misureIdsKey = useMemo(
    () => misure.map((m) => m.id).sort().join(','),
    [misure],
  )

  const { data: fotoTutte } = useQuery({
    queryKey: ['foto-misure-campagna', campagnaId, misureIdsKey],
    queryFn: async () => {
      const misureIds = misure.map((m) => m.id)
      if (misureIds.length === 0) return []
      const { data, error } = await supabase
        .from('foto_misura')
        .select('*')
        .in('misura_id', misureIds)
      if (error) throw error
      return (data ?? []) as FotoMisura[]
    },
    enabled: misure.length > 0,
  })

  const handleApriModifica = (m: Misura) => {
    setMisuraInModifica(m)
  }

  const handleChiudiModificaModale = () => {
    setMisuraInModifica(null)
  }

  const handleRichiediEliminaMisura = (m: Misura) => {
    resetDeleteMisuraError()
    setMisuraDaEliminare(m)
  }

  const handleConfermaEliminaMisura = async () => {
    if (!misuraDaEliminare) return
    const ok = await deleteMisura(misuraDaEliminare.id)
    if (ok) {
      setMisuraDaEliminare(null)
      await refetchMisure()
    }
  }

  const handleAnnullaEliminaMisura = () => {
    if (deletingMisura) return
    setMisuraDaEliminare(null)
    resetDeleteMisuraError()
  }

  const handleRichiediEliminaCampagna = () => {
    resetDeleteCampagnaError()
    setConfirmEliminaCampagnaOpen(true)
  }

  const handleConfermaEliminaCampagna = async () => {
    if (!campagna) return
    const ok = await deleteCampagna(campagna.id)
    if (ok) {
      setConfirmEliminaCampagnaOpen(false)
      navigate(id && moduloId ? `/cantieri/${id}/moduli/${moduloId}` : '/')
    }
  }

  const modulo: ModuloCampionamento | undefined = useMemo(() => MODULI.find((m) => m.id === moduloId), [moduloId])
  const moduloEntry = getModuloEntry(moduloId)
  const moduloSupportato = moduloEntry !== undefined
  const isCompleta = campagna?.stato === 'completa'

  const tecniciSelezionati: Tecnico[] = useMemo(() => {
    if (!campagna) return []
    return tuttiTecnici.filter((t) => campagna.tecnici_ids.includes(t.id))
  }, [campagna, tuttiTecnici])

  const strumentoSelezionato: Strumento | null = useMemo(() => {
    if (!campagna || !campagna.strumento_id) return null
    return tuttiStrumenti.find((s) => s.id === campagna.strumento_id) ?? null
  }, [campagna, tuttiStrumenti])

  const handleEsportaExcel = async () => {
    if (!cantiere || !campagna) return
    const schema = getExportSchema(moduloId)
    if (!schema) {
      setExportError('Export non disponibile per questo modulo')
      return
    }
    setExporting(true)
    setExportError(null)
    try {
      const ctx = {
        cantiere,
        campagna,
        misure,
        tecnici: tecniciSelezionati,
        strumento: strumentoSelezionato,
        risorse,
      }

      let fotoCtx: FotoSheetContext | undefined
      if ((fotoTutte ?? []).length > 0) {
        const fotoPerMisura = new Map<string, FotoMisura[]>()
        for (const f of (fotoTutte ?? [])) {
          const arr = fotoPerMisura.get(f.misura_id) ?? []
          arr.push(f)
          fotoPerMisura.set(f.misura_id, arr)
        }
        fotoCtx = { misure, fotoPerMisura, risorse }
      }

      await exportFromTemplate(
        schema.templateUrl,
        (workbook) => schema.applyData(ctx, workbook),
        schema.buildFilename(ctx),
        fotoCtx,
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore export'
      setExportError(msg)
    } finally {
      setExporting(false)
    }
  }

  const loading = loadingCa || loadingCantiere || loadingT || loadingS
  const moduloNonValido = !!moduloId && !modulo

  const handleConfermaCompleta = async () => {
    if (!campagna) return
    resetError()
    const result = await updateCampagna({ id: campagna.id, stato: 'completa' })
    if (result) {
      setConfirmCompletaOpen(false)
      await refetchCa()
    }
  }

  const handleConfermaRiapri = async () => {
    if (!campagna) return
    resetError()
    const result = await updateCampagna({ id: campagna.id, stato: 'bozza' })
    if (result) {
      setConfirmRiapriOpen(false)
      await refetchCa()
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button
          type="button"
          onClick={() => navigate(id && moduloId ? `/cantieri/${id}/moduli/${moduloId}` : '/')}
          aria-label="Torna alla lista campagne"
          style={styles.backBtn}
        >
          ‹
        </button>
        <div style={styles.topBarLabel}>{modulo?.nome ?? 'Campagna'}</div>
      </div>

      {loading && <SkeletonBlock />}

      {!loading && errorCa && (
        <ErrorState message={errorCa} onRetry={() => refetchCa()} />
      )}

      {!loading && !errorCa && (notFoundCa || moduloNonValido) && (
        <EmptyState
          title={notFoundCa ? 'Campagna non trovata' : 'Modulo non valido'}
          message={notFoundCa ? 'La campagna che cerchi non esiste o è stata rimossa.' : `Il modulo "${moduloId}" non è riconosciuto.`}
          actionLabel="Torna indietro"
          onAction={() => navigate(id ? `/cantieri/${id}` : '/')}
        />
      )}

      {!loading && !errorCa && !notFoundCa && !moduloNonValido && campagna && modulo && (
        <>
          {/* Header campagna */}
          <div style={styles.headerCampagna}>
            <div style={styles.headerLeft}>
              <div style={styles.dataGrande}>{formatDataGrande(campagna.data_ora)}</div>
              <div style={styles.contesto}>
                {modulo.nome}{cantiere ? ` — ${cantiere.nome}` : ''}
              </div>
            </div>
            <span style={badgeStato(campagna.stato)}>{campagna.stato.toUpperCase()}</span>
          </div>

          {isCompleta && (
            <div style={styles.bannerCompleta}>
              <span style={styles.bannerCompletaIcon}>🔒</span>
              <span>Campagna completata. Tap "Riapri" per modificare.</span>
            </div>
          )}

          {/* Info campagna */}
          <div style={styles.sectionTitle}>INFO CAMPAGNA</div>
          <div style={styles.infoCard}>

            <div style={styles.infoRow}>
              <div style={styles.infoLeft}>
                <div style={styles.infoLabel}>Data e ora</div>
                <div style={styles.infoValue}>{formatDataOraInfo(campagna.data_ora)}</div>
              </div>
              <div style={styles.infoActionMuted} aria-hidden>›</div>
            </div>

            <div style={styles.infoSeparator} />

            <div style={styles.infoRow}>
              <div style={styles.infoLeft}>
                <div style={styles.infoLabel}>
                  Tecnici{tecniciSelezionati.length > 0 ? ` (${tecniciSelezionati.length})` : ''}
                </div>
                {tecniciSelezionati.length === 0 ? (
                  <div style={styles.infoValueEmpty}>Nessun tecnico</div>
                ) : (
                  <div style={styles.infoValue}>
                    {tecniciSelezionati.map((t) => `${t.nome} ${t.cognome}`).join(', ')}
                  </div>
                )}
              </div>
              {!isCompleta && (
                <button
                  type="button"
                  onClick={() => setModaleTecniciOpen(true)}
                  style={styles.infoActionBtn}
                >
                  {tecniciSelezionati.length === 0 ? '+ Aggiungi' : 'Modifica'}
                </button>
              )}
            </div>

            <div style={styles.infoSeparator} />

            <div style={styles.infoRow}>
              <div style={styles.infoLeft}>
                <div style={styles.infoLabel}>Strumento</div>
                {strumentoSelezionato ? (
                  <div style={styles.infoValue}>{strumentoSelezionato.nome}</div>
                ) : (
                  <div style={styles.infoValueEmpty}>Nessuno strumento</div>
                )}
              </div>
              {!isCompleta && (
                <button
                  type="button"
                  onClick={() => setModaleStrumentoOpen(true)}
                  style={styles.infoActionBtn}
                >
                  {strumentoSelezionato ? 'Modifica' : '+ Seleziona'}
                </button>
              )}
            </div>

          </div>

          <div style={styles.sectionTitle}>MISURE ({numeroMisure})</div>

          {loadingMisure && (
            <div style={styles.skeletonMisureList}>
              {[0, 1].map((i) => (
                <div key={i} style={styles.skeletonMisuraCard}>
                  <Skeleton width="50%" height={14} marginBottom={6} />
                  <Skeleton width="70%" height={11} />
                </div>
              ))}
            </div>
          )}

          {!loadingMisure && numeroMisure === 0 && (
            <div style={styles.emptyMisure}>
              <div style={styles.emptyTitle}>Nessuna misura ancora</div>
              <div style={styles.emptyMessage}>
                Usa <strong>+ Nuova misura</strong> per registrare la prima.
              </div>
            </div>
          )}

          {!loadingMisure && numeroMisure > 0 && moduloEntry && (
            <div style={styles.misureList}>
              {misure.map((m: Misura) => (
                <CardMisuraGenerica
                  key={m.id}
                  misura={m}
                  subtitleBuilder={moduloEntry.subtitleBuilder}
                  onModifica={() => handleApriModifica(m)}
                  onElimina={() => handleRichiediEliminaMisura(m)}
                  readOnly={isCompleta}
                />
              ))}
            </div>
          )}

          <div style={styles.fabWrap}>
            <button
              type="button"
              onClick={() => setNuovaMisuraOpen(true)}
              disabled={!moduloSupportato || isCompleta}
              style={{
                ...styles.fab,
                ...((!moduloSupportato || isCompleta) ? styles.fabDisabled : {}),
              }}
              aria-label={isCompleta ? 'Campagna completata, riapri per aggiungere misure' : moduloSupportato ? 'Aggiungi misura' : 'Modulo non ancora supportato'}
            >
              + Nuova misura
            </button>
          </div>
          {isCompleta && (
            <div style={styles.fabHint}>Riapri la campagna per aggiungere misure</div>
          )}
          {!moduloSupportato && (
            <div style={styles.moduloNonSupportatoHint}>
              Il form misure per <strong>{modulo?.nome ?? 'questo modulo'}</strong> arriva nelle prossime fasi.
            </div>
          )}

          {campagna.stato === 'bozza' && (
            <>
              <button
                type="button"
                onClick={() => setConfirmCompletaOpen(true)}
                disabled={numeroMisure === 0 || saving}
                style={{
                  ...styles.btnCompleta,
                  ...((numeroMisure === 0 || saving) ? styles.btnCompletaDisabled : {}),
                }}
              >
                Completa campagna
              </button>
              {numeroMisure === 0 && (
                <div style={styles.btnCompletaHint}>
                  Disponibile dopo aver registrato almeno una misura
                </div>
              )}
            </>
          )}

          {campagna.stato === 'completa' && (
            <>
              <button
                type="button"
                onClick={() => setConfirmRiapriOpen(true)}
                disabled={saving}
                style={{
                  ...styles.btnRiapri,
                  ...(saving ? styles.btnDisabled : {}),
                }}
              >
                Riapri come bozza
              </button>
              <div style={styles.btnCompletaHint}>
                La campagna è stata completata. Riaprila se devi aggiungere o modificare misure.
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleEsportaExcel}
            disabled={exporting || !getExportSchema(moduloId)}
            style={styles.btnEsportaExcel}
            aria-label="Esporta in Excel"
          >
            {exporting ? <><Spinner /><span style={{ marginLeft: 6 }}>Esportazione…</span></> : 'Esporta in Excel'}
          </button>
          {exportError && (
            <div style={styles.exportErrorBox}>{exportError}</div>
          )}
          {!getExportSchema(moduloId) && (
            <div style={styles.helperText}>Export non ancora disponibile per questo modulo</div>
          )}

          <button
            type="button"
            onClick={() => setSelezionaCampagneOpen(true)}
            style={styles.btnEsportaExcel}
            aria-label="Esporta da più campagne"
          >
            Esporta da più campagne
          </button>

          <button
            type="button"
            onClick={handleRichiediEliminaCampagna}
            disabled={deletingCampagna}
            style={styles.btnEliminaCampagna}
            aria-label="Elimina campagna"
          >
            {deletingCampagna ? 'Eliminazione…' : 'Elimina campagna'}
          </button>

          <SelezioneTecniciModal
            open={modaleTecniciOpen}
            onClose={() => setModaleTecniciOpen(false)}
            selezionatiAttuali={campagna.tecnici_ids}
            saving={saving}
            onConfirm={async (ids) => {
              const result = await updateCampagna({ id: campagna.id, tecnici_ids: ids })
              if (result) {
                setModaleTecniciOpen(false)
                refetchCa()
              }
            }}
          />

          <SelezioneStrumentoModal
            open={modaleStrumentoOpen}
            onClose={() => setModaleStrumentoOpen(false)}
            selezionatoAttuale={campagna.strumento_id}
            saving={saving}
            onConfirm={async (strumentoId) => {
              const result = await updateCampagna({ id: campagna.id, strumento_id: strumentoId })
              if (result) {
                setModaleStrumentoOpen(false)
                refetchCa()
              }
            }}
          />

          {cantiere && moduloId && (
            <SelezionaCampagneModal
              open={selezionaCampagneOpen}
              onClose={() => setSelezionaCampagneOpen(false)}
              cantiereId={cantiere.id}
              moduloId={moduloId}
              campagnaAttuale={campagna.id}
              onExport={handleExportMultipleCampagne}
            />
          )}

          <ConfirmDialog
            open={confirmCompletaOpen}
            title="Completare la campagna?"
            message={
              <>
                La campagna sarà marcata come <strong>completata</strong>. Le misure non potranno più essere modificate finché non la riapri.
              </>
            }
            confirmLabel="Sì, completa"
            variant="default"
            loading={saving}
            onConfirm={handleConfermaCompleta}
            onCancel={() => setConfirmCompletaOpen(false)}
          />

          <ConfirmDialog
            open={confirmRiapriOpen}
            title="Riaprire la campagna?"
            message={
              <>
                La campagna tornerà in <strong>bozza</strong>. Potrai aggiungere o modificare misure.
              </>
            }
            confirmLabel="Sì, riapri"
            variant="default"
            loading={saving}
            onConfirm={handleConfermaRiapri}
            onCancel={() => setConfirmRiapriOpen(false)}
          />

          {moduloEntry && cantiere && (() => {
            const ModalComponent = moduloEntry.modalComponent
            return (
              <>
                <ModalComponent
                  open={nuovaMisuraOpen}
                  onClose={() => setNuovaMisuraOpen(false)}
                  cantiereId={cantiere.id}
                  campagnaId={campagna.id}
                  onSaved={() => { refetchMisure() }}
                />
                <ModalComponent
                  open={misuraInModifica !== null}
                  onClose={handleChiudiModificaModale}
                  cantiereId={cantiere.id}
                  campagnaId={campagna.id}
                  misuraDaModificare={misuraInModifica}
                  onSaved={() => { refetchMisure() }}
                />
              </>
            )
          })()}

          <ConfirmDialog
            open={confirmEliminaCampagnaOpen}
            title="Eliminare la campagna?"
            message={
              numeroMisure > 0
                ? `Verranno eliminate anche le ${numeroMisure} misure associate. Questa azione non si può annullare.`
                : 'Questa azione non si può annullare.'
            }
            confirmLabel="Sì, elimina"
            variant="danger"
            loading={deletingCampagna}
            onConfirm={handleConfermaEliminaCampagna}
            onCancel={() => setConfirmEliminaCampagnaOpen(false)}
          />

          <ConfirmDialog
            open={misuraDaEliminare !== null}
            title={`Eliminare la misura #${misuraDaEliminare?.numero ?? ''}?`}
            message={
              <>
                La misura sarà rimossa definitivamente. Questa operazione non può essere annullata.
                {deleteMisuraError && (
                  <>
                    <br /><br /><span style={{ color: '#A32D2D' }}>Errore: {deleteMisuraError}</span>
                  </>
                )}
              </>
            }
            confirmLabel="Sì, elimina"
            variant="danger"
            loading={deletingMisura}
            onConfirm={handleConfermaEliminaMisura}
            onCancel={handleAnnullaEliminaMisura}
          />
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
  headerCampagna: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  dataGrande: {
    fontSize: 20,
    fontWeight: 500,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  contesto: {
    fontSize: 12,
    color: 'var(--text-secondary)',
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
  infoCard: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    gap: 8,
  },
  infoLeft: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  infoValue: {
    fontSize: 13,
    color: 'var(--text-primary)',
    marginTop: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  infoValueEmpty: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
    marginTop: 1,
  },
  infoActionMuted: {
    color: 'var(--text-tertiary)',
    fontSize: 14,
  },
  infoActionPlaceholder: {
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 500,
    paddingLeft: 8,
    opacity: 0.5,
    cursor: 'default',
  },
  infoActionBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 500,
    paddingLeft: 8,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  infoSeparator: {
    height: '0.5px',
    background: 'var(--bg-toggle)',
    margin: '4px 0',
  },
  emptyMisure: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-card)',
    padding: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  misureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 16,
  },
  skeletonMisureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 16,
  },
  skeletonMisuraCard: {
    background: 'var(--bg-card)',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 10,
    padding: '10px 12px',
  },
  fabDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  moduloNonSupportatoHint: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  fabWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 18,
  },
  fab: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 'var(--radius-fab)',
    fontSize: 13,
    fontWeight: 500,
    boxShadow: '0 2px 8px var(--accent-shadow)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnCompleta: {
    width: '100%',
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    padding: 12,
    borderRadius: 22,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnCompletaDisabled: {
    background: '#B4B2A9',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  btnRiapri: {
    width: '100%',
    background: 'var(--bg-card)',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    color: 'var(--accent)',
    padding: 12,
    borderRadius: 22,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  btnCompletaHint: {
    fontSize: 10,
    color: 'var(--text-tertiary)',
    textAlign: 'center',
    marginTop: 6,
  },
  btnEsportaExcel: {
    width: '100%',
    background: 'var(--bg-card)',
    color: 'var(--accent)',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: 'var(--accent)',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
    marginTop: 12,
    fontWeight: 500,
  },
  exportErrorBox: {
    background: '#FEEBEB',
    color: '#A32D2D',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: '#A32D2D',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    marginTop: 8,
  },
  helperText: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },
  btnEliminaCampagna: {
    width: '100%',
    background: 'transparent',
    color: '#A32D2D',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: '#A32D2D',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
    marginTop: 12,
    fontWeight: 500,
  },
  fabHint: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  bannerCompleta: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--bg-toggle)',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 12,
    fontSize: 13,
    color: 'var(--text-primary)',
  },
  bannerCompletaIcon: {
    fontSize: 16,
  },
}
