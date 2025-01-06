// app/Controllers/Http/SinglesController.ts

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import Single from 'App/Models/Single'
import Artist from 'App/Models/Artist'
import Album from 'App/Models/Album'
import Metadata from 'App/Models/Metadata'
import Stat from 'App/Models/Stat'
import Database from '@ioc:Adonis/Lucid/Database'
import SingleValidator from 'App/Validators/SingleValidator'
import Copyright from 'App/Models/Copyright'
import EmailService from 'App/Services/EmailService'

/**
 * @swagger
 * tags:
 *   - name: Singles
 *     description: Endpoints related to single management
 */
export default class SinglesController {
  /**
   * @index
   * @summary List singles
   * @operationId listSingles
   * @tag Singles
   * @description Lists all singles with optional filters (genreId, title, artistId) and pagination/tri.
   *
   * @paramQuery genreId - Filter by genre ID - @type(number)
   * @paramQuery title - Filter by partial or complete single title (case-insensitive) - @type(string)
   * @paramQuery artistId - Filter by artist ID - @type(number)
   * @paramQuery sort - "title", "releaseDate", or "popularity" - @type(string)
   * @paramQuery sortDirection - "asc" or "desc" - @type(string)
   * @paramQuery page - Page number (1..10000) - @type(number)
   * @paramQuery limit - Page size (1..100) - @type(number)
   *
   * @responseBody 200 - <Single[]>.paginated()
   * @responseBody 400 - {"errors":[{"message":"Validation error"}]}
   * @responseBody 500 - {"errors":[{"message":"Failed to fetch singles."}]}
   */
  public async index({ request, response }: HttpContextContract) {
    try {
      const payload = await request.validate({
        schema: SingleValidator.filterSchema,
        messages: SingleValidator.messages,
      })

      const {
        genreId,
        title,
        artistId,
        sort,
        sortDirection = 'asc',
        page = 1,
        limit = 10,
      } = payload

      let query = Single.query()

      if (genreId) {
        query.where('genre_id', genreId)
      }

      if (title) {
        const lowerTitle = title.toLowerCase()
        query.whereRaw('LOWER(title) LIKE ?', [`%${lowerTitle}%`])
      }

      if (artistId) {
        query.where('artist_id', artistId)
      }

      if (sort === 'title' || sort === 'releaseDate') {
        query.orderBy(sort, sortDirection)
      } else if (sort === 'popularity') {
        query = Single.query()
          .leftJoin('stats', 'stats.single_id', 'singles.id')
          .select('singles.*')
          .select(Database.raw('COALESCE(stats.listens_count, 0) as popularityCount'))

        if (genreId) {
          query.where('genre_id', genreId)
        }
        if (title) {
          const lowerTitle = title.toLowerCase()
          query.whereRaw('LOWER(title) LIKE ?', [`%${lowerTitle}%`])
        }
        if (artistId) {
          query.where('artist_id', artistId)
        }

        query.groupBy('singles.id', 'stats.listens_count')
        query.orderBy('popularityCount', sortDirection)
      } else {
        query.orderBy('created_at', 'desc')
      }

      const singlesPage = await query.paginate(page, limit)

      // Charge la relation stats pour chaque Single
      const singleRecords = singlesPage.all()
      await Promise.all(singleRecords.map((single) => single.load('stats')))

      return response.ok({
        meta: singlesPage.getMeta(),
        data: singleRecords.map((single) => ({
          id: single.id,
          title: single.title,
          artistId: single.artistId,
          genreId: single.genreId,
          releaseDate: single.releaseDate,
          createdAt: single.createdAt,
          updatedAt: single.updatedAt,
          stats: single.stats
            ? {
              listensCount: single.stats.listensCount,
              revenue: single.stats.revenue,
            }
            : null,
        })),
      })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({
        errors: [{ message: 'Failed to fetch singles.', code: 'INTERNAL_ERROR' }],
      })
    }
  }

