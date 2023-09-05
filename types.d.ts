export type User = {
  id: number
  tokenVersion: number
  firstName: string
  lastName: string
  email: string
  password: string
  games?: Game[]
}

export type Game = {
  id: number
  name: string
  description: string
  createdBy: User
  createdById: number
}