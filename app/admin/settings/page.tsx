"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { updateMe } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type UserResponse = {
  user: {
    id: string;
    email: string;
    role: "buyer" | "seller" | "admin";
  };
};

export default function AdminSettingsPage() {
  const { token } = useStoredToken();
  const { user, setUser } = useStoredUser();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setStatus("");
    try {
      const response = (await updateMe(email, token)) as UserResponse;
      if (response?.user) {
        setUser(response.user);
      }
      setStatus("Account updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Settings</span>
              <h1 className="section-title font-display">Admin Preferences</h1>
              <p className="section-subtitle">
                Update your account details and manage your session.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        {!user || !token ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Admin command center</h2>
              <p className="panel-desc">
                Create an admin profile to oversee users, listings, and policies.
              </p>
            </div>
            <Link className="btn-primary" href="/login">
              Open admin console
            </Link>
          </div>
        ) : null}

        {user && user.role !== "admin" ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Switch to admin profile</h2>
              <p className="panel-desc">
                Use an admin profile to access admin settings.
              </p>
            </div>
            <Link className="btn-ghost" href="/login">
              Switch profile
            </Link>
          </div>
        ) : null}

        {user && user.role === "admin" ? (
          <div className="stack">
            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Account</h3>
                <p className="panel-desc">Keep your admin email up to date.</p>
              </div>
              <form className="field-grid" onSubmit={handleEmailSubmit}>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  required
                />
                <button className="btn-primary" type="submit">
                  Save email
                </button>
                {status ? <p className="helper-text">{status}</p> : null}
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Session</h3>
                <p className="panel-desc">Sign out of the admin console.</p>
              </div>
              <div className="toolbar">
                <LogoutButton className="btn-ghost" label="Sign out" />
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
