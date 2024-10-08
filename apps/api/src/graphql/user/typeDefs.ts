const userTypeDefs = `#graphql
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
}
`

export default userTypeDefs
