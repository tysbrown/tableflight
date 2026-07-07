import app from '~api/main'
import supertest from 'supertest'

/**
 * Fires a GraphQL operation at the real Express app in-process (no network /
 * running server) — supertest binds its own ephemeral port for each request.
 */
const graphQLRequest = (query: string) => {
  return supertest(app).post('/api/graphql').send({ query })
}

export default graphQLRequest
