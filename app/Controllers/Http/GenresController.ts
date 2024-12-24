// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GenresValidator from 'App/Validators/GenresValidator'
import Genres from 'App/Models/Genres'
import { GenreObjects } from '../../../resources/utils/GenreObjects'

export default class GenresController {

  /**
   * @create
   * @operationId createGenre
   * @description Creates a new genre
   * @requestBody <GenresValidator.createSchema>
   * @responseBody 201 - {"message":"Genres created successfully","data":<Genres>}
   * @responseBody 400 - {"errors":[{"message":"Validation error."}]}
   * @responseBody 401 - {"errors":[{"message":"Unauthorized."}]}
   */
  public async create({ request, response }: HttpContextContract) {
    try {
      const data = await request.validate({
        schema: GenresValidator.createSchema,
        messages: GenresValidator.messages,
      })

      // Check if genre already exists
      const existingGenre = await Genres.findBy('name', data.name)
      if (existingGenre) {
        return response.badRequest({ errors: [{
          message: 'Genres already exists.',
            code: 'GENRE_EXISTS'
        }]
        })
      }

      const genre = await Genres.create(data)
      return response.created({ message: 'Genres created successfully', data: genre })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({
        errors: [{
          message: 'Create genre failed.',
          code: 'INTERNAL_ERROR'
        }]
      })
    }
  }

  /**
   * @init
   * @operationId initGenres
   * @description Initializes genres
   * @responseBody 201 - {"message":"Genres initialized successfully"}
   * @responseBody 500 - {"errors":[{"message":"Initialize genres failed.","code":"INTERNAL_ERROR"}]}
    */
  public async init({ response }: HttpContextContract) {
    try {
      for (const genre of GenreObjects) {
        await Genres.create(genre)
      }
      return response.created({ message: 'Genres initialized successfully' })
    } catch (error) {
      console.error(error)
      return response.internalServerError({
        errors: [{
          message: 'Initialize genres failed.',
          code: 'INTERNAL_ERROR'
        }]
      })
    }
  }


  //TODO: Optimize index/delete methods + add index by ID/slug
  /**
   * @index
   * @operationId getGenres
   * @description Retrieves all genres
   * @responseBody 200 - {"message":"Genres retrieved successfully","data":<Genres[]>}
   * @responseBody 500 - {"errors":[{"message":"Retrieve genres failed.","code":"INTERNAL_ERROR"}]}
   */
  public async index({ response }: HttpContextContract) {
    const genres = await Genres.all()
    return response.ok(genres)
  }

  /**
   * delete
   * @operationId deleteGenre
   * @description Deletes a genre by ID.
   * @paramPath id - The ID of the genre - @type(number) @required
   * @responseBody 200 - {"message":"Genres deleted successfully"}
   * @responseBody 404 - {"errors":[{"message":"Genres not found."}]}
   * @responseBody 401 - {"errors":[{"message":"Unauthorized."}]}
   * @responseBody 500 - {"errors":[{"message":"Delete genre failed."}]}
    */
  public async delete({ params, response }: HttpContextContract) {
    const genre = await Genres.find(params.id)
    if (!genre) {
      return response.notFound({ errors: [{ message: 'Genres not found.', code: 'GENRE_NOT_FOUND' }] })
    }
    await genre.delete()
    return response.ok({ message: 'Genres deleted successfully' })
  }





}
