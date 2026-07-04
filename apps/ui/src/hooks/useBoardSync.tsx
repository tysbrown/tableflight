import { useEffect, useRef } from 'react'
import { gql, useMutation, useQuery } from 'urql'
import { useBoard } from './useBoard'

const gridStateQuery = gql`
  query GridState($gameSessionId: ID!) {
    gridState(gameSessionId: $gameSessionId) {
      gameSessionID
      state
    }
  }
`

const saveGridStateMutation = gql`
  mutation SaveGridState($gameSessionId: ID!, $state: String!) {
    saveGridState(gameSessionId: $gameSessionId, state: $state) {
      gameSessionID
    }
  }
`

type GridStateQueryResult = {
  gridState: { gameSessionID: string; state: string } | null
}

const SAVE_POLL_MS = 2000

/**
 * Persistence for the board: loads the saved snapshot when a game session is
 * entered, then autosaves whenever the engine's revision counter moves (i.e.
 * on token/line/map changes, not on panning or zooming). Failed saves are
 * retried on the next poll; autosave stays disabled until the initial load
 * finishes so an empty board can never overwrite saved state.
 */
export const useBoardSync = () => {
  const { engine, gameSessionId, loadSnapshot } = useBoard()

  /** Null until the initial snapshot load finishes — blocks autosave. */
  const lastSavedRevision = useRef<number | null>(null)
  const loadedSessionId = useRef<string | null>(null)
  const saving = useRef(false)

  // A replaced engine instance (board remount) starts empty: require a fresh
  // load before autosave may run again.
  useEffect(() => {
    loadedSessionId.current = null
    lastSavedRevision.current = null
  }, [engine])

  const [{ data, error }] = useQuery<GridStateQueryResult>({
    query: gridStateQuery,
    variables: { gameSessionId },
    pause: !engine || !gameSessionId,
    // The snapshot must always be fresh: a cached result would roll the
    // board back on session re-entry and then get autosaved over the truth.
    requestPolicy: 'network-only',
  })
  const [, saveGridState] = useMutation(saveGridStateMutation)

  useEffect(() => {
    if (!engine || !gameSessionId) return
    // A failed load (urql delivers data: null with an error) must leave
    // autosave disarmed — saving now could overwrite the server's board
    // with an empty one.
    if (error) {
      console.error('Failed to fetch the saved board state:', error)
      return
    }
    if (!data) return
    if (loadedSessionId.current === gameSessionId) return
    loadedSessionId.current = gameSessionId
    lastSavedRevision.current = null

    const snapshot = data.gridState?.state
    if (snapshot) {
      try {
        loadSnapshot(snapshot)
      } catch (loadError) {
        console.error('Failed to load the saved board state:', loadError)
      }
    }
    lastSavedRevision.current = engine.revision()
  }, [engine, gameSessionId, data, error, loadSnapshot])

  useEffect(() => {
    if (!engine || !gameSessionId) return undefined

    const intervalId = setInterval(() => {
      if (lastSavedRevision.current === null || saving.current) return

      const revision = engine.revision()
      if (revision === lastSavedRevision.current) return

      saving.current = true
      saveGridState({ gameSessionId, state: engine.snapshot() })
        .then((result) => {
          if (result.error) {
            // Leave lastSavedRevision alone so the next poll retries.
            console.error('Board autosave failed, will retry:', result.error)
            return
          }
          lastSavedRevision.current = revision
        })
        .finally(() => {
          saving.current = false
        })
    }, SAVE_POLL_MS)

    return () => clearInterval(intervalId)
  }, [engine, gameSessionId, saveGridState])
}
