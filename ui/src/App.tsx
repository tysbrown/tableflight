import type { Game, User } from "@/types"
import { gql, useMutation, useQuery } from "urql"
import SignUpModal from "./components/molecules/SignUpModal"
import { useForm } from "react-hook-form"
import { useState } from "react"

const App = () => {
  const [result] = useQuery({
    query: gamesQuery,
  })

  const { data, fetching, error } = result

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  // const { setState } = useGlobalStateContext()
  const [modalIsOpen, setModalIsOpen] = useState(false)

  // const [login] = useMutation(LOGIN_MUTATION, {
  //   onCompleted: (data) => {
  //     setState({ ...data.login, authIsLoading: false })
  //     router.push("/home")
  //   },
  //   onError: (error) => {
  //     console.log(error)
  //   },
  // })

  const onSubmit = (user: Partial<User>) => {
    // login({
    //   variables: {
    //     email: user.email,
    //     password: user.password,
    //   },
    // })
  }

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <>
      <section className="max-w-lg w-full mx-auto mt-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid bg-white shadow-md p-4 pb-6 rounded-lg"
        >
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 rounded-md border mb-3"
            {...register("email", { required: true })}
          />
          {errors.email && <span>This field is required</span>}

          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 rounded-md border mb-3"
            {...register("password", { required: true })}
          />
          {errors.password && <span>This field is required</span>}
          <button
            type="submit"
            className="w-full p-2 rounded-md bg-blue-500 text-white"
          >
            Log In
          </button>

          <button
            onClick={() => console.log("Handle this button.")}
            className="mt-4 text-center text-sm text-blue-500"
          >
            Forgot password?
          </button>
          <hr className="my-5" />
          <button
            onClick={() => setModalIsOpen(true)}
            className="bg-green-500 px-4 py-2 rounded-md text-white font-bold justify-self-center"
          >
            Create new account
          </button>
        </form>
        <SignUpModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} />
      </section>
      <div className="text-center text-6xl mt-6">Hello, world!</div>
      {data?.games?.map((game: Game) => (
        <div key={game.id} className="text-center text-6xl mt-6">
          {game.name}
        </div>
      ))}
    </>
  )
}

export default App

const gamesQuery = gql`
  query Games {
    games {
      id
      description
      name
    }
  }
`

const loginMutation = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`
