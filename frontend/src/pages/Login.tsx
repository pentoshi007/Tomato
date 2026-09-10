import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthService } from "../config";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppContext } from "../context/AppContext";
import { Logo } from "../components/ui/Logo";
import { Spinner } from "../components/ui/primitives";
import {
  Burger,
  PizzaSlice,
  Donut,
  Fries,
  Sparkle,
} from "../components/ui/illustrations";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppContext();

  const responseGoogle = async (authResult: unknown) => {
    setLoading(true);
    try {
      const { code } = authResult as { code?: string };
      const result = await axios.post(`${AuthService}/api/auth/login`, {
        code,
      });
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
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r-2 border-ink bg-mustard p-10 md:flex">
        <Logo size={44} />
        <div className="relative">
          <h2 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight">
            Real food.
            <br />
            Real fast.
            <br />
            <span className="text-tomato">Right now.</span>
          </h2>
          <p className="mt-4 max-w-xs text-sm font-semibold text-ink/70">
            Order from the kitchens your neighbors are obsessed with.
          </p>
        </div>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="animate-floaty absolute top-24 right-16"
            style={{ ["--float-rot" as string]: "-8deg" }}
          >
            <Burger size={110} />
          </div>
          <div
            className="animate-floaty absolute top-1/2 right-48"
            style={{ animationDelay: "0.9s", ["--float-rot" as string]: "8deg" }}
          >
            <PizzaSlice size={86} />
          </div>
          <div
            className="animate-floaty absolute right-20 bottom-24"
            style={{ animationDelay: "1.7s", ["--float-rot" as string]: "-6deg" }}
          >
            <Donut size={80} />
          </div>
          <div
            className="animate-floaty absolute bottom-40 left-16"
            style={{ animationDelay: "2.3s", ["--float-rot" as string]: "10deg" }}
          >
            <Fries size={72} />
          </div>
          <Sparkle size={26} className="absolute top-40 left-24" />
          <Sparkle size={18} className="absolute right-32 bottom-52" />
        </div>
        <p className="relative text-xs font-bold tracking-widest text-ink/60 uppercase">
          Tomato — your city, served
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="md:hidden">
            <Logo size={46} />
          </div>
          <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tight md:mt-0">
            Hungry? Let's fix that.
          </h1>
          <p className="mt-2 text-sm font-medium text-smoke">
            Log in or sign up in one tap.
          </p>

          <button
            onClick={googleLogin}
            disabled={loading}
            className="btn-secondary mt-8 w-full !py-3 !text-base"
          >
            {loading ? (
              <Spinner size={20} />
            ) : (
              <FcGoogle size={22} aria-hidden="true" />
            )}
            {loading ? "Signing you in…" : "Continue with Google"}
          </button>

          <p className="mt-6 text-center text-xs leading-relaxed font-medium text-smoke">
            By continuing, you agree to our{" "}
            <span className="font-bold text-tomato">Terms of Service</span> and{" "}
            <span className="font-bold text-tomato">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
