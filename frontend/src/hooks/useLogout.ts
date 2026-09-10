import { useCallback } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { useDemo } from "../demo/useDemo";

type BeforeLogout = () => Promise<void> | void;

export const useLogout = () => {
  const { setUser, setIsAuth } = useAppContext();
  const { active: demoActive, exit } = useDemo();

  return useCallback(
    async (before?: BeforeLogout) => {
      if (demoActive) {
        exit();
      } else if (before) {
        try {
          await before();
        } catch (error) {
          console.warn("Pre-logout step failed:", error);
        }
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuth(false);
      toast.success("Logged out successfully");
    },
    [demoActive, exit, setUser, setIsAuth],
  );
};
