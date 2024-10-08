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

type GridState {
  gameSessionID: ID!
  grid: [[Token]]
  rows: Int
  cols: Int
  cellSize: Int
  dimensions: Dimensions
  backgroundImage: String
  lineWidth: Float
  zoomLevel: Float
  position: Position
}

type Token {
  id: ID!
  type: String!
  createdById: ID!
  ownedById: ID!
}

type Dimensions {
  width: Int!
  height: Int!
}

type Position {
  x: Int!
  y: Int!
}

type CharacterSheet {
  id: ID!
  userId: ID!
}

type Mutation {
  createGame(name: String!, description: String): Game!
  editGame(id: ID!, name: String, description: String): Game!
  deleteGame(id: ID!): Game!
}

type Query {
  allGames: [Game]
  userGameList: [Game]
  test: String
}
`

export default gameTypeDefs