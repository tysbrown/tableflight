import { clearRefreshTokenCookie } from "../auth.js"
import type { Context } from "../context.js"

export const logout = async (_: unknown, __: unknown, context: Context) => {
  const { res, prisma, user } = context

  if (!user) {
    throw new Error("You are not authenticated.")
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tokenVersion: {
        increment: 1,
      },
    },
  })

  clearRefreshTokenCookie(res)

  return {
    message: "Successfully logged out.",
  }
}