"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { createAlert, deleteAlert, getAlerts, updateAlert } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type Alert = {
  alert_id: string;
  keyword: string | null;
  category_id: string | null;
  max_price: number | string | null;
  created_at: string;
};

type AlertsResponse = {
  alerts?: Alert[];
};

export default function BuyerAlertsPage() {
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");

  const loadAlerts = async () => {
    if (!token) {
      return;
    }
    setStatus("");
    try {
      const data = (await getAlerts(token)) as AlertsResponse;
      setAlerts(data?.alerts || []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== "buyer") {
      return;
    }
    loadAlerts();
  }, [token, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setStatus("");
    try {
      if (editingId) {
        await updateAlert(
          editingId,
          {
            keyword: keyword || undefined,
            category_id: categoryId || null,
            max_price: maxPrice ? Number(maxPrice) : null,
          },
          token
        );
      } else {
        await createAlert(
          keyword,
          categoryId || undefined,
          maxPrice ? Number(maxPrice) : undefined,
          token
        );
      }
      setKeyword("");
      setCategoryId("");
      setMaxPrice("");
      setEditingId("");
      await loadAlerts();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const handleEdit = (alert: Alert) => {
    setEditingId(alert.alert_id);
    setKeyword(alert.keyword || "");
    setCategoryId(alert.category_id || "");
    setMaxPrice(alert.max_price ? String(alert.max_price) : "");
    setStatus("Editing alert. Submit to save changes.");
  };

  const handleDelete = async (alertId: string) => {
    if (!token) {
      return;
    }
    setStatus("");
    try {
      await deleteAlert(alertId, token);
      setAlerts((prev) => prev.filter((alert) => alert.alert_id !== alertId));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Alerts</span>
              <h1 className="section-title font-display">Notification Rules</h1>
              <p className="section-subtitle">
                Stay updated when listings match your preferences.
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
            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">
                  {editingId ? "Update alert" : "Create alert"}
                </h3>
                <p className="panel-desc">
                  Track keywords, categories, and price caps.
                </p>
              </div>
              <form className="field-grid" onSubmit={handleSubmit}>
                <input
                  className="input"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Keyword"
                  required
                />
                <input
                  className="input"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  placeholder="Category ID (optional)"
                />
                <input
                  className="input"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="Max price (optional)"
                />
                <div className="toolbar">
                  <button className="btn-primary" type="submit">
                    {editingId ? "Save alert" : "Create alert"}
                  </button>
                  {editingId ? (
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        setEditingId("");
                        setKeyword("");
                        setCategoryId("");
                        setMaxPrice("");
                        setStatus("");
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
              {status ? <p className="helper-text">{status}</p> : null}
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Saved alerts</h3>
                <p className="panel-desc">Current notification rules.</p>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Keyword</th>
                      <th>Category</th>
                      <th>Max Price</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.length ? (
                      alerts.map((alert) => (
                        <tr key={alert.alert_id}>
                          <td>{alert.keyword || "-"}</td>
                          <td>{alert.category_id || "Any"}</td>
                          <td>{alert.max_price ? formatCurrency(alert.max_price) : "Any"}</td>
                          <td>{formatDate(alert.created_at)}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-ghost"
                                type="button"
                                onClick={() => handleEdit(alert)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-ghost"
                                type="button"
                                onClick={() => handleDelete(alert.alert_id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="helper-text">
                          No alerts configured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
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
