import app from '~api/main'
import supertest from 'supertest'

export const graphQLRequest = (url: string, query: string) => {
  return supertest(app).post(url).send({
    query,
  })
}