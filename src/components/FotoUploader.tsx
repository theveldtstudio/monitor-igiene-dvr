import { useRef, useState } from 'react';
import { useFotoMisure, useUploadFotoMisura, useDeleteFotoMisura } from '../hooks/useFotoMisure';

interface FotoUploaderProps {
  misuraId: string | null;
  maxFoto?: number;
  disabled?: boolean;
}

export default function FotoUploader({ misuraId, maxFoto = 5, disabled = false }: FotoUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: foto = [], isLoading } = useFotoMisure(misuraId);
  const uploadMutation = useUploadFotoMisura();
  const deleteMutation = useDeleteFotoMisura();

  const isUploading = uploadMutation.isPending;
  const fotoCount = foto.length;
  const canAddMore = fotoCount < maxFoto && !disabled && !!misuraId;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !misuraId) return;
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError("Il file selezionato non è un'immagine.");
      return;
    }
    try {
      await uploadMutation.mutateAsync({ misuraId, file });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore upload';
      setUploadError(msg);
    } finally {
      e.target.value = '';
    }
  };

  const handleDelete = async (fotoId: string, pathLocale: string | null) => {
    if (!misuraId) return;
    const conferma = window.confirm('Cancellare questa foto?');
    if (!conferma) return;
    try {
      await deleteMutation.mutateAsync({ fotoId, misuraId, pathLocale });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore cancellazione';
      alert(`Cancellazione fallita: ${msg}`);
    }
  };

  if (!misuraId) {
    return <div style={styles.placeholder}>Salva prima la misura per allegare foto.</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerLabel}>Foto allegate</span>
        <span style={styles.headerCounter}>{fotoCount}/{maxFoto}</span>
      </div>

      {isLoading ? (
        <div style={styles.placeholder}>Caricamento foto...</div>
      ) : foto.length === 0 ? (
        <div style={styles.placeholder}>Nessuna foto allegata.</div>
      ) : (
        <div style={styles.grid}>
          {foto.map((f) => (
            <div key={f.id} style={styles.thumbWrapper}>
              {f.signedUrl ? (
                <img
                  src={f.signedUrl}
                  alt="foto misura"
                  style={styles.thumb}
                  onClick={() => setPreviewUrl(f.signedUrl)}
                />
              ) : (
                <div style={{ ...styles.thumb, ...styles.thumbBroken }}>?</div>
              )}
              <button
                type="button"
                style={styles.thumbDelete}
                onClick={() => handleDelete(f.id, f.path_locale)}
                disabled={deleteMutation.isPending}
                aria-label="Cancella foto"
                title="Cancella foto"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div style={styles.uploadButtons}>
          <button type="button" style={styles.uploadBtn} onClick={() => cameraInputRef.current?.click()} disabled={isUploading}>
            📷 Scatta foto
          </button>
          <button type="button" style={styles.uploadBtn} onClick={() => galleryInputRef.current?.click()} disabled={isUploading}>
            🖼️ Da galleria
          </button>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      {isUploading && <div style={styles.status}>Caricamento in corso...</div>}
      {uploadError && <div style={styles.error}>{uploadError}</div>}

      {previewUrl && (
        <div style={styles.previewBackdrop} onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="preview" style={styles.previewImg} />
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 8 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' },
  headerCounter: { fontSize: 12, color: 'var(--text-tertiary)' },
  placeholder: { fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic', paddingTop: 8, paddingBottom: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 },
  thumbWrapper: { position: 'relative', aspectRatio: '1 / 1' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, cursor: 'pointer', backgroundColor: '#f3f4f6' },
  thumbBroken: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 24 },
  thumbDelete: {
    position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', color: '#fff',
    borderWidth: 0, borderStyle: 'solid',
    cursor: 'pointer', fontSize: 14, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
  },
  uploadButtons: { display: 'flex', gap: 8, marginTop: 4 },
  uploadBtn: {
    flex: 1,
    paddingTop: 10, paddingRight: 12, paddingBottom: 10, paddingLeft: 12,
    borderRadius: 8,
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },
  status: { fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' },
  error: {
    fontSize: 12, color: '#dc2626', backgroundColor: '#fee2e2',
    paddingTop: 6, paddingRight: 8, paddingBottom: 6, paddingLeft: 8,
    borderRadius: 6,
  },
  previewBackdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, cursor: 'pointer',
    paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20,
  },
  previewImg: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
};
