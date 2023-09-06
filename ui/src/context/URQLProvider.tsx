import type { Operation } from "urql"
import type { AuthConfig, AuthUtilities } from "@urql/exchange-auth"
import { useGlobalStateContext } from "./useGlobalContext"
import { Client, Provider, cacheExchange, fetchExchange } from "urql"
import { authExchange } from "@urql/exchange-auth"
import { useMemo } from "react"

export default function URQLProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { state, setState } = useGlobalStateContext()
  const { isLoggedIn, accessToken } = state || {}

  const client = useMemo(() => {
    if (!isLoggedIn) return null
    return new Client({
      url: import.meta.env.VITE_API_URL,
      exchanges: [
        cacheExchange,
        authExchange(async (utils: AuthUtilities): Promise<AuthConfig> => {
          return {
            addAuthToOperation(operation: Operation) {
              if (!accessToken) return operation
              return utils.appendHeaders(operation, {
                Authorization: `Bearer ${accessToken}`,
              })
            },
            didAuthError: (error) => {
              return error.graphQLErrors.some(
                (e) => e.extensions?.code === "FORBIDDEN",
              )
            },
            refreshAuth: async () => {
              const response = await fetch(
                import.meta.env.VITE_API_URL + "/refresh_token",
                {
                  method: "POST",
                  credentials: "include",
                },
              )
              const { accessToken, user } = await response.json()
              setState({ ...state, accessToken, user, isLoggedIn: true })
            },
          }
        }),
        fetchExchange,
      ],
    })
  }, [isLoggedIn])

  if (!client) return null

  return <Provider value={client}>{children}</Provider>
}
