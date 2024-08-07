import type { Operation } from 'urql'
import type { ReactNode } from 'react'
import { Client, Provider, fetchExchange } from 'urql'
import { authExchange } from '@urql/exchange-auth'
import { cacheExchange } from '@urql/exchange-graphcache'
import { useRefreshToken, useGlobalState } from '@/hooks'
import { GraphQLError } from 'graphql'

/**
 * Provider for the URQL GraphQL client
 *
 * @todo - Configure normalized caching in the cacheExchange
 */

export default function URQLProvider({ children }: { children: ReactNode }) {
  const refreshToken = useRefreshToken()
  const { state } = useGlobalState()
  const { accessToken } = state || {}

  const client = new Client({
    url: import.meta.env.VITE_API_URL,
    exchanges: [
      cacheExchange({}),
      authExchange((utils) => {
        return Promise.resolve({
          addAuthToOperation(operation: Operation) {
            if (accessToken) {
              return utils.appendHeaders(operation, {
                Authorization: `Bearer ${accessToken}`,
                'Apollo-Require-Preflight': 'true',
              })
            }
            return operation
          },
          didAuthError: (error: { graphQLErrors: GraphQLError[] }) => {
            return error.graphQLErrors.some(
              (e) => e.extensions?.code === 'UNAUTHORIZED',
            )
          },
          refreshAuth: async () => {
            await refreshToken()
          },
        })
      }),
      fetchExchange,
    ],
  })

  return <Provider value={client}>{children}</Provider>
}
