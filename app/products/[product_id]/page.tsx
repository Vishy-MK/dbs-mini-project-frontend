"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import TopNav from "../../_components/TopNav";
import {
  addWishlist,
  createOrder,
  getProduct,
  getProductImages,
  getProductVariants,
  getReviewsByProduct,
} from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type Product = {
  product_id: string;
  name: string;
  description: string | null;
  base_price: number | string;
  category_id: string | null;
  category_name?: string | null;
  seller_email?: string | null;
};

type Image = {
  image_id: string;
  image_url: string;
  is_primary: number | boolean;
};

type Variant = {
  variant_id: string;
  sku: string;
  attributes?: Array<{ name: string; value: string }>;
  stock_quantity: number | string;
  price_modifier: number | string;
};

type Review = {
  review_id: string;
  rating: number | string;
  comment: string | null;
  created_at: string;
  reviewer_email?: string | null;
};

type ProductResponse = {
  product?: Product;
};

type ImagesResponse = {
  images?: Image[];
};

type VariantsResponse = {
  variants?: Variant[];
};

type ReviewsResponse = {
  reviews?: Review[];
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = String(params?.product_id || "");
  const router = useRouter();
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [purchaseVariantId, setPurchaseVariantId] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("1");
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const loadData = async () => {
    if (!productId) {
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const [productData, imagesData, variantsData, reviewData] =
        await Promise.all([
          getProduct(productId) as Promise<ProductResponse>,
          getProductImages(productId) as Promise<ImagesResponse>,
          getProductVariants(productId) as Promise<VariantsResponse>,
          getReviewsByProduct(productId) as Promise<ReviewsResponse>,
        ]);
      setProduct(productData?.product || null);
      setImages(imagesData?.images || []);
      setVariants(variantsData?.variants || []);
      setReviews(reviewData?.reviews || []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  useEffect(() => {
    if (!variants.length) {
      if (purchaseVariantId) {
        setPurchaseVariantId("");
      }
      return;
    }
    const stillExists = variants.some(
      (variant) => variant.variant_id === purchaseVariantId
    );
    if (!purchaseVariantId || !stillExists) {
      const firstAvailable = variants.find(
        (variant) => Number(variant.stock_quantity) > 0
      );
      setPurchaseVariantId(firstAvailable?.variant_id || variants[0].variant_id);
    }
  }, [purchaseVariantId, variants]);

  const handleWishlist = async () => {
    if (!token || !productId) {
      setStatus("Create a buyer profile to save wishlist items.");
      return;
    }
    try {
      await addWishlist(productId, token);
      setStatus("Saved to wishlist.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const handlePurchase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || user?.role !== "buyer") {
      setPurchaseStatus("Log in as a buyer to place orders.");
      return;
    }
    if (!purchaseVariantId) {
      setPurchaseStatus("Select a variant to purchase.");
      return;
    }
    const quantity = Number(purchaseQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setPurchaseStatus("Quantity must be a positive integer.");
      return;
    }
    setPurchaseLoading(true);
    setPurchaseStatus("");
    try {
      const data = await createOrder(
        [{ variant_id: purchaseVariantId, quantity }],
        token
      );
      const orderId =
        (data as { order?: { order_id?: string } })?.order?.order_id || "";
      setPurchaseStatus(orderId ? `Order placed: #${orderId}` : "Order placed.");
      if (orderId) {
        router.push(`/buyer/orders/${orderId}`);
      }
    } catch (error) {
      setPurchaseStatus(error instanceof Error ? error.message : "Order failed");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const primaryImage =
    images.find((image) => Boolean(image.is_primary)) || images[0];
  const selectedVariant = variants.find(
    (variant) => variant.variant_id === purchaseVariantId
  );
  const selectedStock = selectedVariant
    ? Number(selectedVariant.stock_quantity)
    : 0;
  const canPurchase = Boolean(token) && user?.role === "buyer";
  const selectedOutOfStock = selectedVariant ? selectedStock <= 0 : false;

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <div>
            <span className="tag">Product</span>
            <h1 className="section-title font-display">{product?.name || "Listing"}</h1>
            <p className="section-subtitle">
              {product?.category_name || "Marketplace item"}
            </p>
          </div>
        </header>

        <div className="stack">
          {loading ? <p className="helper-text">Loading...</p> : null}
          {status ? <p className="helper-text">{status}</p> : null}

          <div className="panel-grid">
            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Overview</h3>
                <p className="panel-desc">Key listing details.</p>
              </div>
              {primaryImage ? (
                <div className="card">
                  <img
                    src={primaryImage.image_url}
                    alt={product?.name || "Product image"}
                    style={{ width: "100%", borderRadius: "16px", objectFit: "cover" }}
                  />
                </div>
              ) : null}
              <div className="info-grid" style={{ marginTop: "16px" }}>
                <div>
                  <p className="helper-text">Price</p>
                  <p className="metric-value">{formatCurrency(product?.base_price)}</p>
                </div>
                <div>
                  <p className="helper-text">Seller</p>
                  <p className="metric-value">{product?.seller_email || "-"}</p>
                </div>
              </div>
              {product?.description ? (
                <p className="panel-desc" style={{ marginTop: "12px" }}>
                  {product.description}
                </p>
              ) : null}
              <div className="toolbar" style={{ marginTop: "16px" }}>
                <button className="btn-primary" type="button" onClick={handleWishlist}>
                  Save to wishlist
                </button>
                <Link className="btn-ghost" href="/products">
                  Back to products
                </Link>
                {user?.role === "buyer" ? null : (
                  <span className="helper-text">Log in as buyer to save items.</span>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Variants</h3>
                <p className="panel-desc">Available SKUs and stock.</p>
              </div>
              <form className="field-grid" onSubmit={handlePurchase}>
                <select
                  className="input"
                  value={purchaseVariantId}
                  onChange={(event) => setPurchaseVariantId(event.target.value)}
                  disabled={!variants.length}
                >
                  <option value="">Select a variant</option>
                  {variants.map((variant) => {
                    const variantPrice =
                      Number(product?.base_price || 0) +
                      Number(variant.price_modifier || 0);
                    const labelParts = [
                      variant.sku,
                      attributesToString(variant.attributes),
                      formatCurrency(variantPrice),
                    ];
                    return (
                      <option
                        key={variant.variant_id}
                        value={variant.variant_id}
                        disabled={Number(variant.stock_quantity) <= 0}
                      >
                        {labelParts.filter(Boolean).join(" · ")}
                      </option>
                    );
                  })}
                </select>
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  max={selectedStock > 0 ? selectedStock : undefined}
                  value={purchaseQuantity}
                  onChange={(event) => setPurchaseQuantity(event.target.value)}
                  placeholder="Quantity"
                  disabled={!variants.length}
                />
                <div className="toolbar">
                  <button
                    className="btn-primary"
                    type="submit"
                    disabled={
                      !variants.length ||
                      purchaseLoading ||
                      !canPurchase ||
                      !purchaseVariantId ||
                      selectedOutOfStock
                    }
                  >
                    Buy now
                  </button>
                  {purchaseLoading ? (
                    <span className="helper-text">Placing order...</span>
                  ) : null}
                  {purchaseStatus ? (
                    <span className="helper-text">{purchaseStatus}</span>
                  ) : null}
                </div>
                {!canPurchase ? (
                  <p className="helper-text">Log in as a buyer to purchase.</p>
                ) : null}
                {selectedOutOfStock ? (
                  <p className="helper-text">Selected variant is out of stock.</p>
                ) : null}
              </form>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Attributes</th>
                      <th>Stock</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.length ? (
                      variants.map((variant) => (
                        <tr key={variant.variant_id}>
                          <td>{variant.sku}</td>
                          <td>{attributesToString(variant.attributes)}</td>
                          <td>{variant.stock_quantity}</td>
                          <td>
                            {formatCurrency(
                              Number(product?.base_price || 0) +
                                Number(variant.price_modifier || 0)
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="helper-text">
                          No variants listed.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title font-display">Gallery</h3>
              <p className="panel-desc">More product images.</p>
            </div>
            <div className="section-grid" style={{ marginTop: "0" }}>
              {images.length ? (
                images.map((image) => (
                  <div key={image.image_id} className="card">
                    <img
                      src={image.image_url}
                      alt={product?.name || "Product image"}
                      style={{ width: "100%", borderRadius: "16px", objectFit: "cover" }}
                    />
                  </div>
                ))
              ) : (
                <p className="helper-text">No images uploaded.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title font-display">Reviews</h3>
              <p className="panel-desc">Feedback from recent buyers.</p>
            </div>
            {reviews.length ? (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Reviewer</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => (
                      <tr key={review.review_id}>
                        <td>{review.reviewer_email || "Buyer"}</td>
                        <td>{review.rating}</td>
                        <td>{review.comment || "-"}</td>
                        <td>{formatDate(review.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="helper-text">No reviews yet.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function attributesToString(
  value?: Array<{ name: string; value: string }>
) {
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
