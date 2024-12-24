// app/Controllers/Http/SinglesController.ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Single from 'App/Models/Single'
import Artist from 'App/Models/Artist'
import Metadata from 'App/Models/Metadata'
import Copyright from 'App/Models/Copyright'
import Stat from 'App/Models/Stat'
import Database from '@ioc:Adonis/Lucid/Database'
import Album from 'App/Models/Album'
import SingleValidator from 'App/Validators/SingleValidator'

export default class SinglesController {
  /**
   * @create
   * @operationId createSingle
   * @description Creates a new single with metadata and copyrights.
   * @requestBody <SingleValidator.createSchema>
   * @responseBody 201 - {"message":"Single created successfully","data":<Single>}
   * @responseBody 400 - {"errors":[{"message":"Validation error or invalid data."}]}
   */
  public async create({ auth, request, response }: HttpContextContract) {
    const artist = auth.user as Artist

    try {
      const payload = await request.validate({
        schema: SingleValidator.createSchema,
        messages: SingleValidator.messages,
      })

      const single = await Single.create({
        title: payload.title,
        genreId: payload.genreId,
        releaseDate: payload.releaseDate,
        artistId: artist.id,
        albumId: payload.albumId,
      })

      // Créer metadata
      const metadata = await Metadata.create({
        singleId: single.id,
        coverUrl: payload.metadata.coverUrl,
        lyrics: payload.metadata.lyrics,
      })

      // Gérer copyrights
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

      // Stats init
      await Stat.create({
        singleId: single.id,
        listensCount: 0,
        revenue: 0,
      })

      console.log('Single created:', single.id)
      // Mise à jour artiste / album
      await this.updateArtistGenres(artist)
      if (single.albumId) {
        await this.updateAlbumGenres(single.albumId)
      }

      // Featurings
      // const featuringArtists = payload.copyrights
      //   .filter((c) => c.artistId && c.artistId !== artist.id)
      //   .map((c) => c.artistId!)
      //
      // if (featuringArtists.length > 0) {
      //   await single.related('featurings').attach(featuringArtists)
      //   const artists = await Artist.query().whereIn('id', featuringArtists)
      //   const featuringNames = artists.map((a) => a.name).join(', ')
      //   single.title += ` (feat. ${featuringNames})`
      // }

      return response.created({ message: 'Single created successfully', data: single })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Create single failed.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @update
   * @operationId updateSingle
   * @description Updates an existing single.
   * @paramPath id - The ID of the single - @type(number) @required
   * @requestBody <SingleValidator.updateSchema>
   * @responseBody 200 - {"message":"Single updated successfully","data":<Single>}
   * @responseBody 400 - {"errors":[{"message":"Validation error or invalid data."}]}
   * @responseBody 404 - {"errors":[{"message":"Single not found."}]}
   */
  public async update({ auth, request, response, params }: HttpContextContract) {
    const artist = auth.user as Artist
    const single = await Single.find(params.id)

    if (!single || single.artistId !== artist.id) {
      return response.notFound({ errors: [{ message: 'Single not found', code: 'SINGLE_NOT_FOUND' }] })
    }

    try {
      const payload = await request.validate({
        schema: SingleValidator.updateSchema,
        messages: SingleValidator.messages,
      })

      single.merge({
        title: payload.title,
        genreId: payload.genreId ?? single.genreId,
        releaseDate: payload.releaseDate,
        albumId: payload.albumId,
      })
      await single.save()

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

      if (payload.copyrights) {
        const metadata = await single.related('metadata').query().first()
        if (metadata) {
          await metadata.related('copyrights').query().delete()

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
        }
      }

      await this.updateArtistGenres(artist)
      if (single.albumId) {
        await this.updateAlbumGenres(single.albumId)
      }

      return response.ok({ message: 'Single updated successfully', data: single })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Update single failed.', code: 'INTERNAL_ERROR' }] })
    }
  }

  //TODO: Modif how are returned the singles
  /**
   * @show
   * @operationId getSingle
   * @description Retrieves a single by ID.
   * @paramPath id - The ID of the single - @type(number) @required
   * @responseBody 200 - <Single>
   * @responseBody 404 - {"errors":[{"message":"Single not found."}]}
   */
  public async show({ params, response }: HttpContextContract) {
    const single = await Single.query()
      .where('id', params.id)
      .preload('artist')
      .preload('album')
      .preload('genre')
      .preload('metadata', (query) => query.preload('copyrights'))
      .first()

    if (!single) {
      return response.notFound({ errors: [{ message: 'Single not found', code: 'SINGLE_NOT_FOUND' }] })
    }

    return response.ok({
      id: single.id,
      title: single.title,
      album: {
        id: single.album?.id,
        title: single.album?.title,
      },
      artist: {
        id: single.artist.id,
        name: single.artist.name,
      },
      genre: {
        id: single.genre.id,
        name: single.genre.name,
      },
      releaseDate: single.releaseDate,
      metadata: single.metadata,
    })
  }

  /**
   * @delete
   * @operationId deleteSingle
   * @description Deletes a single by ID.
   * @paramPath id - The ID of the single - @type(number) @required
   * @responseBody 200 - {"message":"Single deleted successfully"}
   * @responseBody 404 - {"errors":[{"message":"Single not found."}]}
   */
  public async delete({ auth, params, response }: HttpContextContract) {
    const artist = auth.user as Artist
    const single = await Single.find(params.id)
    if (!single || single.artistId !== artist.id) {
      return response.notFound({ errors: [{ message: 'Single not found', code: 'SINGLE_NOT_FOUND' }] })
    }

    await single.delete()

    // Mettre à jour l'artiste + album
    await this.updateArtistGenres(artist)
    if (single.albumId) {
      await this.updateAlbumGenres(single.albumId)
    }

    return response.ok({ message: 'Single deleted successfully' })
  }

// Méthodes privées

  private async updateArtistGenres(artist: Artist) {
    const rows = await Database.from('singles')
      .where('artist_id', artist.id)
      .groupBy('genre_id')
      .count('* as count')
      .select('genre_id')

    const genreCounts: Record<number, number> = {}
    rows.forEach((row) => {
      genreCounts[row.genre_id] = (genreCounts[row.genre_id] || 0) + Number(row.count)
    })

    const sortedIds = Object.keys(genreCounts).sort((a, b) => genreCounts[Number(b)] - genreCounts[Number(a)])
    // Top 3
    // @ts-ignore
    artist.genresId = JSON.stringify(sortedIds.slice(0, 3).map(Number))
    await artist.save()
  }

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
}
