import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Single from 'App/Models/Single'
import Artist from 'App/Models/Artist'
import Metadata from 'App/Models/Metadata'
import Copyright from 'App/Models/Copyright'
import Stat from 'App/Models/Stat'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { Genre } from '../../../resources/utils/GenreEnum'
import Album from 'App/Models/Album'

export default class SinglesController {
  /**
   * @swagger
   * tags:
   *   - name: Singles
   *     description: Operations related to singles
   */

  //TODO: realease date du single/album => pas affiché avant la date de sortie
  /**
   * @swagger
   * /singles:
   *   post:
   *     tags:
   *       - Singles
   *     summary: Create a new single
   *     description: Allows an artist to create a new single with metadata and copyrights
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - genre
   *               - metadata
   *               - copyrights
   *             properties:
   *               title:
   *                 type: string
   *               genre:
   *                 $ref: '#/definitions/Genre'
   *               releaseDate:
   *                 type: string
   *                 format: date-time
   *               albumId:
   *                 type: integer
   *               metadata:
   *                 type: object
   *                 properties:
   *                   coverUrl:
   *                     type: string
   *                     format: uri
   *                   lyrics:
   *                     type: string
   *               copyrights:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     artistId:
   *                       type: integer
   *                     ownerName:
   *                       type: string
   *                     role:
   *                       type: string
   *                     percentage:
   *                       type: number
   *     responses:
   *       201:
   *         description: Single created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   */
  public async create({ auth, request, response }: HttpContextContract) {
    const artist = auth.user as Artist

    const singleSchema = schema.create({
      title: schema.string({}, [rules.maxLength(255)]),
      genre: schema.enum(Object.values(Genre)),
      releaseDate: schema.date.optional({ format: 'yyyy-MM-dd' }),
      albumId: schema.number.optional([rules.exists({ table: 'albums', column: 'id' })]),
      metadata: schema.object().members({
        coverUrl: schema.string({}, [rules.url()]),
        lyrics: schema.string.optional(),
      }),
      copyrights: schema.array().members(
        schema.object().members({
          artistId: schema.number.optional([
            rules.exists({ table: 'artists', column: 'id' }),
          ]),
          ownerName: schema.string.optional(),
          role: schema.string({}, [rules.maxLength(255)]),
          percentage: schema.number([rules.range(0, 100)]),
        })
      ),
    })

    try {
      const payload = await request.validate({ schema: singleSchema })

      // Créer le single
      const single = await Single.create({
        title: payload.title,
        genre: payload.genre,
        releaseDate: payload.releaseDate,
        artistId: artist.id,
        albumId: payload.albumId,
      })

      // Créer les metadata
      const metadata = await Metadata.create({
        singleId: single.id,
        coverUrl: payload.metadata.coverUrl,
        lyrics: payload.metadata.lyrics,
      })

      // Créer les copyrights
      let totalPercentage = 0
      for (const copyrightData of payload.copyrights) {
        totalPercentage += copyrightData.percentage

        if (!copyrightData.artistId && !copyrightData.ownerName) {
          return response.badRequest({
            errors: [{ message: 'Either artistId or ownerName must be provided in copyrights' }],
          })
        }

        if (copyrightData.artistId && copyrightData.ownerName) {
          return response.badRequest({
            errors: [{ message: 'Provide either artistId or ownerName, not both, in copyrights' }],
          })
        }

        await Copyright.create({
          metadataId: metadata.id,
          artistId: copyrightData.artistId,
          ownerName: copyrightData.ownerName,
          role: copyrightData.role,
          percentage: copyrightData.percentage,
        })
      }

      // Vérifier que le total des pourcentages est égal à 100
      if (totalPercentage !== 100) {
        return response.badRequest({
          errors: [{ message: 'Total percentage of copyrights must be 100%' }],
        })
      }

      // Créer les statistiques initiales
      await Stat.create({
        singleId: single.id,
        listensCount: 0,
        revenue: 0,
      })

      // Mettre à jour les genres de l'artiste
      await this.updateArtistGenres(artist)

      // Si le single est associé à un album, mettre à jour les genres de l'album
      if (single.albumId) {
        await this.updateAlbumGenres(single.albumId)
      }

      // Gérer les featuring
      const featuringArtists = payload.copyrights
        .filter((c) => c.artistId && c.artistId !== artist.id)
        .map((c) => c.artistId)

      if (featuringArtists.length > 0) {
        await single.related('featurings').attach(featuringArtists)
      }

      return response.created({ message: 'Single created successfully', data: single })
    } catch (error) {
      return response.badRequest({ errors: error.messages || error })
    }
  }

  // Méthode pour mettre à jour les genres de l'artiste
  private async updateArtistGenres(artist: Artist) {
    // Récupérer les genres des singles de l'artiste
    const singlesGenres = await Database.from('singles')
      .where('artist_id', artist.id)
      .groupBy('genre')
      .count('* as count')
      .select('genre')

    // Calculer la fréquence des genres
    const genreCounts: { [key in Genre]?: number } = {}

    singlesGenres.forEach((row) => {
      const genre = row.genre as Genre
      const count = Number(row.count)
      genreCounts[genre] = (genreCounts[genre] || 0) + count
    })

    // Trier les genres par fréquence décroissante
    const sortedGenres = Object.keys(genreCounts).sort(
      (a, b) => (genreCounts[b as Genre]! - genreCounts[a as Genre]!)
    ) as Genre[]

    // **Assurer que sortedGenres est un tableau**
    artist.genres = sortedGenres

    // Enregistrer les changements
    await artist.save()
  }

