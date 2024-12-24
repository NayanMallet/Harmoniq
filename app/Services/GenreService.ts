// app/Services/GenreService.ts

import Genre from 'App/Models/Genre'

export default class GenreService {
  /**
   * Charge la liste des genres (id et name) à partir d'un tableau d'IDs.
   * @param ids Tableau d'IDs à charger
   * @returns Un tableau d'objets { id, name } minimal
   */
  public static async loadGenresByIds(ids: number[] | undefined) {
    if (!ids || ids.length === 0) {
      return []
    }
    // On récupère tous les genres correspondant aux IDs
    const genres = await Genre.query().whereIn('id', ids)

    // On mappe pour ne retourner que les champs "id" et "name"
    return genres.map((genre) => ({
      id: genre.id,
      name: genre.name,
    }))
  }
}
