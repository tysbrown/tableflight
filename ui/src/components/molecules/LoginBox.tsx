import type { User } from "@/types"
import { gql, useMutation } from "urql"
import SignUpModal from "./SignUpModal"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useGlobalStateContext } from "../../context/useGlobalContext"
import Button from "../atoms/Button"
import TextInput from "../atoms/TextInput"

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
        className="grid bg-surfaceContainer shadow-md p-4 pb-6 rounded-xl"
      >
        <TextInput
          type="email"
          name="email"
          placeholder="Email"
          required
          register={register}
        />
        {errors.email && <span>This field is required</span>}

        <TextInput
          type="password"
          name="password"
          placeholder="Password"
          required
          register={register}
        />
        {errors.password && <span>This field is required</span>}
        <div className="ml-auto">
          <Button
            style="primary"
            type="submit"
            disabled={fetching}
            className="mr-2"
          >
            {fetching ? "Loading..." : "Login"}
          </Button>

          <Button
            style="outline"
            type="button"
            onClick={() => console.log("Handle this button.")}
          >
            Forgot password?
          </Button>
        </div>

        <hr className="mt-8 mb-6 border-outlineVariant" />
        <Button
          type="button"
          style="secondary"
          onClick={() => setModalIsOpen(true)}
          className="mx-auto"
        >
          Create new account
        </Button>
      </form>
      <SignUpModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} />
    </section>
  )
}

export default LoginBox
