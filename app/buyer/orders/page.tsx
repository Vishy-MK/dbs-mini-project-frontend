"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { getOrders } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type OrdersResponse = Awaited<ReturnType<typeof getOrders>>;

type OrderRow = {
  order_id: string;
  status: string;
  total_amount?: number | string;
  created_at: string;
  line_items?: number | string;
};

export default function BuyerOrdersPage() {
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = (await getOrders(token)) as OrdersResponse;
      setOrders((data as { orders?: OrderRow[] })?.orders || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== "buyer") {
      return;
    }
    loadOrders();
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
              <span className="tag">Your Orders</span>
              <h1 className="section-title font-display">Order History</h1>
              <p className="section-subtitle">
                Track every purchase and monitor fulfillment status.
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
              <button className="btn-ghost" type="button" onClick={loadOrders}>
                Refresh orders
              </button>
              {loading ? <span className="helper-text">Loading orders...</span> : null}
              {error ? <span className="helper-text">{error}</span> : null}
            </div>

            <div className="table-wrapper card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length ? (
                    orders.map((order) => (
                      <tr key={order.order_id}>
                        <td>
                          <Link href={`/buyer/orders/${order.order_id}`}>
                            #{order.order_id}
                          </Link>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>{formatStatus(order.status)}</td>
                        <td>{formatCurrency(order.total_amount)}</td>
                        <td>{order.line_items ?? "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="helper-text">
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function formatCurrency(value?: number | string) {
  if (value === undefined || value === null) {
    return "-";
  }
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

function formatStatus(value: string) {
  if (!value) {
    return "-";
  }
  return value.replace(/_/g, " ");
}
