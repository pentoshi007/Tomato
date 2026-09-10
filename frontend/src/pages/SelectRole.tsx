import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthService } from "../config";
import { useAppContext } from "../context/AppContext";
import { Logo } from "../components/ui/Logo";
import {
  Burger,
  Scooter,
  SteamBowl,
  type RoleIllustration,
} from "../components/ui/illustrations";

type Role = "customer" | "rider" | "seller";

const ROLE_CARDS: {
  role: Role;
  title: string;
  blurb: string;
  Icon: RoleIllustration;
  bg: string;
}[] = [
  {
    role: "customer",
    title: "I want to eat",
    blurb: "Order from the best kitchens around you.",
    Icon: Burger,
    bg: "bg-blush",
  },
  {
    role: "rider",
    title: "I want to ride",
    blurb: "Pick up orders and earn on your schedule.",
    Icon: Scooter,
    bg: "bg-skywash",
  },
  {
    role: "seller",
    title: "I cook & sell",
    blurb: "Put your kitchen on Tomato and get orders.",
    Icon: SteamBowl,
    bg: "bg-butter",
  },
];

const SelectRole = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAppContext();

  const addRole = async () => {
    if (!role) return;
    try {
      setSubmitting(true);
      const response = await axios.put(
        `${AuthService}/api/auth/add/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setUser(response.data.user);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/", { replace: true });
    } catch (error) {
      console.log(error);
      toast.error("Problem in adding role");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center px-4 py-10">
      <div className="text-center">
        <Logo size={40} className="justify-center" />
        <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
          What brings you here?
        </h1>
        <p className="mt-2 text-sm font-medium text-smoke">
          Pick a side of the counter — you can't change this later.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {ROLE_CARDS.map(({ role: r, title, blurb, Icon, bg }) => {
          const active = role === r;
          return (
            <button
              key={r}
              onClick={() => setRole(r)}
              aria-pressed={active}
              className={`${bg} group cursor-pointer rounded-3xl border-2 border-ink p-6 text-left transition-all ${
                active
                  ? "-translate-1 shadow-pop-lg"
                  : "shadow-pop-sm hover:-translate-0.5 hover:shadow-pop"
              }`}
            >
              <div className="flex items-start justify-between">
                <Icon size={56} />
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink transition-colors ${
                    active ? "bg-tomato" : "bg-paper"
                  }`}
                >
                  {active && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
              </div>
              <h2 className="font-display mt-4 text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm font-medium text-ink/70">{blurb}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={addRole}
          disabled={!role || submitting}
          className="btn-primary !px-8 !py-3 !text-base"
        >
          {submitting ? "Setting you up…" : "Confirm & dig in"}
        </button>
      </div>
    </div>
  );
};

export default SelectRole;
