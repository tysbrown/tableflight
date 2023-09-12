import type { User } from "@/types"
import { useState } from "react"
import { useForm } from "react-hook-form"
import Modal from "../atoms/Modal"
import { useMutation, gql } from "urql"

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
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} heading="Sign Up">
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
          className="grid bg-white shadow-md p-4 pb-6 rounded-lg"
        >
          <input
            type="text"
            placeholder="First Name"
            className="w-full p-2 rounded-md border mb-3"
            {...register("firstName", { required: true })}
          />
          {errors.firstName && <span>This field is required</span>}

          <input
            type="text"
            placeholder="Last Name"
            className="w-full p-2 rounded-md border mb-3"
            {...register("lastName", { required: true })}
          />
          {errors.lastName && <span>This field is required</span>}

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

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-2 rounded-md border mb-3"
            {...register("confirmPassword", { required: true })}
          />
          {errors.confirmPassword && <span>This field is required</span>}

          <button
            disabled={fetching}
            className="w-full p-2 rounded-md bg-green-500 text-white"
          >
            {fetching ? "Loading..." : "Sign Up"}
          </button>
        </form>
      )}
    </Modal>
  )
}

export default SignUpModal
