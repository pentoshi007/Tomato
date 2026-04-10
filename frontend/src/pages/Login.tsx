import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthService } from "../App.tsx";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppContext } from "../context/AppContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppContext();
  const responseGoogle = async (authResult: unknown) => {
    setLoading(true);
    try {
      const { code } = authResult as { code?: string };
      const result = await axios.post(`${AuthService}/api/auth/login`, { code });
      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message);
      setLoading(false);
      setUser(result.data.user);
      setIsAuth(true);
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error("Problem in logging in");
      setLoading(false);
    }
  }
  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-3xl font-bold text-center text-[#E23774]">Tomato</h1>
        <p className="text-center text-gray-500 text-sm">Login or signup to continue</p>
        <button onClick={googleLogin} className="w-full flex items-center justify-center gap-3  rounded-xl  border border-gray-300  bg-white px-4 py-3">
          <FcGoogle size={20} />
          {loading ? "Signing in..." : "Login with Google"}
        </button>
        <p className="text-center text-gray-500 text-sm">By continuing, you agree to our <span className="text-[#E23774]">Terms of Service</span> and <span className="text-[#E23774]">Privacy Policy</span></p>
      </div>
    </div>
  );
}
   
  

export default Login