import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import StatsValidator from 'App/Validators/StatsValidator'
import Stat from 'App/Models/Stat'
import Artist from 'App/Models/Artist'
import Database from '@ioc:Adonis/Lucid/Database'
import EmailService from 'App/Services/EmailService'

const GOLD_THRESHOLD = 50000
const PLATINUM_THRESHOLD = 100000
const DIAMOND_THRESHOLD = 1000000

const REVENUE_PER_STREAM = 0.003

export default class StatsController {
  /**
   * @updateStats
   * @summary Update stats of a single (only listensCount)
   * @operationId updateSingleStats
   * @tag Stats
   * @description Updates the `listensCount` for a single, automatically recalculates the revenue, checks for awards, and updates the artist's popularity.
   * @paramPath id - The ID of the Stat record - @type(number) @required
   * @requestBody {"listensCount": number} // Only listensCount
   * @responseBody 200 - {"message":"Stats updated successfully","data":<Stat>}
   * @responseBody 400 - {"errors":[{"message":"Validation error"}]}
   * @responseBody 404 - {"errors":[{"message":"Stat not found"}]}
   * @responseBody 500 - {"errors":[{"message":"Update stats failed"}]}
   */
  public async update({ params, request, response }: HttpContextContract) {
    try {
      const payload = await request.validate({
        schema: StatsValidator.updateSchema, // suppose qu'il ne contient plus `revenue`
        messages: StatsValidator.messages,
      })

      const stat = await Stat.find(params.id)
      if (!stat) {
        return response.notFound({
          errors: [{ message: 'Stat not found', code: 'STAT_NOT_FOUND' }],
        })
      }

      await stat.load('single')
      const single = stat.single
      if (!single) {
        return response.notFound({
          errors: [{ message: 'Single not found for this Stat', code: 'SINGLE_NOT_FOUND' }],
        })
      }


      const oldListens = stat.listensCount
      const newListens = payload.listensCount ?? oldListens

      stat.listensCount = newListens
      stat.revenue = newListens * REVENUE_PER_STREAM

      await stat.save()

      // Détecte si on franchit un ou plusieurs paliers
      const awardsCrossed = this.detectAwardsCrossed(oldListens, newListens)
      if (awardsCrossed.length > 0) {
        await single.load('artist')
        const artist = single.artist

        // Envoi d'e-mail pour chaque award
        for (const award of awardsCrossed) {
          await EmailService.sendAwardEmail(
            artist.email,
            artist.name,
            single.title,
            award,
            newListens
          )

        }
      }

      await this.updateArtistPopularity(single.artistId)

      return response.ok({
        message: 'Stats updated successfully',
        data: stat,
      })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({
        errors: [{ message: 'Update stats failed', code: 'INTERNAL_ERROR' }],
      })
    }
  }

  /**
   * @artistStats
   * @summary Get global stats for an artist
   * @operationId getArtistStats
   * @tag Stats
   * @description Returns aggregated stats (sum of listensCount, sum of revenue) for all singles of a given artist.
   * @paramPath artistId - The ID of the artist - @type(number) @required
   * @responseBody 200 - {"data":{"artistId":number,"totalListens":number,"totalRevenue":number}}
   * @responseBody 404 - {"errors":[{"message":"Artist not found"}]}
   */
  public async artistStats({ params, response }: HttpContextContract) {
    const artist = await Artist.find(params.artistId)
    if (!artist) {
      return response.notFound({
        errors: [{ message: 'Artist not found', code: 'ARTIST_NOT_FOUND' }],
      })
    }

    // Calculer la somme des écoutes et des revenus
    const row = await Database
      .from('stats')
      .join('singles', 'singles.id', '=', 'stats.single_id')
      .where('singles.artist_id', artist.id)
      .select(
        Database.raw('SUM(stats.listens_count) as totalListens'),
        Database.raw('SUM(stats.revenue) as totalRevenue')
      )
      .first()

    return response.ok({
      data: {
        artistId: artist.id,
        totalListens: Number(row?.totalListens || 0),
        totalRevenue: Number(row?.totalRevenue || 0),
      },
    })
  }

  // -------------------------------------------------------------------
  // Méthodes privées
  // -------------------------------------------------------------------

  /**
   * Détecte quels "awards" on franchit en comparant l'ancien total d'écoutes au nouveau.
   */
  private detectAwardsCrossed(oldListens: number, newListens: number): string[] {
    const awards: string[] = []

    if (oldListens < GOLD_THRESHOLD && newListens >= GOLD_THRESHOLD) {
      awards.push('Gold')
    }
    if (oldListens < PLATINUM_THRESHOLD && newListens >= PLATINUM_THRESHOLD) {
      awards.push('Platinum')
    }
    if (oldListens < DIAMOND_THRESHOLD && newListens >= DIAMOND_THRESHOLD) {
      awards.push('Diamond')
    }

    return awards
  }

  /**
   * Recalcule la popularité = somme des listensCount de tous ses singles.
   */
  private async updateArtistPopularity(artistId: number) {
    const row = await Database
      .from('stats')
      .join('singles', 'singles.id', '=', 'stats.single_id')
      .where('singles.artist_id', artistId)
      .sum('stats.listens_count as totalListens')
      .first()

    const totalListens = Number(row?.totalListens || 0)
    const artist = await Artist.find(artistId)
    if (artist) {
      artist.popularity = totalListens
      await artist.save()
    }
  }
}
