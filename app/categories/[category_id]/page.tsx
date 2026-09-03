"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TopNav from "../../_components/TopNav";
import { getCategories, getProducts } from "@/lib/api";

type Category = {
  category_id: string;
  name: string;
  parent_id: string | null;
};

type ProductRow = {
  product_id: string;
  name: string;
  base_price: number | string;
  category_name?: string | null;
  seller_email?: string | null;
};

type CategoriesResponse = {
  categories?: Category[];
};

type ProductsResponse = {
  products?: ProductRow[];
};

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = String(params?.category_id || "");
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!categoryId) {
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const [categoryData, productData] = await Promise.all([
        getCategories() as Promise<CategoriesResponse>,
        getProducts({ category_id: categoryId }) as Promise<ProductsResponse>,
      ]);
      const found = categoryData?.categories?.find(
        (item) => item.category_id === categoryId
      );
      setCategory(found || null);
      setProducts(productData?.products || []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryId]);

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <main className="shell">
        <header className="section-header">
          <div>
            <span className="tag">Category</span>
            <h1 className="section-title font-display">
              {category?.name || "Category"}
            </h1>
            <p className="section-subtitle">
              Browse listings in this collection.
            </p>
          </div>
        </header>

        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Listings</h3>
            <p className="panel-desc">Products mapped to this category.</p>
          </div>
          {loading ? <p className="helper-text">Loading...</p> : null}
          {status ? <p className="helper-text">{status}</p> : null}
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {products.length ? (
                  products.map((product) => (
                    <tr key={product.product_id}>
                      <td>
                        <Link href={`/products/${product.product_id}`}>
                          {product.name}
                        </Link>
                      </td>
                      <td>{product.seller_email || "-"}</td>
                      <td>{formatCurrency(product.base_price)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="helper-text">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="toolbar" style={{ marginTop: "16px" }}>
            <Link className="btn-ghost" href="/products">
              Back to products
            </Link>
          </div>
        </section>
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
