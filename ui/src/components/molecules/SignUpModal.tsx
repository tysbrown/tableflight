import type { User } from "@/types"
import { useState } from "react"
import { useForm } from "react-hook-form"
import Modal from "../atoms/Modal"
import TextInput from "../atoms/TextInput"
import { useMutation, gql } from "urql"
import Button from "../atoms/Button"

const signUpMutation = gql`
  mutation SignUp(
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
  ) {
    signUp(
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
    ) {
      createdAt
      email
      firstName
      id
      lastName
    }
  }
`

export type SignUpFormValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

type SignUpModalProps = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SignUpModal = ({ isOpen, setIsOpen }: SignUpModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()
  const [showSuccessView, setShowSuccessView] = useState(false)

  const [{ fetching }, signUp] = useMutation(signUpMutation)

  const onSubmit = async ({
    firstName,
    lastName,
    email,
    password,
  }: Partial<User>) => {
    const resp = await signUp({ email, password, firstName, lastName })
    if (resp.error) {
      console.error(resp.error)
    } else {
      setShowSuccessView(true)
      reset()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      heading="Sign Up"
      className="bg-surfaceContainerHigh"
    >
      {showSuccessView ? (
        <article className="flex flex-col items-center justify-center p-9">
          <h1 className="text-2xl font-bold">Success!</h1>
          <p className="text-sm text-gray-500">
            You have successfully signed up!
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 mt-10 rounded-md text-white font-bold justify-self-center"
          >
            Close
          </button>
        </article>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
          className="grid bg-surfaceContainerHigh p-4 pb-6 rounded-lg"
        >
          <TextInput
            type="text"
            name="firstName"
            label="First Name"
            required
            register={register}
            hasError={errors.firstName}
            className="mb-4"
          />
          <TextInput
            type="text"
            name="lastName"
            label="Last Name"
            required
            register={register}
            hasError={errors.lastName}
            className="mb-4"
          />
          <TextInput
            type="email"
            name="email"
            label="Email"
            required
            noAutoComplete
            register={register}
            hasError={errors.email}
            className="mb-4"
          />
          <TextInput
            type="password"
            name="password"
            label="Password"
            required
            noAutoComplete
            register={register}
            hasError={errors.password}
            className="mb-4"
          />
          <TextInput
            type="password"
            name="confirmPassword"
            label="Confirm Password"
            required
            register={register}
            validate={(value, formValues) => value === formValues.password}
            hasError={errors.confirmPassword}
            className="mb-4"
          />
          <Button style="primary" type="submit" disabled={fetching}>
            {fetching ? "Loading..." : "Sign Up"}
          </Button>
        </form>
      )}
    </Modal>
  )
}

export default SignUpModal
