import {
  signUp,
  login,
  logout,
  revokeRefreshTokens,
  changePassword,
  games,
  createGame,
  deleteGame,
  editGame,
} from "./resolvers"

export const typeDefs = `#graphql
  type Game {
    id: ID!
    name: string
    description: string
    createdAt: Date
    updatedAt: Date
  }

  type SignUp {
    email: String
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

  type Query {
    games: [Game]
  }

  type Mutation {
    createGame(name: String!, description: String): Game
    deleteGame(id: ID!): Game
    editGame(id: ID!, name: String, description: String): Game
    signUp(
      email: String!
      password: String!
      firstName: String!
      lastName: String!
    ): User
    login(email: String!, password: String!): Login
    logout: Logout
    revokeRefreshTokens(id: ID!): revokeRefreshTokens
    changePassword(currentPassword: String!, newPassword: String!): User
  }
`

export const resolvers = {
  Query: {
    games: games,
  },
  Mutation: {
    createGame,
    deleteGame,
    editGame,
    signUp,
    login,
    logout,
    revokeRefreshTokens,
    changePassword,
  },
}
