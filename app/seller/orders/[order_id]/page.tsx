"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TopNav from "../../../_components/TopNav";
import LogoutButton from "../../../_components/LogoutButton";
import {
  getOrder,
  getShippingByOrder,
  updateOrderStatus,
  updateShipping,
} from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type OrderInfo = {
  order_id: string;
  buyer_id: string;
  total_amount?: number | string;
  status: string;
  created_at: string;
};

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

type OrderResponse = {
  order: OrderInfo;
  items: OrderItem[];
};

type ShippingResponse = {
  shipments?: Shipment[];
};

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function SellerOrderDetailPage() {
  const params = useParams();
  const orderId = String(params?.order_id || "");
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orderStatus, setOrderStatus] = useState("");
  const [shippingStatus, setShippingStatus] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOrder = async () => {
    if (!token || !orderId) {
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const data = (await getOrder(orderId, token)) as OrderResponse;
      setOrder(data.order);
      setItems(data.items || []);
      setOrderStatus(data.order?.status || "");
      const shippingData = (await getShippingByOrder(orderId, token)) as ShippingResponse;
      const loadedShipments = shippingData?.shipments || [];
      setShipments(loadedShipments);
      if (loadedShipments.length) {
        const shipment = loadedShipments[0];
        setShippingStatus(shipment.status || "");
        setCarrier(shipment.carrier || "");
        setTrackingNumber(shipment.tracking_number || "");
        setEstimatedDelivery(toDateInput(shipment.estimated_delivery));
      } else {
        setShippingStatus("");
        setCarrier("");
        setTrackingNumber("");
        setEstimatedDelivery("");
      }
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
    loadOrder();
  }, [token, user, orderId]);

  const handleOrderStatusSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !orderId) {
      return;
    }
    setStatus("");
    try {
      const data = (await updateOrderStatus(orderId, orderStatus, token)) as OrderResponse;
      setOrder(data.order || order);
      setStatus("Order status updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const handleShippingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !shipments.length) {
      return;
    }
    setStatus("");
    try {
      await updateShipping(
        shipments[0].shipping_id,
        {
          carrier: carrier || undefined,
          tracking_number: trackingNumber || undefined,
          status: shippingStatus,
          estimated_delivery: estimatedDelivery || undefined,
        },
        token
      );
      setStatus("Shipping updated.");
      await loadOrder();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
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
              <span className="tag">Order Detail</span>
              <h1 className="section-title font-display">Order #{orderId}</h1>
              <p className="section-subtitle">
                Update fulfillment and shipping details.
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
              <Link className="btn-ghost" href="/seller/orders">
                Back to orders
              </Link>
              <button className="btn-ghost" type="button" onClick={loadOrder}>
                Refresh
              </button>
              {loading ? <span className="helper-text">Loading...</span> : null}
              {status ? <span className="helper-text">{status}</span> : null}
            </div>

            <div className="panel-grid">
              <section className="panel">
                <div className="panel-header">
                  <h3 className="panel-title font-display">Order summary</h3>
                  <p className="panel-desc">Buyer and order totals.</p>
                </div>
                <div className="info-grid">
                  <div>
                    <p className="helper-text">Buyer</p>
                    <p className="metric-value">{order?.buyer_id || "-"}</p>
                  </div>
                  <div>
                    <p className="helper-text">Placed</p>
                    <p className="metric-value">{formatDate(order?.created_at)}</p>
                  </div>
                  <div>
                    <p className="helper-text">Total</p>
                    <p className="metric-value">{formatCurrency(order?.total_amount)}</p>
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <h3 className="panel-title font-display">Order status</h3>
                  <p className="panel-desc">Set the latest status.</p>
                </div>
                <form className="field-grid" onSubmit={handleOrderStatusSubmit}>
                  <select
                    className="input"
                    value={orderStatus}
                    onChange={(event) => setOrderStatus(event.target.value)}
                  >
                    {orderStatus && !STATUS_OPTIONS.includes(orderStatus) ? (
                      <option value={orderStatus}>{orderStatus}</option>
                    ) : null}
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary" type="submit">
                    Update status
                  </button>
                </form>
              </section>
            </div>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Shipping</h3>
                <p className="panel-desc">Add tracking and updates.</p>
              </div>
              {shipments.length ? (
                <form className="field-grid" onSubmit={handleShippingSubmit}>
                  <input
                    className="input"
                    value={carrier}
                    onChange={(event) => setCarrier(event.target.value)}
                    placeholder="Carrier"
                  />
                  <input
                    className="input"
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    placeholder="Tracking number"
                  />
                  <input
                    className="input"
                    value={shippingStatus}
                    onChange={(event) => setShippingStatus(event.target.value)}
                    placeholder="Shipping status"
                    required
                  />
                  <input
                    className="input"
                    type="date"
                    value={estimatedDelivery}
                    onChange={(event) => setEstimatedDelivery(event.target.value)}
                    placeholder="Estimated delivery"
                  />
                  <button className="btn-primary" type="submit">
                    Save shipping
                  </button>
                </form>
              ) : (
                <p className="helper-text">
                  No shipping record yet. Shipping is created when an address is attached.
                </p>
              )}
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Items</h3>
                <p className="panel-desc">Line items in this order.</p>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Attributes</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length ? (
                      items.map((item) => (
                        <tr key={item.order_item_id}>
                          <td>{item.product_name}</td>
                          <td>{item.sku}</td>
                          <td>{attributesToString(item.attributes)}</td>
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

function formatDate(value?: string) {
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

function attributesToString(
  value?: Array<{ name: string; value: string }>
) {
  if (!value || !value.length) {
    return "-";
  }
  return value.map((attr) => `${attr.name}: ${attr.value}`).join(", ");
}

function toDateInput(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
