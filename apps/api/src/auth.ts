import type { Context } from "./context"
import type { User } from "~common"
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

export const setRefreshTokenCookie = async (res: Response, token: string) => {
  try {
    res.cookie("jid", token, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  } catch (err) {
    console.error("Error setting refresh token cookie: ", err)
  }
}

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie("jid", {
    httpOnly: true,
    path: "/refresh_token",
    secure: true,
    sameSite: "strict",
  })
}
