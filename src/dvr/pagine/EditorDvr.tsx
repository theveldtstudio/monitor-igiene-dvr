/** Apre l'editor giusto in base al rischio del documento. */
import { useQuery } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import Spinner from '../../components/Spinner'
import { humanizeError } from '../../lib/humanizeError'
import * as api from '../api'
import { stili } from '../ui/stili'

const EditorDvrRumore = lazy(() => import('./EditorDvrRumore'))
const EditorDvrVibrazioni = lazy(() => import('./EditorDvrVibrazioni'))
const EditorDvrPosture = lazy(() => import('./EditorDvrPosture'))
const EditorDvrMmc = lazy(() => import('./EditorDvrMmc'))
const EditorDvrMicroclima = lazy(() => import('./EditorDvrMicroclima'))

export default function EditorDvr() {
  const { docId } = useParams<{ docId: string }>()
  const q = useQuery({ queryKey: ['dvr', 'documento', docId], queryFn: () => api.leggiDocumento(docId!), enabled: Boolean(docId) })
  if (q.error) return <p style={{ ...stili.pagina, ...stili.avviso }}>{humanizeError(q.error)}</p>
  if (!q.data) return <div style={stili.pagina}><Spinner size={20} /></div>
  return (
    <Suspense fallback={<div style={stili.pagina}><Spinner size={20} /></div>}>
      {q.data.rischio === 'vibrazioni' ? (
        <EditorDvrVibrazioni />
      ) : q.data.rischio === 'posture' ? (
        <EditorDvrPosture />
      ) : q.data.rischio === 'mmc' ? (
        <EditorDvrMmc />
      ) : q.data.rischio === 'microclima' ? (
        <EditorDvrMicroclima />
      ) : (
        <EditorDvrRumore />
      )}
    </Suspense>
  )
}
