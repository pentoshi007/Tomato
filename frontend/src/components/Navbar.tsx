import { useAppContext } from "../context/AppContext";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { BiMapPin, BiSearch, BiReceipt } from "react-icons/bi";
import { Logo } from "./ui/Logo";
import DemoChip from "../demo/DemoChip";

const CartButton = ({ quantity }: { quantity: number }) => (
  <Link
    to="/cart"
    aria-label={`Cart, ${quantity} items`}
    className="btn-secondary relative !rounded-full !p-2 sm:!p-2.5"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="20" r="1.6" />
      <circle cx="17" cy="20" r="1.6" />
      <path d="M3 3h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.2L20 7H6" />
    </svg>
    {quantity > 0 && (
      <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-mustard px-1 text-[10px] font-black text-ink">
        {quantity > 99 ? "99+" : quantity}
      </span>
    )}
  </Link>
);

const Navbar = () => {
  const { isAuth, city, quantity, user } = useAppContext();
  const currLocation = useLocation();
  const isAuthScreen =
    currLocation.pathname === "/login" ||
    currLocation.pathname === "/select-role";
  const isHomePage = currLocation.pathname === "/";
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";

  const [search, setSearch] = useState(urlSearch);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (!isHomePage) return;
    const next = search.trim();
    if (next === urlSearch) return;
    const timer = setTimeout(() => {
      setSearchParams(next ? { search: next } : {}, { replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, urlSearch, isHomePage, setSearchParams]);

  // Auth screens are full-bleed branded experiences — no chrome.
  if (isAuthScreen) {
    return null;
  }

  const searchBar = (
    <div className="flex w-full items-center rounded-full border-2 border-ink bg-white shadow-pop-xs transition-shadow focus-within:shadow-pop-sm">
      <div className="flex items-center gap-1.5 border-r-2 border-mist py-2.5 pr-3 pl-4 text-ink">
        <BiMapPin className="h-4 w-4 shrink-0 text-tomato" />
        <span className="max-w-20 truncate text-xs font-bold sm:max-w-28">
          {city ?? "Locating…"}
        </span>
      </div>
      <div className="flex flex-1 items-center gap-2 px-3">
        <BiSearch className="h-4 w-4 shrink-0 text-smoke" />
        <input
          type="text"
          placeholder="Search restaurants, cravings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent py-2.5 text-sm font-medium outline-none placeholder:text-smoke/60"
        />
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-ink bg-cream/95 backdrop-blur-[2px]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3">
        <Link to="/" aria-label="Tomato home" className="shrink-0">
          <Logo size={34} wordmarkClassName="hidden xs:inline" />
        </Link>

        {isHomePage && (
          <div className="hidden max-w-lg flex-1 md:block">{searchBar}</div>
        )}

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <DemoChip />
          {isAuth && (
            <Link
              to="/orders"
              aria-label="Your orders"
              className="btn-secondary !rounded-full !p-2 sm:!p-2.5"
            >
              <BiReceipt className="h-5 w-5" />
            </Link>
          )}
          <CartButton quantity={quantity} />
          {isAuth ? (
            <Link
              to="/account"
              aria-label="Your account"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-tomato text-sm font-black text-white shadow-pop-xs transition-transform hover:-translate-0.5 hover:shadow-pop-sm sm:h-10 sm:w-10"
            >
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </Link>
          ) : (
            <Link to="/login" className="btn-primary !rounded-full">
              Log in
            </Link>
          )}
        </div>
      </div>
      {isHomePage && <div className="px-4 pb-3 md:hidden">{searchBar}</div>}
    </header>
  );
};

export default Navbar;
