import { useContext } from "react"
import { ClientContext } from "../context/ClientContext"

export const useClient = () => useContext(ClientContext)
