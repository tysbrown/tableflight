import graphQLRequest from '../support/graphqlRequest'

describe('test', () => {
  it('should return a message', async () => {
    const res = await graphQLRequest(`query { test }`)

    expect(res.body.data.test).toBe('Hello World')
  })
})
