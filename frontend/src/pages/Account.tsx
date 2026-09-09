import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BiMapPin, BiReceipt, BiLogOut, BiChevronRight } from "react-icons/bi";
import { Logo } from "../components/ui/Logo";

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
  };

  const rows = [
    {
      label: "Your orders",
      hint: "Track and revisit past orders",
      icon: BiReceipt,
      onClick: () => navigate("/orders"),
    },
    {
      label: "Saved addresses",
      hint: "Manage where your food lands",
      icon: BiMapPin,
      onClick: () => navigate("/address"),
    },
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="card overflow-hidden">
        <div className="border-b-2 border-ink bg-mustard p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-tomato font-display text-2xl font-extrabold text-white shadow-pop-sm">
              {firstLetter}
            </div>
            <div className="min-w-0">
              <h1 className="font-display truncate text-xl font-extrabold">
                {user?.name}
              </h1>
              <p className="truncate text-sm font-semibold text-ink/70">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y-2 divide-mist">
          {rows.map(({ label, hint, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-butter"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-blush">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{label}</span>
                <span className="block truncate text-xs font-medium text-smoke">
                  {hint}
                </span>
              </span>
              <BiChevronRight className="h-5 w-5 shrink-0 text-smoke" />
            </button>
          ))}
          <button
            onClick={logoutHandler}
            className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-blush"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-tomato text-white">
              <BiLogOut className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-bold text-tomato">
              Log out
            </span>
          </button>
        </div>
      </div>

      <div className="mt-8 flex justify-center opacity-60">
        <Logo size={28} />
      </div>
    </div>
  );
};

export default Account;
