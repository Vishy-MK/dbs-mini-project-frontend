"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { getSellerProfile, updateMe, updateSellerProfile } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type SellerProfile = {
  seller_id: string;
  store_name: string;
  store_description: string | null;
  payout_provider: string | null;
  payout_account: string | null;
};

type ProfileResponse = {
  profile: SellerProfile | null;
};

type UserResponse = {
  user: {
    id: string;
    email: string;
    role: "buyer" | "seller" | "admin";
  };
};

export default function SellerSettingsPage() {
  const { token } = useStoredToken();
  const { user, setUser } = useStoredUser();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [payoutProvider, setPayoutProvider] = useState("");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [payoutStatus, setPayoutStatus] = useState("");

  const loadProfile = async () => {
    if (!token) {
      return;
    }
    setProfileStatus("");
    try {
      const data = (await getSellerProfile(token)) as ProfileResponse;
      setProfile(data.profile || null);
      if (data.profile) {
        setStoreName(data.profile.store_name || "");
        setStoreDescription(data.profile.store_description || "");
        setPayoutProvider(data.profile.payout_provider || "");
        setPayoutAccount(data.profile.payout_account || "");
      }
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Load failed");
    }
  };

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!token || !user || user.role !== "seller") {
      return;
    }
    loadProfile();
  }, [token, user]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setProfileStatus("");
    try {
      const response = (await updateMe(email, token)) as UserResponse;
      if (response?.user) {
        setUser(response.user);
      }
      setProfileStatus("Email updated.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setPayoutStatus("");
    try {
      const data = (await updateSellerProfile(
        {
          store_name: storeName,
          store_description: storeDescription || null,
          payout_provider: payoutProvider || null,
          payout_account: payoutAccount || null,
        },
        token
      )) as ProfileResponse;
      setProfile(data.profile || null);
      setPayoutStatus("Profile saved.");
    } catch (error) {
      setPayoutStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Settings</span>
              <h1 className="section-title font-display">Seller Profile</h1>
              <p className="section-subtitle">
                Manage store details and payouts.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        {!user || !token ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Seller workspace</h2>
              <p className="panel-desc">
                Create a seller profile to publish listings, manage inventory, and
                fulfill orders.
              </p>
            </div>
            <Link className="btn-primary" href="/login">
              Start selling
            </Link>
          </div>
        ) : null}

        {user && user.role !== "seller" ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Switch to seller profile</h2>
              <p className="panel-desc">
                Use a seller profile to manage listings, inventory, and orders.
              </p>
            </div>
            <Link className="btn-ghost" href="/login">
              Switch profile
            </Link>
          </div>
        ) : null}

        {user && user.role === "seller" ? (
          <div className="stack">
            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Account</h3>
                <p className="panel-desc">Update your login email.</p>
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
                {profileStatus ? <p className="helper-text">{profileStatus}</p> : null}
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Store profile</h3>
                <p className="panel-desc">Tell buyers about your storefront.</p>
              </div>
              <form className="field-grid" onSubmit={handleProfileSubmit}>
                <input
                  className="input"
                  value={storeName}
                  onChange={(event) => setStoreName(event.target.value)}
                  placeholder="Store name"
                  required={!profile}
                />
                <textarea
                  className="input textarea"
                  value={storeDescription}
                  onChange={(event) => setStoreDescription(event.target.value)}
                  placeholder="Store description"
                  rows={4}
                />
                <input
                  className="input"
                  value={payoutProvider}
                  onChange={(event) => setPayoutProvider(event.target.value)}
                  placeholder="Payout provider"
                />
                <input
                  className="input"
                  value={payoutAccount}
                  onChange={(event) => setPayoutAccount(event.target.value)}
                  placeholder="Payout account"
                />
                <button className="btn-primary" type="submit">
                  Save profile
                </button>
                {payoutStatus ? <p className="helper-text">{payoutStatus}</p> : null}
              </form>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
