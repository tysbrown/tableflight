import type { User } from "@/types"
import { gql, useMutation } from "urql"
import SignUpModal from "./SignUpModal"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useGlobalStateContext } from "../../context/useGlobalContext"

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

const LoginBox = () => {
  const [{ fetching }, login] = useMutation(loginMutation)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const { setState } = useGlobalStateContext()
  const [modalIsOpen, setModalIsOpen] = useState(false)

  const onSubmit = async (fields: Partial<User>) => {
    const { email, password } = fields || {}

    const loginResp = await login({
      email,
      password,
    })

    if (loginResp.error) {
      console.error(loginResp.error)
      return
    }

    const { accessToken, user } = loginResp?.data?.login || {}

    if (accessToken && user) {
      setState({ accessToken, user, isLoggedIn: true })
    }
  }

  return (
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
          disabled={fetching}
          className="w-full p-2 rounded-md bg-blue-500 text-white"
        >
          {fetching ? "Loading..." : "Login"}
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
  )
}

export default LoginBox
