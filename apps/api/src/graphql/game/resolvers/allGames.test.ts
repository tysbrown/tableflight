import { Game } from '~common'
import { graphQLRequest } from '../../../util'

const allGamesMock = [
  {
    id: expect.any(String),
    name: expect.any(String),
    description: expect.any(String),
    image: expect.any(String),
    createdById: expect.any(String),
    updatedAt: expect.any(String),
  },
]

it('should return an array of customers', async () => {
  const allGames = await graphQLRequest(
    '/api/graphql',
    `#graphql
    query allGames {
      allGames {
        id
        name
        description
        image
        createdById
        updatedAt
      }
    }
    `,
  )
  
  expect(allGames).toMatchObject(allGamesMock)
})
