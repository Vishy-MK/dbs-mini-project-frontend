"use client";

import { useRouter } from "next/navigation";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type LogoutButtonProps = {
  className?: string;
  label?: string;
};

export default function LogoutButton({
  className = "btn-ghost",
  label = "Logout",
}: LogoutButtonProps) {
  const router = useRouter();
  const { setToken } = useStoredToken();
  const { setUser } = useStoredUser();

  const handleLogout = () => {
    setToken("");
    setUser(null);
    router.push("/login");
  };

  return (
    <button className={className} type="button" onClick={handleLogout}>
      {label}
    </button>
  );
}