  /**
   * @create
   * @summary Create a single
   * @operationId createSingle
   * @tag Singles
   * @description Creates a new single with metadata, featurings, etc. Also verifies releaseDate > now.
   *
   * @requestBody <SingleValidator.createSchema>
   * @responseBody 201 - {"message":"Single created successfully.","data":<Single>}
   * @responseBody 400 - {"errors":[{"message":"Validation or logic error"}]}
   * @responseBody 500 - {"errors":[{"message":"Create single failed"}]}
   */
  public async create({ auth, request, response }: HttpContextContract) {
    try {
      const payload = await request.validate({
        schema: SingleValidator.createSchema,
        messages: SingleValidator.messages,
      })

      const mainArtist = auth.user as Artist

      // Vérifie la release date
      if (payload.releaseDate) {
        const now = DateTime.now()
        const release = DateTime.fromISO(payload.releaseDate.toISO() || '')
        if (release <= now) {
          return response.badRequest({
            errors: [{ message: 'Release date must be in the future', code: 'INVALID_RELEASE_DATE' }],
          })
        }
      }

      // Extraire les artistes featurings de la liste des copyrights
      const allFeatIds = payload.copyrights
        .filter((c) => c.artistId && c.artistId !== mainArtist.id)
        .map((c) => c.artistId!)

      // Vérifier l'existence des artistes featurings
      const featuringArtists = await Artist.query().whereIn('id', allFeatIds)
      if (featuringArtists.length !== allFeatIds.length) {
        return response.badRequest({
          errors: [
            { message: 'One or more featuring artists not found.', code: 'ARTIST_NOT_FOUND' },
          ],
        })
      }

      // On clean le tire dans le cas ou l'utilisateur aurait mis des featuring dans le titre
      let cleanedTitle = this.removeFeatPart(payload.title)

      // Construit le titre final si on a des featurings
      let finalTitle = cleanedTitle
      if (featuringArtists.length > 0) {
        const featNames = featuringArtists.map((a) => a.name).join(', ')
        finalTitle = `${cleanedTitle} (feat. ${featNames})`
      }

      const single = await Single.create({
        title: finalTitle,
        genreId: payload.genreId,
        releaseDate: payload.releaseDate,
        artistId: mainArtist.id,
        albumId: payload.albumId,
      })

      // Attache la table pivot si on a des featurings
      if (featuringArtists.length > 0) {
        await single.related('featurings').attach(allFeatIds)
      }

      const metadata = await Metadata.create({
        singleId: single.id,
        coverUrl: payload.metadata.coverUrl,
        lyrics: payload.metadata.lyrics,
      })

      let totalPercentage = 0
      for (const c of payload.copyrights) {
        totalPercentage += c.percentage

        if (!c.artistId && !c.ownerName) {
          return response.badRequest({
            errors: [{ message: 'Either artistId or ownerName must be provided.', code: 'INVALID_COPYRIGHT' }],
          })
        }
        if (c.artistId && c.ownerName) {
          return response.badRequest({
            errors: [{ message: 'Provide either artistId or ownerName, not both.', code: 'INVALID_COPYRIGHT' }],
          })
        }

        await Copyright.create({
          metadataId: metadata.id,
          artistId: c.artistId,
          ownerName: c.ownerName,
          role: c.role,
          percentage: c.percentage,
        })
      }
      if (totalPercentage !== 100) {
        return response.badRequest({
          errors: [{ message: 'Total percentage must be 100%', code: 'COPYRIGHT_PERCENTAGE_ERROR' }],
        })
      }

      await Stat.create({
        singleId: single.id,
        listensCount: 0,
        revenue: 0,
      })

      // Update artiste & album genres
      await this.updateArtistGenres(mainArtist)
      if (single.albumId) {
        await this.updateAlbumGenres(single.albumId)
      }

      // Envoi de l'email de publication
      await this.sendPublicationEmail(mainArtist, single)

      return response.created({
        message: 'Single created successfully',
        data: single,
      })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({
        errors: [{ message: 'Create single failed.', code: 'INTERNAL_ERROR' }],
      })
    }
  }

