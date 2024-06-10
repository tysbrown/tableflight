export const typeDefs = `#graphql
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

type User {
  id: ID!
  tokenVersion: Int!
  email: String!
  password: String!
  firstName: String!
  lastName: String!
  createdAt: String!
  updatedAt: String!
  gamesCreated: [Game]
  gamesParticipating: [Game]
  characterSheets: [CharacterSheet]
}

type Login {
  accessToken: String
  user: User
}

type Logout {
  message: String
}

type revokeRefreshTokens {
  message: String
}

type SignUp {
  email: String
}

type RefreshToken {
  token: String!
  user: User!
}

type Mutation {
  signUp(
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  ): User
  login(email: String!, password: String!): Login
  logout: Logout
  changePassword(currentPassword: String!, newPassword: String!): User!
  revokeRefreshTokens(id: ID!): revokeRefreshTokens
  refreshToken: RefreshToken!
  createGame(name: String!, description: String): Game!
  editGame(id: ID!, name: String, description: String): Game!
  deleteGame(id: ID!): Game!
}

type Query {
  games: [Game]
  gameList: [Game]
}`;
