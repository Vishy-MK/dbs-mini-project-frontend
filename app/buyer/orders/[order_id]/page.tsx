"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TopNav from "../../../_components/TopNav";
import LogoutButton from "../../../_components/LogoutButton";
import { getOrder, getShippingByOrder } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type OrderResponse = Awaited<ReturnType<typeof getOrder>>;

type OrderItem = {
  order_item_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number | string;
  sku: string;
  attributes?: Array<{ name: string; value: string }>;
  product_id: string;
  product_name: string;
};

type Shipment = {
  shipping_id: string;
  carrier?: string | null;
  tracking_number?: string | null;
  status: string;
  estimated_delivery?: string | null;
};

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const orderId = String(params?.order_id || "");
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = async () => {
    if (!token || !orderId) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = (await getOrder(orderId, token)) as OrderResponse;
      setOrder(data);
      setItems((data as { items?: OrderItem[] })?.items || []);
      const shippingData = (await getShippingByOrder(orderId, token)) as {
        shipments?: Shipment[];
      };
      setShipments(shippingData?.shipments || []);
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
    loadOrder();
  }, [token, user, orderId]);

  const orderInfo = (order as { order?: { status?: string; created_at?: string; total_amount?: number | string } })
    ?.order;

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Order Detail</span>
              <h1 className="section-title font-display">Order #{orderId}</h1>
              <p className="section-subtitle">
                Review items, totals, and shipping progress.
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
              <Link className="btn-ghost" href="/buyer/orders">
                Back to orders
              </Link>
              <button className="btn-ghost" type="button" onClick={loadOrder}>
                Refresh
              </button>
              {loading ? <span className="helper-text">Loading...</span> : null}
              {error ? <span className="helper-text">{error}</span> : null}
            </div>

            <div className="panel-grid">
              <section className="panel">
                <div className="panel-header">
                  <h3 className="panel-title font-display">Order Summary</h3>
                  <p className="panel-desc">Status and totals.</p>
                </div>
                <div className="info-grid">
                  <div>
                    <p className="helper-text">Status</p>
                    <p className="metric-value">{formatStatus(orderInfo?.status)}</p>
                  </div>
                  <div>
                    <p className="helper-text">Placed</p>
                    <p className="metric-value">{formatDate(orderInfo?.created_at)}</p>
                  </div>
                  <div>
                    <p className="helper-text">Total</p>
                    <p className="metric-value">{formatCurrency(orderInfo?.total_amount)}</p>
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <h3 className="panel-title font-display">Shipping Status</h3>
                  <p className="panel-desc">Tracking details for this order.</p>
                </div>
                {shipments.length ? (
                  shipments.map((shipment) => (
                    <div key={shipment.shipping_id} className="info-card">
                      <div>
                        <p className="helper-text">Status</p>
                        <p className="metric-value">{formatStatus(shipment.status)}</p>
                      </div>
                      <div>
                        <p className="helper-text">Carrier</p>
                        <p>{shipment.carrier || "-"}</p>
                      </div>
                      <div>
                        <p className="helper-text">Tracking</p>
                        <p>{shipment.tracking_number || "-"}</p>
                      </div>
                      <div>
                        <p className="helper-text">ETA</p>
                        <p>{formatDate(shipment.estimated_delivery || "")}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="helper-text">No shipping updates yet.</p>
                )}
              </section>
            </div>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Items</h3>
                <p className="panel-desc">What is included in this order.</p>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Attributes</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length ? (
                      items.map((item) => (
                        <tr key={item.order_item_id}>
                          <td>{item.product_name}</td>
                          <td>{item.sku}</td>
                          <td>{formatAttributes(item.attributes)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="helper-text">
                          No items found.
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

function formatAttributes(value?: Array<{ name: string; value: string }>) {
  if (!value || !value.length) {
    return "-";
  }
  return value.map((attr) => `${attr.name}: ${attr.value}`).join(", ");
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

function formatDate(value?: string | null) {
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

function formatStatus(value?: string) {
  if (!value) {
    return "-";
  }
  return value.replace(/_/g, " ");
}
