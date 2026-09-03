"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import TopNav from "../_components/TopNav";
import { getCategories, getProducts } from "@/lib/api";

type ProductRow = {
  product_id: string;
  name: string;
  base_price: number | string;
  category_id?: string | null;
  category_name?: string | null;
  seller_email?: string | null;
};

type Category = {
  category_id: string;
  name: string;
};

type ProductsResponse = {
  products?: ProductRow[];
};

type CategoriesResponse = {
  categories?: Category[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setStatus("");
    try {
      const data = (await getProducts({
        q: query || undefined,
        category_id: categoryId || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
      })) as ProductsResponse;
      setProducts(data?.products || []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const categoryData = (await getCategories()) as CategoriesResponse;
        setCategories(categoryData?.categories || []);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Load failed");
      }
      await loadProducts();
    };
    init();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadProducts();
  };

  const handleReset = () => {
    setQuery("");
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setStatus("");
    setTimeout(loadProducts, 0);
  };

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <main className="shell">
        <header className="section-header">
          <div>
            <span className="tag">Marketplace</span>
            <h1 className="section-title font-display">Browse Products</h1>
            <p className="section-subtitle">
              Explore devices, accessories, and curated categories.
            </p>
          </div>
        </header>

        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Filters</h3>
            <p className="panel-desc">Refine listings by category and price.</p>
          </div>
          <form className="field-grid" onSubmit={handleSubmit}>
            <input
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search keywords"
            />
            <select
              className="input"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="Min price"
              min="0"
              step="0.01"
            />
            <input
              className="input"
              type="number"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Max price"
              min="0"
              step="0.01"
            />
            <div className="toolbar">
              <button className="btn-primary" type="submit">
                Apply filters
              </button>
              <button className="btn-ghost" type="button" onClick={handleReset}>
                Reset
              </button>
              {loading ? <span className="helper-text">Loading...</span> : null}
              {status ? <span className="helper-text">{status}</span> : null}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Results</h3>
            <p className="panel-desc">Current product listings.</p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
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
                      <td>
                        {product.category_name && product.category_id ? (
                          <Link href={`/categories/${product.category_id}`}>
                            {product.category_name}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{product.seller_email || "-"}</td>
                      <td>{formatCurrency(product.base_price)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="helper-text">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
