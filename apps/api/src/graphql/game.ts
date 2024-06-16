import type { Game } from '~common';
import { GraphQLError } from 'graphql';
import type { Context } from '~api/context.js';

export default {
  Mutation: {
    createGame: async (
      _: never,
      { name, description }: Partial<Game>,
      { prisma, user }: Context
    ) => {
      if (!user)
        throw new GraphQLError('You are not authorized to make this request.', {
          extensions: {
            code: 'UNAUTHORIZED',
            http: {
              status: 401,
            },
          },
        });

      const game = await prisma.game.create({
        data: {
          name,
          description,
          createdById: user.id,
        },
      });
      return game;
    },
    deleteGame: (
      _: never,
      { id }: Partial<Game>,
      { user, prisma }: Context
    ) => {
      if (!user)
        throw new GraphQLError('You are not authorized to make this request.', {
          extensions: {
            code: 'UNAUTHORIZED',
            http: {
              status: 401,
            },
          },
        });

      const game = prisma.game.delete({
        where: {
          id: Number(id),
        },
      });
      return game;
    },
    editGame: async (
      _: never,
      { id, name, description }: Partial<Game>,
      { prisma, user }: Context
    ) => {
      if (!user)
        throw new GraphQLError('You are not authorized to make this request.', {
          extensions: {
            code: 'UNAUTHORIZED',
            http: {
              status: 401,
            },
          },
        });

      const game = await prisma.game.update({
        where: {
          id: Number(id),
        },
        data: {
          name,
          description,
        },
      });
      return game;
    },
  },
  Query: {
    games: (_: never, __: never, context: Context) => {
      const { prisma, user } = context || {};

      if (!user)
        throw new GraphQLError('You are not authorized to make this request.', {
          extensions: {
            code: 'UNAUTHORIZED',
            http: {
              status: 401,
            },
          },
        });

      return prisma.game.findMany({
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          playersParticipating: true,
        },
      });
    },
    gameList: (_: never, __: never, context: Context) => {
      const { prisma, user } = context || {};

      if (!user)
        throw new GraphQLError('You are not authorized to make this request.', {
          extensions: {
            code: 'UNAUTHORIZED',
            http: {
              status: 401,
            },
          },
        });

      return prisma.game.findMany({
        orderBy: {
          updatedAt: 'desc',
        },
        where: {
          playersParticipating: {
            some: {
              id: user.id,
            },
          },
        },
        include: {
          playersParticipating: true,
        },
      });
    },
  },
};
