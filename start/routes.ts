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
}).prefix('/auth')


