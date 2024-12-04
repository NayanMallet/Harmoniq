// interfaces.ts

/**
 * @swagger
 * definitions:
 *   SocialLinks:
 *     type: object
 *     additionalProperties:
 *       type: string
 *       format: uri
 *     description: Key-value pairs of social link names and their URLs.
 */
export interface SocialLinks {
  [key: string]: string
}

/**
 * @swagger
 * definitions:
 *   Location:
 *     type: object
 *     properties:
 *       country:
 *         type: string
 *         description: ISO 3166-1 alpha-2 country code
 *       city:
 *         type: string
 */
export interface Location {
  country: string
  city: string
}
