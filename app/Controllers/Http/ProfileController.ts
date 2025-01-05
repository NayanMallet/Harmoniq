// app/Controllers/Http/ProfilesController.ts

import Artist from 'App/Models/Artist'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ProfileValidator from 'App/Validators/ProfileValidator'
import GenreService from 'App/Services/GenreService'

/**
 * @swagger
 * tags:
 *   - name: Artists
 *     description: Endpoints for managing artist profiles
 */
export default class ProfilesController {
  /**
   * @update
   * @summary Update artist profile
   * @operationId updateArtistProfile
   * @tag Artists
   * @description Updates the profile of the authenticated artist.
   * @requestBody <ProfileValidator.updateSchema>
   * @responseBody 200 - <Artist> - Profile updated successfully.
   * @responseBody 400 - {"errors": [{"message":"Invalid input"}]}
   * @responseBody 404 - {"errors": [{"message":"Artist not found."}]}
   */
  public async update({ auth, request, response }: HttpContextContract) {
    const artist = await Artist.find(auth.user!.id)

    if (!artist) {
      return response.status(404).json({
        errors: [{ message: 'Artist not found.', code: 'ARTIST_NOT_FOUND' }],
      })
    }

    try {
      const payload = await request.validate({
        schema: ProfileValidator.updateSchema,
        messages: ProfileValidator.messages,
      })

      // Champs non modifiables par l'utilisateur
      const nonUpdatableFields = ['genres_id', 'popularity', 'isVerified', 'verificationCode', 'passwordResetToken', 'passwordResetExpiresAt']
      const receivedKeys = Object.keys(request.body())
      const forbiddenKeys = receivedKeys.filter((key) => nonUpdatableFields.includes(key))

      // Construction d'un tableau d'erreurs si l'utilisateur tente de modifier des champs interdits
      const fieldErrors = forbiddenKeys.map((field) => ({
        message: `Field '${field}' cannot be modified by the user.`,
        code: 'FIELD_NOT_MODIFIABLE',
        field: field,
      }))

      // Traitement des champs modifiables
      const updateData: Record<string, any> = {}

      if (payload.biography) updateData.biography = payload.biography
      if (payload.socialLinks) {
        updateData.socialLinks = JSON.stringify(payload.socialLinks)

      }
      if (payload.location) {
        updateData.location = JSON.stringify(payload.location)
      }

      artist.merge(updateData)
      await artist.save()

      // Si des erreurs liées à des champs interdits existent, on retourne une réponse partielle
      if (fieldErrors.length > 0) {
        return response.status(200).json({
          message: 'Profile updated successfully with partial warnings.',
          warnings: fieldErrors,
          data: artist,
        })
      }

      return response.ok({
        message: 'Profile updated successfully.',
        data: artist,
      })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Profile update failed due to an internal error.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @show
   * @summary Get artist profile by ID
   * @operationId showArtistProfile
   * @tag Artists
   * @description Fetches the profile of an artist by ID.
   *
   * @paramPath id - The ID of the artist - @type(number) @required
   * @responseBody 200 - <Artist> - Artist profile fetched successfully.
   * @responseBody 404 - {"errors": [{"message":"Artist not found."}]}
   */
  public async show({ params, response }: HttpContextContract) {
    const artist = await Artist.find(params.id)

    if (!artist) {
      return response.notFound({
        errors: [{ message: 'Artist not found.', code: 'ARTIST_NOT_FOUND' }],
      })
    }

    const loadedGenres = await GenreService.loadGenresByIds(artist.genresId)
    return response.ok({
      data: {
        popularity: artist.popularity,
        id: artist.id,
        email: artist.email,
        name: artist.name,
        biography: artist.biography,
        socialLinks: artist.socialLinks,
        location: artist.location,
        genres: loadedGenres,
        created_at: artist.createdAt,
        updated_at: artist.updatedAt,
      },
    })
  }

  /**
   * @index
   * @summary List artists
   * @operationId listArtists
   * @tag Artists
   * @description Lists and filters artists by genre, country, city, name. Supports pagination and sorting.
   *
   * @paramQuery genreId - Filter by genre ID (must be in Artist.genres_id) - @type(number)
   * @paramQuery country - Filter by country (case-insensitive) - @type(string)
   * @paramQuery city - Filter by city (case-insensitive) - @type(string)
   * @paramQuery name - Filter by partial or complete artist name (case-insensitive) - @type(string)
   * @paramQuery sort - "popularity" or "name" - @type(string)
   * @paramQuery page - Page number (1..10000) - @type(number)
   * @paramQuery limit - Page size (1..100) - @type(number)
   *
   * @responseBody 200 - <Artist[]>.paginated() // Paginated list of artists
   * @responseBody 400 - {"errors":[{"message":"Validation error"}]}
   * @responseBody 500 - {"errors":[{"message":"Internal error"}]}
   */
  public async index({ request, response }: HttpContextContract) {
    try {
      // 1. Valider la query string
      const payload = await request.validate({
        schema: ProfileValidator.searchSchema,
        messages: ProfileValidator.messages,
      })

      const {
        genreId,
        country,
        city,
        name,
        sort,
        page = 1,
        limit = 10,
      } = payload

      // Optionnel : si vous gérez la direction du tri
      // sinon, vous pouvez ignorer
      const sortDirection = request.input('sortDirection', 'asc').toLowerCase()
      const validSortDirection = ['asc', 'desc'].includes(sortDirection)
        ? sortDirection
        : 'asc'

      // 2. Construire la requête Lucid
      const query = Artist.query()

      // Filtrer par genreId => JSON_CONTAINS(artist.genres_id, [genreId])
      if (genreId) {
        // On peut cast en JSON
        query.whereRaw(
          'JSON_CONTAINS(genres_id, CAST(? as JSON))',
          [genreId]
        )
      }

      // Filtrer par country (case-insensitive)
      if (country) {
        const lowerCountry = country.toLowerCase()
        query.whereRaw('LOWER(JSON_EXTRACT(location, "$.country")) LIKE ?', [`%${lowerCountry}%`])
      }

      // Filtrer par city (case-insensitive)
      if (city) {
        const lowerCity = city.toLowerCase()
        query.whereRaw('LOWER(JSON_EXTRACT(location, "$.city")) LIKE ?', [`%${lowerCity}%`])
      }

      // Filtrer par name (case-insensitive)
      if (name) {
        const lowerName = name.toLowerCase()
        query.whereRaw('LOWER(name) LIKE ?', [`%${lowerName}%`])
      }

      // Tri
      if (sort === 'popularity') {
        query.orderBy('popularity', validSortDirection as 'asc' | 'desc')
      } else if (sort === 'name') {
        // insensible à la casse
        query.orderByRaw(`LOWER(name) ${validSortDirection}`)
      } else {
        // Par défaut, on tri par 'created_at' desc, par exemple
        query.orderBy('created_at', 'desc')
      }

      // Pagination
      const artists = await query.paginate(page, limit)

      return response.ok({
        meta: artists.getMeta(),
        data: artists.all(),
      })
    } catch (error) {
      // Erreur de validation => 400
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }

      // Erreur interne => 500
      return response.internalServerError({
        errors: [{ message: 'Failed to fetch artists.', code: 'INTERNAL_ERROR' }],
      })
    }
  }

  /**
   * @compare
   * @summary Compare multiple artists
   * @operationId compareArtists
   * @tag Artists
   * @description Compare multiple artists side-by-side by providing a list of IDs.
   * @paramQuery ids - Comma-separated list of IDs (e.g., "1,2,3") - @type(string) @required
   * @responseBody 200 - { "data": [...] }
   * @responseBody 400 - { "errors": [...] } (validation error)
   * @responseBody 404 - { "errors": [...] } (some artists not found)
   */
  public async compare({ request, response }: HttpContextContract) {
    try {
      const payload = await request.validate({
        schema: ProfileValidator.compareSchema,
        messages: ProfileValidator.messages,
      })

      const ids = payload.ids.split(',').map((id) => parseInt(id, 10))
      const artists = await Artist.findMany(ids)

      if (artists.length !== ids.length) {
        return response.notFound({ errors: [{ message: 'One or more artists not found.' }] })
      }

      return response.ok({ data: artists })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      } else {
        return response.internalServerError({ errors: [{ message: 'Comparison failed.' }] })
      }
    }
  }
}
