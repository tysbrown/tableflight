import type { Operation } from "urql"
import type { AuthConfig, AuthUtilities } from "@urql/exchange-auth"
import { useState } from "react"
import { useGlobalStateContext } from "./useGlobalContext"
import { Provider, createClient, fetchExchange } from "urql"
import { authExchange } from "@urql/exchange-auth"
import { cacheExchange } from "@urql/exchange-graphcache"
import { ClientContext } from "./ClientContext"
import { useClient } from "../hooks/useClient"

export default function URQLProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { resetClient } = useClient()
  const { state, setState } = useGlobalStateContext()
  const { accessToken } = state || {}

  const makeClient = () =>
    createClient({
      url: import.meta.env.VITE_API_URL,
      exchanges: [
        cacheExchange({}),
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
                `${import.meta.env.VITE_API_URL}/refresh_token`,
                {
                  method: "POST",
                  credentials: "include",
                },
              )
              const { accessToken, user } = await response.json()

              // If the refresh token is invalid, log the user out
              if (!accessToken) {
                setState({ ...state, isLoggedIn: false })

                resetClient()
                return
              }

              setState({ ...state, accessToken, user, isLoggedIn: true })
            },
          }
        }),
        fetchExchange,
      ],
    })

  const [client, setClient] = useState(makeClient())

  return (
    <ClientContext.Provider
      value={{
        resetClient: () => setClient(makeClient()),
      }}
    >
      <Provider value={client}>{children}</Provider>
    </ClientContext.Provider>
  )
}