  /**
   * @update
   * @summary Update a single
   * @operationId updateSingle
   * @tag Singles
   * @description Updates an existing single, re-defining any featuring in the title, pivot, etc. Also checks releaseDate > now.
   * @paramPath id - The ID of the single - @type(number) @required
   * @requestBody <SingleValidator.updateSchema>
   * @responseBody 200 - {"message":"Single updated successfully","data":<Single>}
   * @responseBody 400 - {"errors":[{"message":"Validation error"}]}
   * @responseBody 404 - {"errors":[{"message":"Single not found"}]}
   * @responseBody 500 - {"errors":[{"message":"Update single failed"}]}
   */
  public async update({ auth, request, response, params }: HttpContextContract) {
    const mainArtist = auth.user as Artist
    const single = await Single.find(params.id)

    if (!single || single.artistId !== mainArtist.id) {
      return response.notFound({
        errors: [{ message: 'Single not found', code: 'SINGLE_NOT_FOUND' }],
      })
    }

    try {
      const payload = await request.validate({
        schema: SingleValidator.updateSchema,
        messages: SingleValidator.messages,
      })

      // Champs non modifiables
      const nonUpdatableFields = ['artistId', 'createdAt', 'updatedAt', 'stats'];
      const receivedKeys = Object.keys(request.body());
      const forbiddenKeys = receivedKeys.filter((key) => nonUpdatableFields.includes(key));

      // Construction des avertissements
      const fieldWarnings = forbiddenKeys.map((field) => ({
        message: `Field '${field}' cannot be modified by the user.`,
        code: 'FIELD_NOT_MODIFIABLE',
        field: field,
      }));

      // Vérifie la releaseDate
      if (payload.releaseDate) {
        const now = DateTime.now()
        const release = DateTime.fromISO(payload.releaseDate.toISO() || '')
        if (release <= now) {
          return response.badRequest({
            errors: [{ message: 'Release date must be in the future', code: 'INVALID_RELEASE_DATE' }],
          })
        }
      }

      // Extraire featuring de la liste des copyrights
      let featuringIds: number[] = []
      let featuringNames: string[] = []

      if (payload.copyrights) {
        const allFeatIds = payload.copyrights
          .filter((c) => c.artistId && c.artistId !== mainArtist.id)
          .map((c) => c.artistId!)

        if (allFeatIds.length > 0) {
          const featuringArtists = await Artist.query().whereIn('id', allFeatIds)
          if (featuringArtists.length !== allFeatIds.length) {
            return response.badRequest({
              errors: [{ message: 'One or more featuring artists not found.', code: 'ARTIST_NOT_FOUND' }],
            })
          }
          featuringIds = allFeatIds
          featuringNames = featuringArtists.map((a) => a.name)
        }
      }

      let cleanedTitle = this.removeFeatPart(payload.title ?? single.title)

      // Reconstruire le titre si featuring
      let finalTitle = cleanedTitle
      if (featuringIds.length > 0) {
        finalTitle = `${cleanedTitle} (feat. ${featuringNames.join(', ')})`
      }

      single.merge({
        title: finalTitle,
        genreId: payload.genreId ?? single.genreId,
        releaseDate: payload.releaseDate ?? single.releaseDate,
        albumId: payload.albumId ?? single.albumId,
      })
      await single.save()

      // Met à jour la table pivot des featurings
      await single.related('featurings').sync(featuringIds)

      if (payload.metadata) {
        let metadata = await single.related('metadata').query().first()
        if (!metadata) {
          metadata = new Metadata()
          metadata.singleId = single.id
        }
        metadata.merge({
          coverUrl: payload.metadata.coverUrl,
          lyrics: payload.metadata.lyrics,
        })
        await metadata.save()
      }

      // Recrée tout les copyrights
      if (payload.copyrights) {
        const metadata = await single.related('metadata').query().first()
        if (metadata) {
          // Supprimer l'ancien
          await metadata.related('copyrights').query().delete()

          let totalPercentage = 0
          for (const c of payload.copyrights) {
            totalPercentage += c.percentage

            if (!c.artistId && !c.ownerName) {
              return response.badRequest({
                errors: [
                  { message: 'Either artistId or ownerName must be provided.', code: 'INVALID_COPYRIGHT' },
                ],
              })
            }
            if (c.artistId && c.ownerName) {
              return response.badRequest({
                errors: [
                  { message: 'Provide either artistId or ownerName, not both.', code: 'INVALID_COPYRIGHT' },
                ],
              })
            }

            await Copyright.create({
              metadataId: metadata.id,
              artistId: c.artistId,
              ownerName: c.ownerName,
              role: c.role,
              percentage: c.percentage,
            })
          }
          if (totalPercentage !== 100) {
            return response.badRequest({
              errors: [
                { message: 'Total percentage must be 100%', code: 'COPYRIGHT_PERCENTAGE_ERROR' },
              ],
            })
          }
        }
      }

      // Met à jour les genres de l'artiste et de l'album
      await this.updateArtistGenres(mainArtist)
      if (single.albumId) {
        await this.updateAlbumGenres(single.albumId)
      }

      // Retour avec avertissements partiels si nécessaire
      if (fieldWarnings.length > 0) {
        return response.status(200).json({
          message: 'Single updated successfully with partial warnings.',
          warnings: fieldWarnings,
          data: single,
        });
      }

      return response.ok({
        message: 'Single updated successfully',
        data: single,
      })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({
        errors: [{ message: 'Update single failed.', code: 'INTERNAL_ERROR' }],
      })
    }
  }

