// utils/Function.ts
import type { RequestContract } from '@ioc:Adonis/Core/Request'

/**
 * Construit un objet d'historique de recherche à partir d'une requête.
 * Le type de recherche (artist, album, single) est déduit de l'URL.
 * @param request La requête HTTP (du contrôleur)
 * @returns Un objet contenant {timestamp, type, query} à stocker dans l'historique
 */
export function buildSearchHistoryEntry(
  request: RequestContract
): { timestamp: string; type: string; query: string } {
  const qs = request.qs()
  const url = request.url()

  const queryString = Object.keys(qs).length > 0
    ? '?' + new URLSearchParams(qs as Record<string, string>).toString()
    : ''

  return {
    timestamp: new Date().toISOString(),
    type: url.includes('artists') ? 'artists' : url.includes('albums') ? 'albums' : 'singles',
    query: url + queryString,
  }
}
