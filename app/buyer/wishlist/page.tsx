"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { getWishlist, removeWishlist } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type WishlistItem = {
  product_id: string;
  name: string;
  base_price: number | string;
  added_at: string;
};

type WishlistResponse = {
  items?: WishlistItem[];
};

export default function BuyerWishlistPage() {
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadWishlist = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const data = (await getWishlist(token)) as WishlistResponse;
      setItems(data?.items || []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    if (!token) {
      return;
    }
    setStatus("");
    try {
      await removeWishlist(productId, token);
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Remove failed");
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== "buyer") {
      return;
    }
    loadWishlist();
  }, [token, user]);

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Wishlist</span>
              <h1 className="section-title font-display">Saved Products</h1>
              <p className="section-subtitle">
                Review products you want to revisit later.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        {!user || !token ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Buyer workspace</h2>
              <p className="panel-desc">
                Build a buyer profile to save favorites, track orders, and set alerts.
              </p>
            </div>
            <Link className="btn-primary" href="/login">
              Become a buyer
            </Link>
          </div>
        ) : null}

        {user && user.role !== "buyer" ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Switch to buyer profile</h2>
              <p className="panel-desc">
                Use a buyer profile to manage orders, alerts, and reviews.
              </p>
            </div>
            <Link className="btn-ghost" href="/login">
              Switch profile
            </Link>
          </div>
        ) : null}

        {user && user.role === "buyer" ? (
          <div className="stack">
            <div className="toolbar">
              <button className="btn-ghost" type="button" onClick={loadWishlist}>
                Refresh wishlist
              </button>
              {loading ? <span className="helper-text">Loading...</span> : null}
              {status ? <span className="helper-text">{status}</span> : null}
            </div>

            <div className="product-grid">
              {items.length ? (
                items.map((item) => (
                  <div key={item.product_id} className="card product-card">
                    <div>
                      <p className="helper-text">Product</p>
                      <Link href={`/products/${item.product_id}`}>
                        <h3 className="card-title font-display">{item.name}</h3>
                      </Link>
                      <p className="card-subtitle">
                        Added {formatDate(item.added_at)}
                      </p>
                    </div>
                    <div className="product-meta">
                      <span className="pill">{formatCurrency(item.base_price)}</span>
                      <button
                        className="btn-ghost"
                        type="button"
                        onClick={() => handleRemove(item.product_id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <p className="helper-text">No wishlist items yet.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function formatCurrency(value: number | string) {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return String(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
