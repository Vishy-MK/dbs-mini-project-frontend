"use client";

import { useEffect, useState } from "react";

type StoredUser = {
  id: string;
  email: string;
  role: "buyer" | "seller" | "admin";
};

const STORAGE_KEY = "ems_user";

export function useStoredUser() {
  const [user, setUserState] = useState<StoredUser | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      setUserState(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setUser = (value: StoredUser | null) => {
    setUserState(value);
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  };

  return { user, setUser };
}
