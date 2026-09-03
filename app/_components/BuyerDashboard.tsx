"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Panel from "./Panel";
import {
  addWishlist,
  createAlert,
  createOrder,
  createReview,
  getOrders,
  getProductVariants,
  getProducts,
  getWishlist,
} from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type ProductRow = {
  product_id: string;
  name: string;
  base_price: number | string;
  category_name?: string | null;
};

type ProductsResponse = {
  products?: ProductRow[];
};

type WishlistItem = {
  product_id: string;
  name: string;
  base_price: number | string;
  added_at: string;
};

type WishlistResponse = {
  items?: WishlistItem[];
};

type WishlistAddResponse = {
  status?: string;
};

type VariantRow = {
  variant_id: string;
  sku: string;
  stock_quantity: number | string;
  price_modifier: number | string;
  attributes?: Array<{ name: string; value: string }>;
};

type VariantsResponse = {
  variants?: VariantRow[];
};

type OrderRow = {
  order_id: string;
  status: string;
  created_at: string;
  total_amount?: number | string;
  line_items?: number | string;
};

type OrdersResponse = {
  orders?: OrderRow[];
};

type OrderCreateResponse = {
  order?: {
    order_id?: string;
  };
};

type AlertCreateResponse = {
  alert?: {
    alert_id?: string;
  };
};

