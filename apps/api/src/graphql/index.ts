import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'
import gameTypeDefs from './game/game.gql'
import gameResolvers from './game/game'
import userTypeDefs from './user/user.gql'
import userResolvers from './user/user'

export const typeDefs = mergeTypeDefs([gameTypeDefs, userTypeDefs])
export const resolvers = mergeResolvers([gameResolvers, userResolvers])
