import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddVerificationFieldsToUsers extends BaseSchema {
  protected tableName = 'users'

  public async up () {
    this.schema.table(this.tableName, (table) => {
      table.string('verification_code').nullable()
      table.boolean('is_verified').defaultTo(false)
    })
  }

  public async down () {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('verification_code')
      table.dropColumn('is_verified')
    })
  }
}
