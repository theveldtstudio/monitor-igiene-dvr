import { db } from '../db'
import type { FotoBlobLocale } from '../types'

export async function putFotoBlob(item: FotoBlobLocale): Promise<void> {
  await db.foto_blobs.put(item)
}

export async function getFotoBlob(id: string): Promise<FotoBlobLocale | undefined> {
  return db.foto_blobs.get(id)
}

export async function getFotoBlobsByMisura(misuraId: string): Promise<FotoBlobLocale[]> {
  return db.foto_blobs.where('misura_id').equals(misuraId).toArray()
}

export async function getAllPendingFotoBlobs(): Promise<FotoBlobLocale[]> {
  return db.foto_blobs.toArray()
}

export async function deleteFotoBlob(id: string): Promise<void> {
  await db.foto_blobs.delete(id)
}
