import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'
import gameTypeDefs from './game/game.gql'
import userTypeDefs from './user/user.gql'
import {
  signUp,
  login,
  logout,
  changePassword,
  refreshToken,
  revokeRefreshTokens,
} from './user/resolvers'
import {
  allGames,
  userGameList,
  createGame,
  editGame,
  deleteGame,
} from './game/resolvers'

export const typeDefs = mergeTypeDefs([gameTypeDefs, userTypeDefs])
export const resolvers = mergeResolvers([
  signUp,
  login,
  logout,
  changePassword,
  refreshToken,
  revokeRefreshTokens,
  allGames,
  userGameList,
  createGame,
  editGame,
  deleteGame,
])
