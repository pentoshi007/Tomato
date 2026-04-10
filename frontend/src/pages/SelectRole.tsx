import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthService } from "../App.tsx";
import { useAppContext } from "../context/AppContext";

type Role = "customer" | "rider" | "seller";

// Code till here is correct for setting up SelectRole component with its dependencies,
// role state, navigation, and context hook imports.
  const SelectRole = () => {
  const [role, setRole] = useState<Role | null>(null);
  const navigate = useNavigate();
  const { setUser } = useAppContext();

  const roles: Role[] = ["customer", "rider", "seller"];
  const addRole = async () => {
    try {
      const response = await axios.put(`${AuthService}/api/auth/add/role`, { role }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setUser(response.data.user);
      localStorage.setItem("token", response.data.token);
      navigate("/", { replace: true });
    } catch (error) {
      console.log(error);
      toast.error("Problem in adding role");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm space-y-6">
            <h1 className="text-center text-2xl font-bold">Choose your role</h1>
            <div className="space-y-4">
                {
                    roles.map((r) => (
                        <button 
                          key={r} 
                          onClick={() => setRole(r)} 
                          className={`w-full rounded-xl border px-4 py-3 text-sm font-medium capitalize transition ${role === r ? "border-[#E23774] bg-[#E23774] text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                        >
                            Continue as {r}
                        </button>
                    ))
                }
            </div>
            {role && (
              <button 
                onClick={addRole}
                className="w-full rounded-xl bg-[#E23774] py-3 text-sm font-medium text-white transition hover:bg-[#d91f66]"
              >
                Confirm Role
              </button>
            )}
        </div>
    </div>
  );
};

export default SelectRole;

