"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ems_auth_token";

export function useStoredToken() {
  const [token, setTokenState] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTokenState(stored);
    }
  }, []);

  const setToken = (value: string) => {
    setTokenState(value);
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  };

  return { token, setToken };
}
