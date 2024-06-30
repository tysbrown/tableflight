import { LoginBox } from "@/molecules"

const LoginView = () => {
  console.log('process env Node env:', process.env.NODE_ENV)
  console.log('vite env Node env: ', import.meta.env.NODE_ENV)
  return (
    <main className="flex justify-center items-center min-h-screen">
      <LoginBox />
    </main>
  )
}

export default LoginView