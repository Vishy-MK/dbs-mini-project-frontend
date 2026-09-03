"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopNav from "../_components/TopNav";
import { login } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useStoredToken();
  const { setUser } = useStoredUser();
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    try {
      const data = await login(email, password);
      setToken(data.token);
      setUser(data.user);
      const destination = `/${data.user.role}/dashboard`;
      setStatus("Logged in. Redirecting...");
      router.push(destination);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <span className="tag">Account</span>
          <h1 className="section-title font-display">Welcome back</h1>
          <p className="section-subtitle">
            Sign in to manage orders, listings, and your marketplace workspace.
          </p>
        </header>

        <section className="login-layout">
          <form
            className="login-card animate-rise"
            style={{ animationDelay: "0.1s" }}
            onSubmit={handleLogin}
          >
            <div className="login-card__header">
              <h2 className="login-card__title font-display">Sign in</h2>
              <p className="login-card__subtitle">
                Use your marketplace email and password.
              </p>
            </div>
            <div className="field-grid">
              <label className="field-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="you@marketplace.com"
                required
              />
            </div>
            <div className="field-grid">
              <label className="field-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
                required
              />
            </div>
            <div className="login-actions">
              <button className="btn-primary" type="submit">
                Sign in
              </button>
              <Link className="btn-ghost" href="/products">
                Browse products
              </Link>
            </div>
            {status ? <p className="helper-text">{status}</p> : null}
          </form>

          <aside
            className="login-card login-aside animate-rise"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="login-card__header">
              <h2 className="login-card__title font-display">Marketplace access</h2>
              <p className="login-card__subtitle">
                Tailored dashboards for every role.
              </p>
            </div>
            <div className="login-roles">
              <div className="login-role">
                <span className="badge">Buyer</span>
                <p className="login-role__copy">
                  Track orders, manage wishlists, and share reviews.
                </p>
              </div>
              <div className="login-role">
                <span className="badge">Seller</span>
                <p className="login-role__copy">
                  Publish listings, update inventory, and fulfill orders.
                </p>
              </div>
              <div className="login-role">
                <span className="badge">Admin</span>
                <p className="login-role__copy">
                  Monitor the marketplace and manage user access.
                </p>
              </div>
            </div>
            <div className="login-note">
              <p className="helper-text">
                Need access? Contact your marketplace administrator.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