export default function BuyerDashboard() {
  const router = useRouter();
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductRow[]>([]);
  const [productStatus, setProductStatus] = useState("");
  const [wishlistProductId, setWishlistProductId] = useState("");
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistStatus, setWishlistStatus] = useState("");
  const [variantProductId, setVariantProductId] = useState("");
  const [variantResults, setVariantResults] = useState<VariantRow[]>([]);
  const [variantStatus, setVariantStatus] = useState("");
  const [orderVariantId, setOrderVariantId] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [orderResults, setOrderResults] = useState<OrderRow[]>([]);
  const [orderStatus, setOrderStatus] = useState("");
  const [reviewProductId, setReviewProductId] = useState("");
  const [reviewRating, setReviewRating] = useState("4");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [alertKeyword, setAlertKeyword] = useState("");
  const [alertCategoryId, setAlertCategoryId] = useState("");
  const [alertMaxPrice, setAlertMaxPrice] = useState("");
  const [alertStatus, setAlertStatus] = useState("");

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const data = (await getProducts({
        q: productQuery.trim() || undefined,
      })) as ProductsResponse;
      const products = data?.products || [];
      setProductResults(products);
      setProductStatus(
        products.length ? `Found ${products.length} listings.` : "No listings found."
      );
    } catch (error) {
      setProductStatus(formatError(error));
    }
  };

  const handleWishlistAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setWishlistStatus("Missing token");
      return;
    }
    const productId = parseUuid(wishlistProductId, "Product ID", setWishlistStatus);
    if (!productId) {
      return;
    }
    try {
      const data = (await addWishlist(productId, token)) as WishlistAddResponse;
      if (data?.status === "exists") {
        setWishlistStatus("Already in wishlist.");
      } else {
        setWishlistStatus("Added to wishlist.");
      }
      handleWishlistLoad();
    } catch (error) {
      setWishlistStatus(formatError(error));
    }
  };

  const handleWishlistLoad = async () => {
    if (!token) {
      setWishlistStatus("Missing token");
      return;
    }
    try {
      const data = (await getWishlist(token)) as WishlistResponse;
      const items = data?.items || [];
      setWishlistItems(items);
      setWishlistStatus(
        items.length ? `Loaded ${items.length} wishlist items.` : "No wishlist items."
      );
    } catch (error) {
      setWishlistStatus(formatError(error));
    }
  };

  const handleOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setOrderStatus("Missing token");
      return;
    }
    const variantId = parseUuid(orderVariantId, "Variant ID", setOrderStatus);
    const quantity = parsePositiveInt(orderQuantity, "Quantity", setOrderStatus);
    if (!variantId || !quantity) {
      return;
    }
    try {
      const data = (await createOrder(
        [{ variant_id: variantId, quantity }],
        token
      )) as OrderCreateResponse;
      const orderId = data?.order?.order_id;
      setOrderStatus(orderId ? `Order placed: #${orderId}` : "Order placed.");
      handleLoadOrders();
    } catch (error) {
      setOrderStatus(formatError(error));
    }
  };

  const handleLoadOrders = async () => {
    if (!token) {
      setOrderStatus("Missing token");
      return;
    }
    try {
      const data = (await getOrders(token)) as OrdersResponse;
      const orders = data?.orders || [];
      setOrderResults(orders);
      setOrderStatus(
        orders.length ? `Loaded ${orders.length} orders.` : "No orders found."
      );
    } catch (error) {
      setOrderStatus(formatError(error));
    }
  };

  const handleReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setReviewStatus("Missing token");
      return;
    }
    const productId = parseUuid(reviewProductId, "Product ID", setReviewStatus);
    const rating = parsePositiveInt(reviewRating, "Rating", setReviewStatus);
    if (!productId || !rating) {
      return;
    }
    if (rating < 1 || rating > 5) {
      setReviewStatus("Rating must be between 1 and 5");
      return;
    }
    try {
      await createReview(productId, rating, reviewComment, token);
      setReviewStatus("Review submitted.");
    } catch (error) {
      setReviewStatus(formatError(error));
    }
  };

  const handleAlert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setAlertStatus("Missing token");
      return;
    }
    try {
      const categoryId = alertCategoryId
        ? parseUuid(alertCategoryId, "Category ID", setAlertStatus)
        : undefined;
      if (alertCategoryId && !categoryId) {
        return;
      }
      const data = (await createAlert(
        alertKeyword,
        categoryId,
        alertMaxPrice ? Number(alertMaxPrice) : undefined,
        token
      )) as AlertCreateResponse;
      const alertId = data?.alert?.alert_id;
      setAlertStatus(alertId ? "Alert created." : "Alert saved.");
    } catch (error) {
      setAlertStatus(formatError(error));
    }
  };

  if (!token || !user) {
    return (
      <div className="card field-grid">
        <div className="panel-header">
          <h2 className="panel-title font-display">Buyer workspace</h2>
          <p className="panel-desc">
            Build a buyer profile to save favorites, track orders, and set alerts.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => router.push("/login")}>
          Become a buyer
        </button>
      </div>
    );
  }

  if (user.role !== "buyer") {
    return (
      <div className="card field-grid">
        <div className="panel-header">
          <h2 className="panel-title font-display">Switch to buyer profile</h2>
          <p className="panel-desc">
            Use a buyer profile to manage orders, alerts, and reviews.
          </p>
        </div>
        <button className="btn-ghost" type="button" onClick={() => router.push("/login")}>
          Switch profile
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="panel-grid">
        <Panel
          title="Browse products"
          description="Search listings without leaving your workspace."
          delay="0.1s"
        >
          <form className="field-grid" onSubmit={handleSearch}>
            <input
              className="input"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              placeholder="Search keywords"
            />
            <button className="btn-secondary" type="submit">
              Search listings
            </button>
          </form>
          {productStatus ? <p className="helper-text">{productStatus}</p> : null}
          {productResults.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {productResults.slice(0, 10).map((product) => (
                    <tr key={product.product_id}>
                      <td>{product.name}</td>
                      <td>{product.category_name || "-"}</td>
                      <td>{formatCurrency(product.base_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {productResults.length > 10 ? (
            <p className="helper-text">
              Showing first 10 of {productResults.length} listings.
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Wishlist"
          description="Save products and revisit them later."
          delay="0.2s"
        >
          <form className="field-grid" onSubmit={handleWishlistAdd}>
            <input
              className="input"
              value={wishlistProductId}
              onChange={(event) => setWishlistProductId(event.target.value)}
              placeholder="Product ID"
            />
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" type="submit">
                Add to wishlist
              </button>
              <button className="btn-ghost" type="button" onClick={handleWishlistLoad}>
                Load wishlist
              </button>
            </div>
          </form>
          {wishlistStatus ? <p className="helper-text">{wishlistStatus}</p> : null}
          {wishlistItems.length ? (
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
                  {wishlistItems.slice(0, 10).map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.name}</td>
                      <td>{formatCurrency(item.base_price)}</td>
                      <td>{formatDate(item.added_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Orders"
          description="Place orders and review your purchase history."
          delay="0.3s"
        >
          <div className="field-grid">
            <input
              className="input"
              value={variantProductId}
              onChange={(event) => setVariantProductId(event.target.value)}
              placeholder="Product ID to load variants"
            />
            <button
              className="btn-ghost"
              type="button"
              onClick={async () => {
                if (!variantProductId) {
                  setVariantStatus("Product ID is required");
                  return;
                }
                const productId = parseUuid(
                  variantProductId,
                  "Product ID",
                  setVariantStatus
                );
                if (!productId) {
                  return;
                }
                try {
                  const data = (await getProductVariants(
                    productId
                  )) as VariantsResponse;
                  const variants = data?.variants || [];
                  setVariantResults(variants);
                  setVariantStatus(
                    variants.length
                      ? `Loaded ${variants.length} variants.`
                      : "No variants found."
                  );
                } catch (error) {
                  setVariantStatus(formatError(error));
                }
              }}
            >
              Load variants
            </button>
          </div>
          {variantStatus ? <p className="helper-text">{variantStatus}</p> : null}
          {variantResults.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Attributes</th>
                    <th>Stock</th>
                    <th>Price Mod</th>
                    <th>Variant ID</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {variantResults.slice(0, 10).map((variant) => (
                    <tr key={variant.variant_id}>
                      <td>{variant.sku}</td>
                      <td>{formatAttributes(variant.attributes)}</td>
                      <td>{variant.stock_quantity}</td>
                      <td>{formatCurrency(variant.price_modifier)}</td>
                      <td>{variant.variant_id}</td>
                      <td>
                        <button
                          className="btn-ghost"
                          type="button"
                          onClick={() => {
                            setOrderVariantId(variant.variant_id);
                            setOrderQuantity("1");
                          }}
                        >
                          Use
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <form className="field-grid" onSubmit={handleOrder}>
            <input
              className="input"
              value={orderVariantId}
              onChange={(event) => setOrderVariantId(event.target.value)}
              placeholder="Variant ID"
            />
            <input
              className="input"
              value={orderQuantity}
              onChange={(event) => setOrderQuantity(event.target.value)}
              placeholder="Quantity"
            />
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" type="submit">
                Place order
              </button>
              <button className="btn-ghost" type="button" onClick={handleLoadOrders}>
                Load orders
              </button>
            </div>
          </form>
          {orderStatus ? <p className="helper-text">{orderStatus}</p> : null}
          {orderResults.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {orderResults.slice(0, 10).map((order) => (
                    <tr key={order.order_id}>
                      <td>#{order.order_id}</td>
                      <td>{order.status}</td>
                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>{order.line_items ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Reviews"
          description="Share feedback on your purchases."
          delay="0.4s"
        >
          <form className="field-grid" onSubmit={handleReview}>
            <input
              className="input"
              value={reviewProductId}
              onChange={(event) => setReviewProductId(event.target.value)}
              placeholder="Product ID"
            />
            <input
              className="input"
              value={reviewRating}
              onChange={(event) => setReviewRating(event.target.value)}
              placeholder="Rating (1-5)"
            />
            <textarea
              className="textarea"
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="Comment"
            />
            <button className="btn-secondary" type="submit">
              Submit review
            </button>
          </form>
          {reviewStatus ? <p className="helper-text">{reviewStatus}</p> : null}
        </Panel>

        <Panel
          title="Alerts"
          description="Set alerts for keywords, categories, and price caps."
          delay="0.5s"
        >
          <form className="field-grid" onSubmit={handleAlert}>
            <input
              className="input"
              value={alertKeyword}
              onChange={(event) => setAlertKeyword(event.target.value)}
              placeholder="Keywords"
            />
            <input
              className="input"
              value={alertCategoryId}
              onChange={(event) => setAlertCategoryId(event.target.value)}
              placeholder="Category ID (optional)"
            />
            <input
              className="input"
              value={alertMaxPrice}
              onChange={(event) => setAlertMaxPrice(event.target.value)}
              placeholder="Max price (optional)"
            />
            <button className="btn-secondary" type="submit">
              Create alert
            </button>
          </form>
          {alertStatus ? <p className="helper-text">{alertStatus}</p> : null}
        </Panel>
      </div>
    </div>
  );
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed";
}

function formatAttributes(attributes?: Array<{ name: string; value: string }>) {
  if (!attributes || !attributes.length) {
    return "-";
  }
  return attributes.map((attr) => `${attr.name}: ${attr.value}`).join(", ");
}

function formatCurrency(value?: number | string) {
  if (value === undefined || value === null) {
    return "-";
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric);
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

function parsePositiveInt(
  value: string,
  label: string,
  setError: (message: string) => void
) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    setError(`${label} must be a positive integer`);
    return null;
  }
  return parsed;
}

function parseUuid(
  value: string,
  label: string,
  setError: (message: string) => void
) {
  const trimmed = value.trim();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    setError(`${label} must be a valid UUID`);
    return undefined;
  }
  return trimmed;
}
