import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Album from 'App/Models/Album'
import Artist from 'App/Models/Artist'
import Metadata from 'App/Models/Metadata'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class AlbumsController {
  /**
   * @swagger
   * tags:
   *   - name: Albums
   *     description: Operations related to albums
   */

  /**
   * @swagger
   * /albums:
   *   post:
   *     tags:
   *       - Albums
   *     summary: Create a new album
   *     description: Allows an artist to create a new album with metadata
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
   *               - releaseDate
   *               - metadata
   *             properties:
   *               title:
   *                 type: string
   *               releaseDate:
   *                 type: string
   *                 format: date-time
   *               metadata:
   *                 type: object
   *                 properties:
   *                   coverUrl:
   *                     type: string
   *                     format: uri
   *     responses:
   *       201:
   *         description: Album created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   */
  public async create({ auth, request, response }: HttpContextContract) {
    const artist = auth.user as Artist

    const albumSchema = schema.create({
      title: schema.string({}, [rules.maxLength(255)]),
      releaseDate: schema.date.optional({ format: 'yyyy-MM-dd' }),
      metadata: schema.object().members({
        coverUrl: schema.string({}, [rules.url()]),
      }),
    })

    try {
      const payload = await request.validate({ schema: albumSchema })

      // Créer l'album
      const album = await Album.create({
        title: payload.title,
        releaseDate: payload.releaseDate,
        artistId: artist.id,
      })

      // Créer les metadata
      await Metadata.create({
        albumId: album.id,
        coverUrl: payload.metadata.coverUrl,
      })

      // Les genres de l'album seront mis à jour lors de l'ajout des singles

      return response.created({ message: 'Album created successfully', data: album })
    } catch (error) {
      return response.badRequest({ errors: error.messages || error })
    }
  }

  /**
   * @swagger
   * /albums/{id}:
   *   put:
   *     tags:
   *       - Albums
   *     summary: Update an album
   *     description: Allows an artist to update their album
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
   *               releaseDate:
   *                 type: string
   *                 format: date-time
   *               metadata:
   *                 type: object
   *                 properties:
   *                   coverUrl:
   *                     type: string
   *                     format: uri
   *     responses:
   *       200:
   *         description: Album updated successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Album not found
   */
  public async update({ auth, request, response, params }: HttpContextContract) {
    const artist = auth.user as Artist
    const albumId = params.id

    const album = await Album.find(albumId)

    if (!album || album.artistId !== artist.id) {
      return response.notFound({ errors: [{ message: 'Album not found' }] })
    }

    const albumSchema = schema.create({
      title: schema.string.optional({}, [rules.maxLength(255)]),
      releaseDate: schema.date.optional({ format: 'yyyy-MM-dd' }),
      metadata: schema.object.optional().members({
        coverUrl: schema.string.optional({}, [rules.url()]),
      }),
    })

    try {
      const payload = await request.validate({ schema: albumSchema })

      // Mettre à jour l'album
      album.merge({
        title: payload.title,
        releaseDate: payload.releaseDate,
      })
      await album.save()

      // Mettre à jour les metadata
      if (payload.metadata) {
        let metadata = await album.related('metadata').query().first()
        if (!metadata) {
          metadata = new Metadata()
          metadata.albumId = album.id
        }
        metadata.merge({
          coverUrl: payload.metadata.coverUrl,
        })
        await metadata.save()
      }

      // Les genres de l'album seront mis à jour lors de l'ajout ou la mise à jour des singles

      return response.ok({ message: 'Album updated successfully', data: album })
    } catch (error) {
      return response.badRequest({ errors: error.messages || error })
    }
  }

  /**
   * @swagger
   * /albums/{id}:
   *   get:
   *     tags:
   *       - Albums
   *     summary: Get an album
   *     description: Retrieve details of a specific album.
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Album retrieved successfully.
   *       404:
   *         description: Album not found.
   */
  public async show({ params, response }: HttpContextContract) {
    const album = await Album.query()
      .where('id', params.id)
      .preload('artist')
      .preload('metadata')
      .preload('singles', (singlesQuery) => {
        singlesQuery.preload('metadata')
      })
      .first()

    if (!album) {
      return response.notFound({ errors: [{ message: 'Album not found' }] })
    }

    return response.ok(album)
  }

  /**
   * @swagger
   * /albums/{id}:
   *   delete:
   *     tags:
   *       - Albums
   *     summary: Delete an album
   *     description: Allows an artist to delete their album.
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
   *         description: Album deleted successfully.
   *       401:
   *         description: Unauthorized.
   *       404:
   *         description: Album not found.
   */
  public async delete({ auth, params, response }: HttpContextContract) {
    const artist = auth.user as Artist
    const album = await Album.find(params.id)

    if (!album || album.artistId !== artist.id) {
      return response.notFound({ errors: [{ message: 'Album not found' }] })
    }

    await album.delete()

    return response.ok({ message: 'Album deleted successfully' })
  }
}
