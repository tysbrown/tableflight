import graphQLRequest from '../support/graphqlRequest'

describe('GET /api/graphql', () => {
  it('resolves the health-check `test` query', async () => {
    const res = await graphQLRequest(`query { test }`)

    expect(res.status).toBe(200)
    expect(res.body.data.test).toBe('Hello World')
  })
})
