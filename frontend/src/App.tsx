import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast"
import ProtectedRoute from "./components/protectedRoute";
import PublicRoute from "./components/publicRoute";
import SelectRole from "./pages/SelectRole";
import Navbar from "./components/Navbar";
import Account from "./pages/Account";
import { Restaurant } from "./pages/Restaurant";
import { useAppContext } from "./context/AppContext";
export const AuthService = "http://localhost:3000";
export const restaurantService = "http://localhost:3001";


const App = () => {
  const {user} = useAppContext();
  if(user?.role === "seller") {
    return <><Restaurant /><Toaster /></>;
  }
  return <>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route element={<ProtectedRoute />} >
          <Route path="/" element={<Home />} />
          <Route path="/account" element={<Account />} />
        </Route>
        <Route element={<PublicRoute />} >
          <Route path="/login" element={<Login />} />
          <Route path="/select-role" element={<SelectRole />} />

        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  </>
}

export default App