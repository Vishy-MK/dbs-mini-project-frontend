"use client";

import { useEffect, useState } from "react";
import type { ChartOptions } from "chart.js";
import { useRouter } from "next/navigation";
import { getSellerDashboard } from "@/lib/api";
import { useStoredUser } from "@/lib/useStoredUser";
import { Bar, Doughnut } from "./Charts";

type SellerDashboardResponse = Awaited<ReturnType<typeof getSellerDashboard>>;

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

export default function SellerDashboardView() {
  const router = useRouter();
  const { user } = useStoredUser();
  const [data, setData] = useState<SellerDashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) {
        return;
      }
      if (user.role !== "seller") {
        setError("Seller access only.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const result = await getSellerDashboard(user.id);
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
  const metricSeries = [
    {
      label: "Items Sold",
      value: toNumber(metrics?.total_items_sold),
    },
    {
      label: "Revenue",
      value: toNumber(metrics?.total_revenue),
    },
    {
      label: "Active Listings",
      value: toNumber(metrics?.active_listings),
    },
    {
      label: "Pending Orders",
      value: toNumber(metrics?.pending_orders),
    },
  ];
  const performanceData = {
    labels: metricSeries.map((item) => item.label),
    datasets: [
      {
        label: "Totals",
        data: metricSeries.map((item) => item.value),
        backgroundColor: ["#ff6a3d", "#2e7bd4", "#0f6b6b", "#f0b24d"],
        borderRadius: 10,
      },
    ],
  };

  const statusLabels = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const statusCounts = buildStatusCounts(data?.recent_orders ?? [], statusLabels);
  const orderMixData = {
    labels: statusLabels.map(toTitleCase),
    datasets: [
      {
        data: statusCounts,
        backgroundColor: ["#ff6a3d", "#2e7bd4", "#0f6b6b", "#f0b24d", "#9c7a6e"],
        borderColor: "rgba(255, 255, 255, 0.6)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <section className="stack">
      {!user ? (
        <div className="card field-grid">
          <div className="panel-header">
            <h2 className="panel-title font-display">Seller dashboard</h2>
            <p className="panel-desc">
              Create a seller profile to view metrics and orders.
            </p>
          </div>
          <button className="btn-primary" type="button" onClick={() => router.push("/login")}>
            Start selling
          </button>
        </div>
      ) : null}
      {user && user.role !== "seller" ? (
        <div className="card field-grid">
          <div className="panel-header">
            <h2 className="panel-title font-display">Switch to seller profile</h2>
            <p className="panel-desc">Use a seller profile to view this dashboard.</p>
          </div>
          <button className="btn-ghost" type="button" onClick={() => router.push("/login")}>
            Switch profile
          </button>
        </div>
      ) : null}
      {loading ? <p className="helper-text">Loading dashboard...</p> : null}
      {error && user?.role === "seller" ? <p className="helper-text">{error}</p> : null}

      <div className="stats-grid">
        <MetricCard
          label="Total Items Sold"
          value={formatNumber(metrics?.total_items_sold)}
        />
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics?.total_revenue)}
        />
        <MetricCard
          label="Active Listings"
          value={formatNumber(metrics?.active_listings)}
        />
        <MetricCard
          label="Pending Orders"
          value={formatNumber(metrics?.pending_orders)}
        />
      </div>

      <div className="chart-grid">
        <section className="panel chart-panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Performance Snapshot</h3>
            <p className="panel-desc">Sales, revenue, and listings at a glance.</p>
          </div>
          <div className="chart-canvas">
            <Bar data={performanceData} options={barOptions} />
          </div>
        </section>
        <section className="panel chart-panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Order Mix</h3>
            <p className="panel-desc">Recent order status distribution.</p>
          </div>
          <div className="chart-canvas">
            <Doughnut data={orderMixData} options={doughnutOptions} />
          </div>
        </section>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Recent Orders</h3>
            <p className="panel-desc">Latest orders placed for your listings.</p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Buyer</th>
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
                      <td>
                        {order.buyer_email}
                      </td>
                      <td>{order.product_name}</td>
                      <td>{order.quantity}</td>
                      <td>{order.status}</td>
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
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Quick Actions</h3>
            <p className="panel-desc">Jump to your workspace actions.</p>
          </div>
          <div className="field-grid">
            <button
              className="btn-secondary"
              type="button"
              disabled={!user || user.role !== "seller"}
              onClick={() => router.push("/seller/workspace")}
            >
              Add New Product
            </button>
            <button
              className="btn-ghost"
              type="button"
              disabled={!user || user.role !== "seller"}
              onClick={() => router.push("/seller/workspace")}
            >
              Manage Listings
            </button>
            {!user ? (
              <p className="helper-text">Create a seller profile to use actions.</p>
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

function formatCurrency(value: number | string | undefined) {
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

function toNumber(value: number | string | undefined) {
  if (value === undefined || value === null) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
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

function buildStatusCounts(
  orders: Array<{ status: string }>,
  statusLabels: string[]
) {
  const counts = statusLabels.map(() => 0);
  orders.forEach((order) => {
    const index = statusLabels.indexOf(order.status);
    if (index >= 0) {
      counts[index] += 1;
    }
  });
  return counts;
}

function toTitleCase(value: string) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#4f4a45",
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: "rgba(20, 17, 15, 0.08)",
      },
      ticks: {
        color: "#4f4a45",
      },
    },
  },
};

const doughnutOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "58%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "#4f4a45",
        padding: 12,
      },
    },
  },
};
