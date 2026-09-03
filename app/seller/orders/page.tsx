"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { getOrders } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type OrderRow = {
  order_id: string;
  buyer_id: string;
  status: string;
  created_at: string;
  total_units?: number | string;
  seller_total?: number | string;
};

type OrdersResponse = {
  orders?: OrderRow[];
};

export default function SellerOrdersPage() {
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const data = (await getOrders(token)) as OrdersResponse;
      setOrders(data?.orders || []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== "seller") {
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
              <span className="tag">Orders</span>
              <h1 className="section-title font-display">Fulfillment Queue</h1>
              <p className="section-subtitle">
                Manage buyer orders for your listings.
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
            <div className="toolbar">
              <button className="btn-ghost" type="button" onClick={loadOrders}>
                Refresh
              </button>
              {loading ? <span className="helper-text">Loading...</span> : null}
              {status ? <span className="helper-text">{status}</span> : null}
            </div>

            <div className="table-wrapper card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Buyer</th>
                    <th>Status</th>
                    <th>Units</th>
                    <th>Subtotal</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length ? (
                    orders.map((order) => (
                      <tr key={order.order_id}>
                        <td>
                          <Link href={`/seller/orders/${order.order_id}`}>
                            #{order.order_id}
                          </Link>
                        </td>
                        <td>{order.buyer_id}</td>
                        <td>{formatStatus(order.status)}</td>
                        <td>{order.total_units ?? "-"}</td>
                        <td>{formatCurrency(order.seller_total)}</td>
                        <td>{formatDate(order.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="helper-text">
                        No orders yet.
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
