const gameTypeDefs = `#graphql
type Game {
  id: ID!
  name: String!
  description: String
  image: String
  createdAt: String!
  updatedAt: String!
  createdById: ID!
  playersParticipating: [User]
  gridState: GridState
}

"""
The saved board for a game session. \`state\` is the JSON snapshot produced by
the board engine (libs/board-engine): grid settings, tokens, drawn lines,
map image, and camera.
"""
type GridState {
  gameSessionID: ID!
  state: String!
  updatedAt: String!
}

type CharacterSheet {
  id: ID!
  userId: ID!
}

type Mutation {
  createGame(name: String!, description: String): Game!
  editGame(id: ID!, name: String, description: String): Game!
  deleteGame(id: ID!): Game!
  saveGridState(gameSessionId: ID!, state: String!): GridState!
}

type Query {
  allGames: [Game]
  userGameList: [Game]
  gridState(gameSessionId: ID!): GridState
  test: String
}
`

export default gameTypeDefs