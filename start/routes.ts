/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/
import Route from '@ioc:Adonis/Core/Route'
import AutoSwagger from 'adonis-autoswagger'
import swagger from 'Config/swagger'

// Swagger documentation
Route.get('/swagger', async () => {
  return AutoSwagger.docs(Route.toJSON(), swagger)
})

Route.get('/docs', async () => {
  return AutoSwagger.ui('/swagger', swagger)
})

// Default route
Route.get('/', async () => {
  return { hello: 'world' }
})

// Authentication routes
Route.group(() => {
  Route.post('/register', 'AuthController.register')
  Route.post('/verify-email', 'AuthController.verifyEmail')
  Route.post('/login', 'AuthController.login')
  Route.post('/request-password-reset', 'AuthController.requestPasswordReset')
  Route.post('/reset-password', 'AuthController.resetPassword')
  Route.post('/logout', 'AuthController.logout').middleware('auth')
  Route.delete('/delete-account', 'AuthController.deleteAccount').middleware('auth')
})
  .prefix('/api/auth')
  .namespace('App/Controllers/Http')

// Artist routes
Route.group(() => {
  // Gestion des profils
  Route.get('/', 'ProfileController.index') // Lister tous les artistes avec filtres, suggestions, etc.
  Route.get('/compare', 'ProfileController.compare') // Comparer des artistes par leurs IDs
  Route.get('/:id', 'ProfileController.show') // Voir un profil d'artiste
  Route.put('/', 'ProfileController.update').middleware('auth') // Mettre à jour le profil de l'artiste connecté
  Route.delete('/history', 'ProfileController.clearHistory').middleware('auth') // Effacer l'historique de l'artiste connecté
})
  .prefix('/api/artists')
  .namespace('App/Controllers/Http')


// Singles routes
Route.group(() => {
  Route.post('/', 'SingleController.create').middleware('auth')
  Route.put('/:id', 'SingleController.update').middleware('auth')
  Route.get('/:id', 'SingleController.show')
  Route.get('/', 'SingleController.index')
  Route.delete('/:id', 'SingleController.delete').middleware('auth')
})
  .prefix('/api/singles')
  .namespace('App/Controllers/Http')

// Albums routes
Route.group(() => {
  Route.post('/', 'AlbumController.create').middleware('auth')
  Route.put('/:id', 'AlbumController.update').middleware('auth')
  Route.get('/:id', 'AlbumController.show')
  Route.delete('/:id', 'AlbumController.delete').middleware('auth')
})
  .prefix('/api/albums')
  .namespace('App/Controllers/Http')

// Genres routes
Route.group(() => {
  Route.post('/', 'GenresController.create').middleware('auth')
  Route.get('/', 'GenresController.index')
  Route.delete('/:id', 'GenresController.delete').middleware('auth')
})
  .prefix('/api/genres')
  .namespace('App/Controllers/Http')
