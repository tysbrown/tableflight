import type { User } from "@/types"
import type { Context } from "../context"
import { genSalt, hash } from "bcrypt"

export default {
  Mutation: {
    signUp: async (
      _: never,
      { firstName, lastName, email, password }: Partial<User>,
      context: Context,
    ) => {
      const salt = await genSalt(10)
      password = await hash(password, salt)

      const user = await context.prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password,
        },
      })

      return user
    },
  },
}
