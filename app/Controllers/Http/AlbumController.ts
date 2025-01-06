// app/Controllers/Http/AlbumsController.ts

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Album from 'App/Models/Album'
import Artist from 'App/Models/Artist'
import Metadata from 'App/Models/Metadata'
import AlbumValidator from 'App/Validators/AlbumValidator'
import GenreService from 'App/Services/GenreService'

/**
 * @swagger
 * tags:
 *   - name: Albums
 *     description: Endpoints for managing albums
 */
export default class AlbumsController {
  /**
   * @index
   * @summary List albums
   * @operationId listAlbums
   * @tag Albums
   * @description Lists and filters albums with pagination.
   *
   * @paramQuery genreId - Filter by a genre ID that is in album.genresId - @type(number)
   * @paramQuery title - Filter by partial or complete album title (case-insensitive) - @type(string)
   * @paramQuery artistId - Filter by artist ID - @type(number)
   * @paramQuery sortBy - "title" (optional) - @type(string)
   * @paramQuery sortDirection - "asc" or "desc" - @type(string)
   * @paramQuery page - Page number (1..10000) - @type(number)
   * @paramQuery limit - Page size (1..100) - @type(number)
   *
   * @responseBody 200 - <Album[]>.paginated()
   * @responseBody 400 - {"errors":[{"message":"Validation error"}]}
   * @responseBody 500 - {"errors":[{"message":"Internal error"}]}
   */
  public async index({ request, response }: HttpContextContract) {
    try {
      const payload = await request.validate({
        schema: AlbumValidator.filterSchema,
        messages: AlbumValidator.messages,
      })

      const {
        genreId,
        title,
        artistId,
        sortBy,
        sortDirection,
        page = 1,
        limit = 10,
      } = payload

      const query = Album.query()

      // Filtre par genre
      if (genreId) {
        query.whereRaw('JSON_CONTAINS(genres_id, CAST(? as JSON))', [genreId])
      }

      // Filtre par title
      if (title) {
        const lowerTitle = title.toLowerCase()
        query.whereRaw('LOWER(title) LIKE ?', [`%${lowerTitle}%`])
      }

      // Filtre par artiste
      if (artistId) {
        query.where('artist_id', artistId)
      }

      // Tri
      if (sortBy === 'title') {
        query.orderByRaw(`LOWER(title) ${sortDirection || 'asc'}`)
      } else {
        // Par défaut => created_at desc
        query.orderBy('created_at', 'desc')
      }

      const albums = await query.paginate(page, limit)

      return response.ok({
        meta: albums.getMeta(),
        data: albums.all(),
      })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({
        errors: [{ message: 'Failed to fetch albums.', code: 'INTERNAL_ERROR' }],
      })
    }
  }

  /**
   * @create
   * @summary Create an album
   * @operationId createAlbum
   * @tag Albums
   * @description Creates a new album.
   *
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
      return response.internalServerError({
        errors: [{ message: 'Create album failed.', code: 'INTERNAL_ERROR' }],
      })
    }
  }

  /**
   * @update
   * @summary Update an album
   * @operationId updateAlbum
   * @tag Albums
   * @description Updates an existing album.
   *
   * @paramPath id - The ID of the album - @type(number) @required
   * @requestBody <AlbumValidator.updateSchema>
   * @responseBody 200 - {"message":"Album updated successfully","data":<Album>}
   * @responseBody 400 - {"errors":[{"message":"Validation error."}]}
   * @responseBody 401 - {"errors":[{"message":"Unauthorized."}]}
   * @responseBody 404 - {"errors":[{"message":"Album not found."}]}
   */
  public async update({ auth, request, response, params }: HttpContextContract) {
    const artist = auth.user as Artist
    const album = await Album.find(params.id)

    if (!album || album.artistId !== artist.id) {
      return response.notFound({
        errors: [{ message: 'Album not found', code: 'ALBUM_NOT_FOUND' }],
      })
    }

    try {
      const payload = await request.validate({
        schema: AlbumValidator.updateSchema,
        messages: AlbumValidator.messages,
      })

      // Champs non modifiables
      const nonUpdatableFields = ['artistId', 'createdAt', 'updatedAt'];
      const receivedKeys = Object.keys(request.body());
      const forbiddenKeys = receivedKeys.filter((key) => nonUpdatableFields.includes(key));

      // Construction des avertissements
      const fieldWarnings = forbiddenKeys.map((field) => ({
        message: `Field '${field}' cannot be modified by the user.`,
        code: 'FIELD_NOT_MODIFIABLE',
        field: field,
      }));


      album.merge({
        title: payload.title,
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

      // Retour avec avertissements partiels si nécessaire
      if (fieldWarnings.length > 0) {
        return response.status(200).json({
          message: 'Album updated successfully with partial warnings.',
          warnings: fieldWarnings,
          data: album,
        });
      }

      return response.ok({
        message: 'Album updated successfully',
        data: album
      })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({
        errors: [{ message: 'Update album failed.', code: 'INTERNAL_ERROR' }],
      })
    }
  }

  /**
   * @show
   * @summary Get album by ID
   * @operationId getAlbum
   * @tag Albums
   * @description Retrieves an album by ID.
   *
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

    const loadedGenres = await GenreService.loadGenresByIds(album.genresId)
    return response.ok({
      data: {
        id: album.id,
        title: album.title,
        artist: {
          id: album.artist.id,
          name: album.artist.name,
        },
        genres: loadedGenres,
        created_at: album.createdAt,
        updated_at: album.updatedAt,
        singles: album.singles,
        metadata: album.metadata,
      },
    })
  }

  /**
   * @delete
   * @summary Delete an album
   * @operationId deleteAlbum
   * @tag Albums
   * @description Deletes an album by ID.
   *
   * @paramPath id - The ID of the album - @type(number) @required
   * @responseBody 200 - {"message":"Album deleted successfully"}
   * @responseBody 401 - {"errors":[{"message":"Unauthorized."}]}
   * @responseBody 404 - {"errors":[{"message":"Album not found."}]}
   */
  public async delete({ auth, params, response }: HttpContextContract) {
    const artist = auth.user as Artist
    const album = await Album.find(params.id)
    if (!album || album.artistId !== artist.id) {
      return response.notFound({
        errors: [{ message: 'Album not found', code: 'ALBUM_NOT_FOUND' }],
      })
    }

    await album.delete()
    return response.ok({ message: 'Album deleted successfully' })
  }
}
