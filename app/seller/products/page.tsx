"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { deleteProduct, getProducts } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type ProductRow = {
  product_id: string;
  name: string;
  base_price: number | string;
  category_name?: string | null;
  created_at: string;
};

type ProductsResponse = {
  products?: ProductRow[];
};

export default function SellerProductsPage() {
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const data = (await getProducts(
        { seller_id: user.id },
        token || undefined
      )) as ProductsResponse;
      setProducts(data?.products || []);
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
    loadProducts();
  }, [token, user]);

  const handleDelete = async (productId: string) => {
    if (!token) {
      return;
    }
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) {
      return;
    }
    setStatus("");
    try {
      await deleteProduct(productId, token);
      setProducts((prev) => prev.filter((item) => item.product_id !== productId));
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
              <span className="tag">Products</span>
              <h1 className="section-title font-display">Catalog Manager</h1>
              <p className="section-subtitle">
                Update listings and keep inventory fresh.
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
              <Link className="btn-primary" href="/seller/products/new">
                New product
              </Link>
              <button className="btn-ghost" type="button" onClick={loadProducts}>
                Refresh
              </button>
              {loading ? <span className="helper-text">Loading...</span> : null}
              {status ? <span className="helper-text">{status}</span> : null}
            </div>

            <div className="table-wrapper card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length ? (
                    products.map((product) => (
                      <tr key={product.product_id}>
                        <td>{product.name}</td>
                        <td>{product.category_name || "-"}</td>
                        <td>{formatCurrency(product.base_price)}</td>
                        <td>{formatDate(product.created_at)}</td>
                        <td>
                          <div className="table-actions">
                            <Link
                              className="btn-ghost"
                              href={`/seller/products/${product.product_id}/edit`}
                            >
                              Edit
                            </Link>
                            <button
                              className="btn-ghost"
                              type="button"
                              onClick={() => handleDelete(product.product_id)}
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
                        No products yet.
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
