import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'
import gameTypeDefs from './game/typeDefs'
import userTypeDefs from './user/typeDefs'
import assetTypeDefs from './asset/typeDefs'
import { myAssets, uploadAsset, deleteAsset } from './asset/resolvers'
import {
  signUp,
  login,
  logout,
  changePassword,
  revokeRefreshTokens,
  refreshToken,
} from './user/resolvers'
import {
  allGames,
  userGameList,
  createGame,
  editGame,
  deleteGame,
  gridState,
  saveGridState,
  test,
} from './game/resolvers'

export const typeDefs = mergeTypeDefs([
  gameTypeDefs,
  userTypeDefs,
  assetTypeDefs,
])
export const resolvers = mergeResolvers([
  signUp,
  login,
  logout,
  changePassword,
  revokeRefreshTokens,
  refreshToken,
  allGames,
  userGameList,
  createGame,
  editGame,
  deleteGame,
  gridState,
  saveGridState,
  myAssets,
  uploadAsset,
  deleteAsset,
  test,
])
