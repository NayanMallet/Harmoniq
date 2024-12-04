import Artist from 'App/Models/Artist'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'

export default class ProfilesController {
  /**
   * @swagger
   * /artists:
   *   get:
   *     tags:
   *       - Artists
   *     summary: List all artists
   *     description: Lists all artists with optional filters (location, popularity).
   *     parameters:
   *       - in: query
   *         name: country
   *         schema:
   *           type: string
   *         description: Filter by country (ISO 3166-1 alpha-2 code)
   *       - in: query
   *         name: city
   *         schema:
   *           type: string
   *         description: Filter by city
   *       - in: query
   *         name: popular
   *         schema:
   *           type: boolean
   *         description: Sort by popularity (desc)
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: List of artists.
   */
  public async index({ request, response }: HttpContextContract) {
    const { country, city, popular } = request.qs()
    const query = Artist.query()

    if (country) {
      query.where('country', country.toUpperCase())
    }

    if (city) {
      query.where('city', 'like', `%${city}%`)
    }

    if (popular) {
      query.orderBy('popularity', 'desc')
    }

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const artists = await query.paginate(page, limit)

    return response.ok(artists)
  }

  /**
   * @swagger
   * /artists/{id}:
   *   get:
   *     tags:
   *       - Artists
   *     summary: Get artist profile
   *     description: Retrieves a specific artist's profile by ID.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The ID of the artist
   *     responses:
   *       200:
   *         description: Artist profile.
   *       404:
   *         description: Artist not found.
   */
  public async show({ params, response }: HttpContextContract) {
    const artist = await Artist.find(params.id)

    if (!artist) {
      return response.notFound({ errors: [{ message: 'Artist not found.' }] })
    }

    return response.ok(artist)
  }

  /**
   * @swagger
   * /artists:
   *   put:
   *     tags:
   *       - Artists
   *     summary: Update artist profile
   *     description: Updates the profile of the authenticated artist.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               biography:
   *                 type: string
   *               socialLinks:
   *                 $ref: '#/definitions/SocialLinks'
   *               location:
   *                 $ref: '#/definitions/Location'
   *     responses:
   *       200:
   *         description: Artist profile updated successfully.
   *       400:
   *         description: Validation errors.
   *       401:
   *         description: Unauthorized.
   *       404:
   *         description: Artist not found.
   */
  public async update({ auth, request, response }: HttpContextContract) {
    const artist = await Artist.find(auth.user!.id)

    if (!artist) {
      return response.notFound({ errors: [{ message: 'Artist not found.' }] })
    }

    const updateSchema = schema.create({
      biography: schema.string.optional({}, [rules.maxLength(1000)]),
      socialLinks: schema.object.optional().anyMembers(
        // @ts-ignore
        schema.string({}, [rules.url()])
      ),
      location: schema.object.optional().members({
        country: schema.string({}, [
          rules.minLength(2),
          rules.maxLength(2),
          rules.regex(/^[A-Z]{2}$/),
        ]),
        city: schema.string({}, [rules.maxLength(255)]),
      }),
    })

    const messages = {
      'biography.maxLength': 'Biography cannot exceed 1000 characters.',
      'socialLinks.*.url': 'Each social link must be a valid URL.',
      'location.country.minLength': 'Country code must be 2 characters.',
      'location.country.maxLength': 'Country code must be 2 characters.',
      'location.country.regex': 'Country code must be uppercase ISO 3166-1 alpha-2 code.',
      'location.city.maxLength': 'City name cannot exceed 255 characters.',
    }

    try {
      const data = await request.validate({ schema: updateSchema, messages })

      artist.merge(data)
      await artist.save()

      return response.ok(artist)
    } catch (error) {
      if (error.messages) {
        return response.badRequest({ errors: error.messages.errors })
      } else {
        return response.badRequest({ errors: [{ message: 'Profile update failed.' }] })
      }
    }
  }
}
