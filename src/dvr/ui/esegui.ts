import { humanizeError } from '../../lib/humanizeError'
import { toast } from '../../lib/toast/toastApi'

/** Esegue un'azione mostrando un avviso di successo o l'errore leggibile. */
export async function esegui(azione: () => Promise<unknown>, messaggio?: string): Promise<boolean> {
  try {
    await azione()
    if (messaggio) toast.success(messaggio)
    return true
  } catch (e) {
    toast.error(humanizeError(e))
    return false
  }
}
