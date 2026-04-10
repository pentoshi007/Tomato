import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast"
import ProtectedRoute from "./components/protectedRoute";
import PublicRoute from "./components/publicRoute";
import SelectRole from "./pages/SelectRole";
import Navbar from "./components/Navbar";
import Account from "./pages/Account";

export const AuthService = "http://localhost:3000";


const App = () => {
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