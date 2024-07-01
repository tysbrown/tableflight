import type { LoginResponse, User } from "~common"
import { OperationResult, gql, useMutation } from "urql"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useGlobalState } from "@/hooks"
import tw from "twin.macro"
import { Button, TextInput } from "@/atoms"
import { SignUpModal } from "@/molecules"

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
console.log('process env Node env:', process.env.NODE_ENV)
console.log('vite env Node env: ', import.meta.env.NODE_ENV)
const LoginBox = () => {
  const [{ fetching }, login] = useMutation(loginMutation)
  console.log('process env Node env:', process.env.NODE_ENV)
  console.log('vite env Node env: ', import.meta.env.NODE_ENV)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const { setState } = useGlobalState()
  const [modalIsOpen, setModalIsOpen] = useState(false)

  const onSubmit = async (fields: Partial<User>) => {
    const { email, password } = fields || {}

    const loginResp = (await login({
      email,
      password,
    })) as OperationResult<LoginResponse>
    const { accessToken, user } = loginResp?.data?.login || {}

    if (loginResp.error) {
      console.error(loginResp.error)
      return
    }

    if (accessToken && user) {
      setState({ accessToken, user, isLoggedIn: true })
    }
  }

  return (
    <section
      css={[
        tw`max-w-lg w-full mx-auto mt-8 bg-surfaceContainer shadow-1 py-6 px-4 rounded-xl`,
      ]}
    >
      <h1 css={[tw`text-5xl font-bold mb-6 text-center tracking-tighter`]}>
        TableFlight x
      </h1>

      <hr css={[tw`mb-8 border-outlineVariant`]} />

      <form onSubmit={handleSubmit(onSubmit) as () => void} css={[tw`grid`]}>
        <TextInput
          type="email"
          name="email"
          label="Email"
          required
          register={register}
          hasError={errors.email}
          css={[tw`mb-4`]}
        />
        <TextInput
          type="password"
          name="password"
          label="Password"
          required
          register={register}
          hasError={errors.password}
          css={[tw`mb-6`]}
        />
        <div>
          <Button
            style="primary"
            type="submit"
            disabled={fetching}
            css={[tw`mr-2`]}
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

        <hr css={[tw`mt-8 mb-4 border-outlineVariant`]} />

        <Button
          type="button"
          style="link"
          onClick={() => setModalIsOpen(true)}
          css={[tw`justify-self-center`]}
        >
          Create new account
        </Button>
      </form>
      <SignUpModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} />
    </section>
  )
}

export default LoginBox
