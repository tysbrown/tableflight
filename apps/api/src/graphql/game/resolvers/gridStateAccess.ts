import { Context } from '~common'
import { GraphQLError } from 'graphql'
import { type GridState } from '@prisma/client'

/**
 * Ensure the requester is signed in and belongs to the game session (as its
 * creator or a participating player). Returns the numeric game id.
 */
export const requireSessionPlayer = async (
  context: Context,
  gameSessionId: string,
) => {
  const { prisma, user } = context || {}

  if (!user)
    throw new GraphQLError('You are not authorized to make this request.', {
      extensions: {
        code: 'UNAUTHORIZED',
        http: {
          status: 401,
        },
      },
    })

  const gameId = parseInt(gameSessionId, 10)
  if (Number.isNaN(gameId))
    throw new GraphQLError('Invalid game session id.', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: {
          status: 400,
        },
      },
    })

  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      OR: [
        { createdById: user.id },
        { playersParticipating: { some: { id: user.id } } },
      ],
    },
  })

  if (!game)
    throw new GraphQLError('Game session not found.', {
      extensions: {
        code: 'NOT_FOUND',
        http: {
          status: 404,
        },
      },
    })

  return gameId
}

/** Prisma stores the board snapshot as Json; the API serves it as a string. */
export const toGridStateResponse = (gridState: GridState) => ({
  gameSessionID: gridState.gameSessionID,
  state: JSON.stringify(gridState.state),
  updatedAt: gridState.updatedAt.toISOString(),
})
