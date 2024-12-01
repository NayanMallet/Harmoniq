import Artist from 'App/Models/Artist'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ProfilesController {
  /**
   * @index
   * @operationId listArtists
   * @description Lists all artists with optional filters (location, popularity).
   * @paramQuery location - Filter by location - @type(string)
   * @paramQuery popular - Sort by popularity (desc) - @type(boolean)
   * @responseBody 200 - <Artist[]>
   */
  public async index({ request, response }: HttpContextContract) {
    const { location, popular } = request.qs()
    const query = Artist.query()

    if (location) query.where('location', location)
    if (popular) query.orderBy('popularity', 'desc')

    const artists = await query.exec()
    return response.ok(artists)
  }

  /**
   * @show
   * @operationId getArtistProfile
   * @description Retrieves a specific artist's profile by ID.
   * @paramPath id - The ID of the artist - @type(number) @required
   * @responseBody 200 - <Artist>
   * @responseBody 404 - {"error": "Artist not found"}
   */
  public async show({ params, response }: HttpContextContract) {
    const artist = await Artist.find(params.id)

    if (!artist) {
      return response.notFound({ error: 'Artist not found' })
    }

    return response.ok(artist)
  }

  /**
   * @update
   * @operationId updateArtistProfile
   * @description Updates the profile of the authenticated artist.
   * @requestBody {"biography": "string", "socialLinks": "object", "location": "string"}
   * @responseBody 200 - <Artist>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 404 - {"error": "Artist not found"}
   */
  public async update({ auth, request, response }: HttpContextContract) {
    const artist = await Artist.find(auth.user!.id)

    if (!artist) {
      return response.notFound({ error: 'Artist not found' })
    }

    const data = request.only(['biography', 'socialLinks', 'location'])
    artist.merge(data)
    await artist.save()

    return response.ok(artist)
  }
}
