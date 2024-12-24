import Artist from 'App/Models/Artist'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ProfileValidator from 'App/Validators/ProfileValidator'

export default class ProfilesController {
  /**
   * @update
   * @operationId updateArtistProfile
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
   * @operationId showArtistProfile
   * @description Fetches the profile of an artist by ID.
   * @parameters
   *   - (path) id {number} - The ID of the artist to fetch.
   * @responseBody 200 - <Artist> - Artist profile fetched successfully.
   * @responseBody 404 - {"errors": [{"message":"Artist not found."}]}
   */
  public async show({ params, response }: HttpContextContract) {
    const artist = await Artist.find(params.id)

    if (!artist) {
      return response.status(404).json({
        errors: [{ message: 'Artist not found.', code: 'ARTIST_NOT_FOUND' }],
      })
    }

    return response.ok({ data: artist })
  }


  // public async index({ request, response, auth }: HttpContextContract) {
  //   try {
  //     const payload = await request.validate({
  //       schema: ProfileValidator.searchSchema,
  //       messages: ProfileValidator.messages,
  //     })
  //
  //     const { genre, country, city, name, sort, page = 1, limit = 10 } = payload
  //
  //     const query = Artist.query()
  //
  //     // Exécuter la requête avec pagination
  //     const artists = await query.paginate(page, limit)
  //
  //     if (auth.user) {
  //       auth.user.searchHistory = auth.user.searchHistory || []
  //       auth.user.searchHistory.push(<SearchHistoryEntry>buildSearchHistoryEntry(request))
  //       await auth.user.save()
  //     }
  //
  //     return response.ok({
  //       meta: artists.getMeta(),
  //       data: artists.all(),
  //       search_history: auth.user?.searchHistory?.slice(-10)
  //     })
  //   } catch (error) {
  //     if (error.messages?.errors) {
  //       return response.badRequest({ errors: error.messages.errors })
  //     }
  //     return response.internalServerError({ errors: [{ message: 'Failed to fetch artists.' }] })
  //   }
  // }



  // public async index({ request, response, auth }: HttpContextContract) {
  //   try {
  //     const payload = await request.validate({
  //       schema: ProfileValidator.searchSchema,
  //       messages: ProfileValidator.messages,
  //     })
  //
  //     const { genre, country, city, name, sort, page = 1, limit = 10 } = payload
  //
  //     const query = Artist.query()
  //
  //     // Filtrage par genre (si l'artiste a ce genre dans son tableau genres)
  //     if (genre) {
  //       // Vérifier que c'est bien un tableau JSON
  //       query.whereRaw('JSON_CONTAINS(genres, ?)', [JSON.stringify(genre)])
  //     }
  //
  //     // Filtre par localisation
  //     if (country) {
  //       query.whereRaw('JSON_EXTRACT(location, "$.country") = ?', [country])
  //     }
  //     if (city) {
  //       query.whereRaw('LOWER(JSON_EXTRACT(location, "$.city")) LIKE LOWER(?)', [`%${city}%`])
  //     }
  //
  //     // Filtre par nom
  //     if (name) {
  //       query.where('name', 'like', `%${name}%`)
  //     }
  //
  //     // Tri
  //     if (sort === 'popularity') {
  //       query.orderBy('popularity', 'desc')
  //     } else if (sort === 'name') {
  //       query.orderBy('name', 'asc')
  //     }
  //
  //     // Exécuter la requête avec pagination
  //     const artists = await query.paginate(page, limit)
  //
  //     // Gestion de l'historique de recherche si l'utilisateur est connecté
  //     const userArtist = auth.user as Artist | undefined
  //     if (userArtist) {
  //       userArtist.searchHistory = userArtist.searchHistory || []
  //       userArtist.searchHistory.push({
  //         timestamp: new Date().toISOString(),
  //         query: request.url() + (Object.keys(request.qs()).length > 0 ? '?' + new URLSearchParams(request.qs()).toString() : '')
  //       })
  //       await userArtist.save()
  //     }
  //
  //     // Préparer la liste des 10 dernières recherches si l'utilisateur est connecté
  //     let lastTenSearches: {timestamp:string, query:string}[] = []
  //     if (userArtist && userArtist.searchHistory) {
  //       lastTenSearches = userArtist.searchHistory.slice(-10)
  //     }
  //
  //     // Retourner les données avec la pagination et l'historique de recherche
  //     return response.ok({
  //       meta: artists.getMeta(),
  //       data: artists.all(),
  //       search_history: lastTenSearches
  //     })
  //   } catch (error) {
  //     if (error.messages?.errors) {
  //       return response.badRequest({ errors: error.messages.errors })
  //     }
  //     return response.internalServerError({ errors: [{ message: 'Failed to fetch artists.' }] })
  //   }
  // }



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
