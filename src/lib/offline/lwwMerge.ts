/**
 * Confronto last-write-wins per il PULL.
 * Restituisce true se il record remoto deve sovrascrivere il locale.
 * Confronto SEMPRE numerico (getTime), mai su stringhe ISO.
 * Tie (updated_at uguali) → vince il remoto.
 */
export function isRemoteNewer(
  remoteUpdatedAt?: string | null,
  localUpdatedAt?: string | null
): boolean {
  const rt = remoteUpdatedAt ? new Date(remoteUpdatedAt).getTime() : NaN
  const lt = localUpdatedAt ? new Date(localUpdatedAt).getTime() : NaN
  if (Number.isNaN(rt)) return false // remoto senza timestamp valido → non sovrascrivo
  if (Number.isNaN(lt)) return true // locale senza timestamp → remoto vince
  return rt >= lt // tie → remoto vince
}
