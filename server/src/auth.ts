import type { Context } from "./context"
import type { User } from "@/types"
import type { Response } from "express"
import pkg from "jsonwebtoken"
const { sign } = pkg

export const createAccessToken = (user: User) => {
  return sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  })
}

export const createRefreshToken = (user: User) => {
  return sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    },
  )
}

export const getUser = async (context: Context, userId: number) => {
  const { prisma } = context

  const user: User = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })

  return user
}

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie("jid", token, {
    httpOnly: true,
    path: "/",
    // secure: true,
    // sameSite: "none",
  })
}

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie("jid", {
    httpOnly: true,
    path: "/refresh_token",
    secure: true,
    sameSite: "none",
  })
}
