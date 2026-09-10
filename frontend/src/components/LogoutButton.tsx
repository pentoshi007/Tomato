import { useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { useLogout } from "../hooks/useLogout";

interface LogoutButtonProps {
  before?: () => Promise<void> | void;
  className?: string;
  labelClassName?: string;
}

const LogoutButton = ({
  before,
  className = "",
  labelClassName = "hidden sm:inline",
}: LogoutButtonProps) => {
  const logout = useLogout();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    await logout(before);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label="Log out"
      className={`btn-secondary !py-2 !text-xs ${className}`}
    >
      <BiLogOut className="h-4 w-4" />
      <span className={labelClassName}>
        {busy ? "Logging out…" : "Log out"}
      </span>
    </button>
  );
};

export default LogoutButton;
