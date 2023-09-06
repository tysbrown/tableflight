import { GraphQLError } from "graphql"
import type { Context } from "../context"
import { compare, hash, genSalt } from "bcrypt"

export const changePassword = async (
  _: never,
  args: { oldPassword: string; newPassword: string },
  context: Context
) => {
  const { oldPassword, newPassword } = args
  const { prisma, user } = context

  if (!user) {
    throw new GraphQLError("You are not authorized to make this request.", {
      extensions: {
        code: "UNAUTHORIZED",
        http: 401,
      },
    })
  }

  const { id: userId, password } = user

  const passwordIsValid = await compare(oldPassword, password)

  if (!passwordIsValid) {
    throw new GraphQLError("The old password you entered is invalid.", {
      extensions: {
        code: "BAD_USER_INPUT",
        http: 400,
      },
    })
  }

  const salt = await genSalt(10)
  const hashedNewPassword = await hash(newPassword, salt)

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  })

  return updatedUser
}