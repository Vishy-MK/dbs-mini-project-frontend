"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBuyerDashboard } from "@/lib/api";
import { useStoredUser } from "@/lib/useStoredUser";

type BuyerDashboardResponse = Awaited<ReturnType<typeof getBuyerDashboard>>;

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="card">
      <p className="metric-label">{label}</p>
      <p className="metric-value font-display">{value}</p>
    </div>
  );
}

export default function BuyerDashboardView() {
  const router = useRouter();
  const { user } = useStoredUser();
  const [data, setData] = useState<BuyerDashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) {
        return;
      }
      if (user.role !== "buyer") {
        setError("Buyer access only.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const result = await getBuyerDashboard(user.id);
        if (active) {
          setData(result);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Load failed");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [user]);

  const metrics = data?.metrics;

  return (
    <section className="stack">
      {!user ? (
        <div className="card field-grid">
          <div className="panel-header">
            <h2 className="panel-title font-display">Buyer dashboard</h2>
            <p className="panel-desc">
              Build a buyer profile to view orders, alerts, and reviews.
            </p>
          </div>
          <button className="btn-primary" type="button" onClick={() => router.push("/login")}>
            Become a buyer
          </button>
        </div>
      ) : null}
      {user && user.role !== "buyer" ? (
        <div className="card field-grid">
          <div className="panel-header">
            <h2 className="panel-title font-display">Switch to buyer profile</h2>
            <p className="panel-desc">Use a buyer profile to view this dashboard.</p>
          </div>
          <button className="btn-ghost" type="button" onClick={() => router.push("/login")}>
            Switch profile
          </button>
        </div>
      ) : null}
      {loading ? <p className="helper-text">Loading dashboard...</p> : null}
      {error && user?.role === "buyer" ? <p className="helper-text">{error}</p> : null}

      <div className="stats-grid">
        <MetricCard
          label="Total Orders"
          value={formatNumber(metrics?.total_orders)}
        />
        <MetricCard
          label="Wishlist Items"
          value={formatNumber(metrics?.wishlist_items)}
        />
        <MetricCard
          label="Active Alerts"
          value={formatNumber(metrics?.active_alerts)}
        />
        <MetricCard
          label="Pending Reviews"
          value={formatNumber(metrics?.pending_reviews)}
        />
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Recent Purchases</h3>
            <p className="panel-desc">Latest orders you have placed.</p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_orders?.length ? (
                  data.recent_orders.map((order) => (
                    <tr key={order.order_id}>
                      <td>
                        #{order.order_id}
                        <div className="helper-text">{formatDate(order.created_at)}</div>
                      </td>
                      <td>{order.product_name}</td>
                      <td>{order.quantity}</td>
                      <td>{order.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="helper-text">
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Wishlist</h3>
            <p className="panel-desc">Most recent wishlist additions.</p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {data?.wishlist?.length ? (
                  data.wishlist.map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.product_name}</td>
                      <td>{formatCurrency(item.base_price)}</td>
                      <td>{formatDate(item.added_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="helper-text">
                      No wishlist items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Active Alerts</h3>
            <p className="panel-desc">Alerts that match your preferences.</p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Category</th>
                  <th>Max Price</th>
                </tr>
              </thead>
              <tbody>
                {data?.alerts?.length ? (
                  data.alerts.map((alert) => (
                    <tr key={alert.alert_id}>
                      <td>{alert.keyword}</td>
                      <td>{alert.category_id ?? "Any"}</td>
                      <td>{alert.max_price ? formatCurrency(alert.max_price) : "Any"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="helper-text">
                      No active alerts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Quick Access</h3>
            <p className="panel-desc">Jump to your workspace.</p>
          </div>
          <div className="field-grid">
            <button
              className="btn-secondary"
              type="button"
              disabled={!user || user.role !== "buyer"}
              onClick={() => router.push("/buyer/workspace")}
            >
              Open workspace
            </button>
            {!user ? (
              <p className="helper-text">Create a buyer profile to use actions.</p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

function formatNumber(value: number | string | undefined) {
  if (value === undefined || value === null) {
    return "0";
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return String(value);
  }
  return new Intl.NumberFormat("en-US").format(num);
}

function formatCurrency(value: number | string | null | undefined) {
  if (value === undefined || value === null) {
    return "$0.00";
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return String(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function formatDate(value: string) {
  if (!value) {
    return "";
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