  /**
   * @show
   * @summary Get single by ID
   * @operationId getSingle
   * @tag Singles
   * @paramPath id - The ID of the single - @type(number) @required
   * @responseBody 200 - <Single>
   * @responseBody 404 - {"errors":[{"message":"Single not found"}]}
   */
  public async show({ params, response }: HttpContextContract) {
    const single = await Single.query()
      .where('id', params.id)
      .preload('artist')
      .preload('album')
      .preload('genre')
      .preload('stats')
      .preload('metadata', (q) => q.preload('copyrights'))
      .first()

    if (!single) {
      return response.notFound({ errors: [{ message: 'Single not found', code: 'SINGLE_NOT_FOUND' }] })
    }

    return response.ok({
      id: single.id,
      title: single.title,
      album: single.album ? { id: single.album.id, title: single.album.title } : null,
      artist: single.artist ? { id: single.artist.id, name: single.artist.name } : null,
      genre: single.genre ? { id: single.genre.id, name: single.genre.name } : null,
      releaseDate: single.releaseDate,
      stats: single.stats
        ? {
          listensCount: single.stats.listensCount,
          revenue: single.stats.revenue,
        }
        : null,
      metadata: single.metadata,
    })
  }

  /**
   * @delete
   * @summary Delete single
   * @operationId deleteSingle
   * @tag Singles
   * @paramPath id - The ID of the single - @type(number) @required
   * @responseBody 200 - {"message":"Single deleted successfully"}
   * @responseBody 404 - {"errors":[{"message":"Single not found"}]}
   */
  public async delete({ auth, params, response }: HttpContextContract) {
    const mainArtist = auth.user as Artist
    const single = await Single.find(params.id)
    if (!single || single.artistId !== mainArtist.id) {
      return response.notFound({ errors: [{ message: 'Single not found', code: 'SINGLE_NOT_FOUND' }] })
    }

    await single.delete()

    await this.updateArtistGenres(mainArtist)
    if (single.albumId) {
      await this.updateAlbumGenres(single.albumId)
    }

    return response.ok({ message: 'Single deleted successfully' })
  }

  // -------------------------------------------------------
  // Méthodes privées
  // -------------------------------------------------------

  /**
   * Retire toute occurrence de "(feat. ...)" du titre
   * Exemple : "My Title (feat. John, Foo)" => "My Title"
   */
  private removeFeatPart(input: string): string {
    return input.replace(/\(feat\. [^)]+\)/gi, '').trim()
  }

  /**
   * Met à jour les genres de l'artiste
   * @param artist - L'artiste à mettre à jour
   * @private
   */
  private async updateArtistGenres(artist: Artist) {
    // Récupérer la fréquence des genreId
    const rows = await Database.from('singles')
      .where('artist_id', artist.id)
      .groupBy('genre_id')
      .count('* as count')
      .select('genre_id')

    const genreCounts: Record<number, number> = {}
    rows.forEach((row) => {
      genreCounts[row.genre_id] = (genreCounts[row.genre_id] || 0) + Number(row.count)
    })

    // Tri descendant
    const sortedIds = Object.keys(genreCounts).sort(
      (a, b) => genreCounts[Number(b)] - genreCounts[Number(a)]
    )

    // Top 3
    // @ts-ignore
    artist.genresId = JSON.stringify(sortedIds.slice(0, 3).map(Number))
    await artist.save()
  }

  /**
   * Met à jour les genres de l'album
   * @param albumId - L'ID de l'album
   * @private
   */
  private async updateAlbumGenres(albumId: number) {
    const album = await Album.find(albumId)
    if (!album) return

    const rows = await Database.from('singles')
      .where('album_id', album.id)
      .distinct('genre_id')
      .select('genre_id')

    const ids = rows.map((r) => r.genre_id)
    // @ts-ignore
    album.genresId = JSON.stringify([...new Set(ids)])
    await album.save()
  }

  /**
   * Envoi un email de publication à l'artiste
   * @param artist - L'artiste
   * @param single - Le single publié
   * @private
   */
  private async sendPublicationEmail(artist: Artist, single: Single) {
    let emailData: any;

    if (single.albumId) {
      const album = await Album.find(single.albumId);

      emailData = {
        subject: `Publication d'un nouveau single dans votre album "${album?.title}"`,
        singleTitle: single.title,
        releaseDate: single.releaseDate?.toFormat('dd/MM/yyyy'),
      };
    } else {
      emailData = {
        subject: 'Publication de votre nouveau single',
        singleTitle: single.title,
        releaseDate: single.releaseDate?.toFormat('dd/MM/yyyy'),
      };
    }

    await EmailService.sendSinglePublicationEmail(
      artist.email,
      emailData.subject,
      emailData
    );
  }
}
