import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'
import gameTypeDefs from './game/typeDefs'
import userTypeDefs from './user/typeDefs'
import {
  signUp,
  login,
  logout,
  changePassword,
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
  revokeRefreshTokens,
  allGames,
  userGameList,
  createGame,
  editGame,
  deleteGame,
])
