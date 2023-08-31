import { ApolloServer } from "apollo-server"
import { typeDefs, resolvers } from "./schema"
import { context } from "./context"

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
})

server
  .listen({ port: 1337 })
  .then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`)
  })
  .catch((err) => {
    console.error(err)
  })
