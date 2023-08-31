import { Post } from "@prisma/client"
import { gql } from "apollo-server"
import { Context } from "./context"

export const typeDefs = gql`
  type Post {
    id: ID!
    body: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    posts: [Post]
  }

  type Mutation {
    addPost(body: String!): Post
    deletePost(id: ID!): Post
    editPost(id: ID!, body: String): Post
  }
`

export const resolvers = {
  Query: {
    posts: (_: unknown, __: unknown, context: Context) => {
      return context.prisma.post.findMany({
        orderBy: {
          updatedAt: "desc",
        },
      })
    },
  },
  Mutation: {
    addPost: async (_: unknown, { body }: Partial<Post>, context: Context) => {
      const post = await context.prisma.post.create({
        data: {
          body,
        },
      })
      return post
    },
    deletePost: (_: unknown, { id }: Partial<Post>, context: Context) => {
      const post = context.prisma.post.delete({
        where: {
          id: Number(id),
        },
      })
      return post
    },
    editPost: async (
      _: unknown,
      { id, body }: Partial<Post>,
      context: Context
    ) => {
      const post = await context.prisma.post.update({
        where: {
          id: Number(id),
        },
        data: {
          body,
        },
      })
      return post
    },
  },
}
