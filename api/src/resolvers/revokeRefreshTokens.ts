import { User } from "@/common/types"
import { Context } from "../context"

export const revokeRefreshTokens = async (
  _: unknown,
  { id }: Partial<User>,
  context: Context
) => {
  await context.prisma.user.update({
    where: {
      id: Number(id),
    },
    data: {
      tokenVersion: {
        increment: 1,
      },
    },
  })
  return true
}