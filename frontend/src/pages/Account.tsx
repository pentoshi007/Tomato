import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BiMapPin, BiPackage } from "react-icons/bi";
import { BiLogOut } from "react-icons/bi";

const Account = () => {
    const { user, setUser, setIsAuth } = useAppContext();
    const firstLetter = user?.name?.charAt(0).toUpperCase();
    const navigate = useNavigate();
    const logoutHandler = () => {
        localStorage.removeItem("token");

        navigate("/login");
        toast.success("Logged out successfully");
        setUser(null);
        setIsAuth(false);
    }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="mx-auto max-w-md rounded-lg bg-white shadow-sm ">
            <div className="flex items-center gap-4 border-b p-5 ">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-xl font-semibold text-white">
                    {firstLetter}
                </div>
                <div >
                    <h2 className="text-lg font-semibold ">{user?.name}</h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                   
                </div>
            </div>
            <div className="divide-y ">
                <div className="p-5 flex cursor-pointer items-center gap-4 hover:bg-gray-50" onClick={()=>navigate('/orders')}><BiPackage className="h-5 w-5 text-red-500" /><span className="font-medium">Orders</span></div>
            </div>
            <div className="divide-y ">
                <div className="p-5 flex cursor-pointer items-center gap-4 hover:bg-gray-50" onClick={()=>navigate('/address')}><BiMapPin className="h-5 w-5 text-red-500" /><span className="font-medium">Addresses</span></div>
            </div>
            <div className="divide-y ">
                <div className="p-5 flex cursor-pointer items-center gap-4 hover:bg-gray-50" onClick={logoutHandler}><BiLogOut className="h-5 w-5 text-red-500" /><span className="font-medium">Logout</span></div>
            </div>
        </div>
    </div>
  )
}

export default Account