  // Méthode pour mettre à jour les genres de l'album
  private async updateAlbumGenres(albumId: number) {
    const album = await Album.find(albumId)
    if (!album) return

    // Récupérer les genres des singles de l'album
    const singlesGenres = await Database.from('singles')
      .where('album_id', album.id)
      .distinct('genre')
      .select('genre')

    const genres = singlesGenres.map((row) => row.genre as Genre)

    // Assurer que 'genres' est un tableau unique
    const uniqueGenres = Array.from(new Set(genres))

    // Mettre à jour 'album.genres' avec le tableau de genres
    album.genres = uniqueGenres

    // Enregistrer les changements
    await album.save()
  }

  /**
   * @swagger
   * /singles/{id}:
   *   put:
   *     tags:
   *       - Singles
   *     summary: Update a single
   *     description: Allows an artist to update their single
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               genre:
   *                 $ref: '#/definitions/Genre'
   *               releaseDate:
   *                 type: string
   *                 format: date-time
   *               albumId:
   *                 type: integer
   *               metadata:
   *                 type: object
   *                 properties:
   *                   coverUrl:
   *                     type: string
   *                     format: uri
   *                   lyrics:
   *                     type: string
   *               copyrights:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     artistId:
   *                       type: integer
   *                     ownerName:
   *                       type: string
   *                     role:
   *                       type: string
   *                     percentage:
   *                       type: number
   *     responses:
   *       200:
   *         description: Single updated successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Single not found
   */
  public async update({ auth, request, response, params }: HttpContextContract) {
    const artist = auth.user as Artist
    const singleId = params.id

    const single = await Single.find(singleId)

    if (!single || single.artistId !== artist.id) {
      return response.notFound({ errors: [{ message: 'Single not found' }] })
    }

    const singleSchema = schema.create({
      title: schema.string.optional({}, [rules.maxLength(255)]),
      genre: schema.enum.optional(Object.values(Genre)),
      releaseDate: schema.date.optional({ format: 'yyyy-MM-dd' }),
      albumId: schema.number.optional([rules.exists({ table: 'albums', column: 'id' })]),
      metadata: schema.object.optional().members({
        coverUrl: schema.string.optional({}, [rules.url()]),
        lyrics: schema.string.optional(),
      }),
      copyrights: schema.array.optional().members(
        schema.object().members({
          artistId: schema.number.optional([
            rules.exists({ table: 'artists', column: 'id' }),
          ]),
          ownerName: schema.string.optional(),
          role: schema.string({}, [rules.maxLength(255)]),
          percentage: schema.number([rules.range(0, 100)]),
        })
      ),
    })

    try {
      const payload = await request.validate({ schema: singleSchema })

      // Mettre à jour le single
      single.merge({
        title: payload.title,
        genre: payload.genre,
        releaseDate: payload.releaseDate,
        albumId: payload.albumId,
      })
      await single.save()

      // Mettre à jour les metadata
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

      // Mettre à jour les copyrights
      if (payload.copyrights) {
        const metadata = await single.related('metadata').query().first()
        if (metadata) {
          // Supprimer les anciens copyrights
          await metadata.related('copyrights').query().delete()

          // Créer les nouveaux copyrights
          let totalPercentage = 0
          for (const copyrightData of payload.copyrights) {
            totalPercentage += copyrightData.percentage

            if (!copyrightData.artistId && !copyrightData.ownerName) {
              return response.badRequest({
                errors: [{ message: 'Either artistId or ownerName must be provided in copyrights' }],
              })
            }

            if (copyrightData.artistId && copyrightData.ownerName) {
              return response.badRequest({
                errors: [{ message: 'Provide either artistId or ownerName, not both, in copyrights' }],
              })
            }

            await Copyright.create({
              metadataId: metadata.id,
              artistId: copyrightData.artistId,
              ownerName: copyrightData.ownerName,
              role: copyrightData.role,
              percentage: copyrightData.percentage,
            })
          }

          // Vérifier que le total des pourcentages est égal à 100
          if (totalPercentage !== 100) {
            return response.badRequest({
              errors: [{ message: 'Total percentage of copyrights must be 100%' }],
            })
          }
        }
      }

      // Mettre à jour les genres de l'artiste
      await this.updateArtistGenres(artist)

      // Si le single est associé à un album, mettre à jour les genres de l'album
      if (single.albumId) {
        await this.updateAlbumGenres(single.albumId)
      }

      return response.ok({ message: 'Single updated successfully', data: single })
    } catch (error) {
      return response.badRequest({ errors: error.messages || error })
    }
  }

  /**
   * @swagger
   * /singles/{id}:
   *   get:
   *     tags:
   *       - Singles
   *     summary: Get a single
   *     description: Retrieve details of a specific single.
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Single retrieved successfully.
   *       404:
   *         description: Single not found.
   */
  public async show({ params, response }: HttpContextContract) {
    const single = await Single.query()
      .where('id', params.id)
      .preload('artist')
      .preload('metadata', (metadataQuery) => {
        metadataQuery.preload('copyrights')
      })
      .first()

    if (!single) {
      return response.notFound({ errors: [{ message: 'Single not found' }] })
    }

    return response.ok(single)
  }

  /**
   * @swagger
   * /singles/{id}:
   *   delete:
   *     tags:
   *       - Singles
   *     summary: Delete a single
   *     description: Allows an artist to delete their single.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Single deleted successfully.
   *       401:
   *         description: Unauthorized.
   *       404:
   *         description: Single not found.
   */
  public async delete({ auth, params, response }: HttpContextContract) {
    const artist = auth.user as Artist
    const single = await Single.find(params.id)

    if (!single || single.artistId !== artist.id) {
      return response.notFound({ errors: [{ message: 'Single not found' }] })
    }

    await single.delete()

    return response.ok({ message: 'Single deleted successfully' })
  }

}

