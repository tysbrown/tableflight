export type User = {
  id: number
  tokenVersion: number
  email: string
  password: string
  firstName: string
  lastName: string
  createdAt: Date
  updatedAt: Date
  games?: Game[]
}

export type Game = {
  id: number
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  createdBy: User
  createdById: number
}
