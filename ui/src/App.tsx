import type { User } from "@/types";
const App = () => {
  const user: Partial<User> = {
    firstName: "John Doe",
    email: "",
  };
  return (
    <>
      <div className="text-center text-6xl mt-6">
        Hello, world! {user.firstName}
      </div>
    </>
  );
};

export default App;
