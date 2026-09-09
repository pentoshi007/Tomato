import { NavLink, useLocation } from "react-router-dom";
import { BiHomeSmile, BiReceipt, BiCartAlt, BiUser } from "react-icons/bi";
import { useAppContext } from "../context/AppContext";

const tabs = [
  { to: "/", label: "Home", icon: BiHomeSmile, end: true },
  { to: "/orders", label: "Orders", icon: BiReceipt, end: false },
  { to: "/cart", label: "Cart", icon: BiCartAlt, end: false },
  { to: "/account", label: "You", icon: BiUser, end: false },
];

const MobileNav = () => {
  const { isAuth, quantity } = useAppContext();
  const { pathname } = useLocation();
  if (!isAuth || pathname === "/login" || pathname === "/select-role") {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      <div className="grid h-16 grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition-colors ${
                isActive ? "text-tomato" : "text-smoke"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-all ${
                    isActive ? "border-2 border-ink bg-blush" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label}
                {to === "/cart" && quantity > 0 && (
                  <span className="absolute top-0.5 right-1/2 flex h-4 min-w-4 translate-x-6 items-center justify-center rounded-full border border-ink bg-mustard px-1 text-[9px] font-black text-ink">
                    {quantity > 99 ? "99+" : quantity}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
