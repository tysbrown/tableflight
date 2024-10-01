import app from '~api/main'
import supertest from 'supertest'

const graphQLRequest = (query: string) => {
  return supertest(app)
    .post('/api/graphql')
    .send({
      query
    })
}

export default graphQLRequest