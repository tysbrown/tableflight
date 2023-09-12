import type { Operation } from "urql"
import type { AuthConfig, AuthUtilities } from "@urql/exchange-auth"
import type { ReactNode } from "react"
import { Client, Provider, fetchExchange } from "urql"
import { authExchange } from "@urql/exchange-auth"
import { cacheExchange } from "@urql/exchange-graphcache"
import { useRefreshToken } from "../hooks/useRefreshToken"
import { useGlobalStateContext } from "./useGlobalContext"

export default function URQLProvider({ children }: { children: ReactNode }) {
  const refreshToken = useRefreshToken()
  const { state } = useGlobalStateContext()
  const { accessToken } = state || {}

  const client = new Client({
    url: `/graphql`,
    exchanges: [
      cacheExchange({}),
      authExchange(async (utils: AuthUtilities): Promise<AuthConfig> => {
        return {
          addAuthToOperation(operation: Operation) {
            console.log("addAuthToOperation")
            console.log("accessToken?", accessToken)

            if (accessToken)
              return utils.appendHeaders(operation, {
                Authorization: `Bearer ${accessToken}`,
                "Apollo-Require-Preflight": "true",
              })
            return operation
          },
          didAuthError: (error) => {
            console.log("didAuthError")
            return error.graphQLErrors.some(
              (e) => e.extensions?.code === "UNAUTHORIZED",
            )
          },
          refreshAuth: async () => {
            await refreshToken()
          },
        }
      }),
      fetchExchange,
    ],
  })

  return <Provider value={client}>{children}</Provider>
}
