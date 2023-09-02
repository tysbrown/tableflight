import { ApolloServer } from "apollo-server"
import { typeDefs, resolvers } from "./schema.js"
import { context } from "./context.js"

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
})

server
  .listen({ port: 1337, host: "0.0.0.0" })
  .then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`)
  })
  .catch((err) => {
    console.error(err)
  })
