// app/Controllers/Http/AlbumsController.ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Album from 'App/Models/Album'
import Artist from 'App/Models/Artist'
import Metadata from 'App/Models/Metadata'
import AlbumValidator from 'App/Validators/AlbumValidator'

export default class AlbumsController {
  /**
   * @create
   * @operationId createAlbum
   * @description Creates a new album
   * @requestBody <AlbumValidator.createSchema>
   * @responseBody 201 - {"message":"Album created successfully","data":<Album>}
   * @responseBody 400 - {"errors":[{"message":"Validation error."}]}
   * @responseBody 401 - {"errors":[{"message":"Unauthorized."}]}
   */
  public async create({ auth, request, response }: HttpContextContract) {
    const artist = auth.user as Artist

    try {
      const payload = await request.validate({
        schema: AlbumValidator.createSchema,
        messages: AlbumValidator.messages,
      })

      const album = await Album.create({
        title: payload.title,
        releaseDate: payload.releaseDate,
        artistId: artist.id,
      })

      await Metadata.create({
        albumId: album.id,
        coverUrl: payload.metadata.coverUrl,
      })

      return response.created({ message: 'Album created successfully', data: album })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Create album failed.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @update
   * @operationId updateAlbum
   * @description Updates an existing album
   * @paramPath id - The ID of the album - @type(number) @required
   * @requestBody <AlbumValidator.updateSchema>
   * @responseBody 200 - {"message":"Album updated successfully","data":<Album>}
   * @responseBody 400 - {"errors":[{"message":"Validation error."}]}
   * @responseBody 401 - {"errors":[{"message":"Unauthorized."}]}
   * @responseBody 404 - {"errors":[{"message":"Album not found."}]}
   */
  public async update({ auth, request, response, params }: HttpContextContract) {
    const artist = auth.user as Artist
    const albumId = params.id

    const album = await Album.find(albumId)
    if (!album || album.artistId !== artist.id) {
      return response.notFound({ errors: [{ message: 'Album not found', code: 'ALBUM_NOT_FOUND' }] })
    }

    try {
      const payload = await request.validate({
        schema: AlbumValidator.updateSchema,
        messages: AlbumValidator.messages,
      })

      album.merge({
        title: payload.title,
        releaseDate: payload.releaseDate,
      })
      await album.save()

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

      return response.ok({ message: 'Album updated successfully', data: album })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Update album failed.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @show
   * @operationId getAlbum
   * @description Retrieves an album by ID.
   * @paramPath id - The ID of the album - @type(number) @required
   * @responseBody 200 - <Album>
   * @responseBody 404 - {"errors":[{"message":"Album not found."}]}
   */
  public async show({ params, response }: HttpContextContract) {
    const album = await Album.query()
      .where('id', params.id)
      .preload('artist')
      .preload('metadata')
      .preload('singles', (singlesQuery) => singlesQuery.preload('metadata'))
      .first()

    if (!album) {
      return response.notFound({ errors: [{ message: 'Album not found', code: 'ALBUM_NOT_FOUND' }] })
    }

    return response.ok(album)
  }

  /**
   * @delete
   * @operationId deleteAlbum
   * @description Deletes an album by ID.
   * @paramPath id - The ID of the album - @type(number) @required
   * @responseBody 200 - {"message":"Album deleted successfully"}
   * @responseBody 401 - {"errors":[{"message":"Unauthorized."}]}
   * @responseBody 404 - {"errors":[{"message":"Album not found."}]}
   */
  public async delete({ auth, params, response }: HttpContextContract) {
    const artist = auth.user as Artist
    const album = await Album.find(params.id)

    if (!album || album.artistId !== artist.id) {
      return response.notFound({ errors: [{ message: 'Album not found', code: 'ALBUM_NOT_FOUND' }] })
    }

    await album.delete()

    return response.ok({ message: 'Album deleted successfully' })
  }
}
