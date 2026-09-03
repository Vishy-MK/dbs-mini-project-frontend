const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await readJson(response);
  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function buildQuery(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getProducts(
  filters: {
    q?: string;
    category_id?: string;
    seller_id?: string;
    min_price?: number;
    max_price?: number;
  },
  token?: string
) {
  const query = buildQuery(filters);
  return apiFetch(`/products${query}`, { token });
}

export function getProduct(productId: string) {
  return apiFetch(`/products/${productId}`);
}

export function createProduct(
  payload: {
    name: string;
    description?: string;
    base_price: number;
    category_id?: string;
  },
  token: string
) {
  return apiFetch("/products", { method: "POST", body: payload, token });
}

export function updateProduct(
  productId: string,
  payload: {
    name?: string;
    description?: string | null;
    base_price?: number;
    category_id?: string | null;
  },
  token: string
) {
  return apiFetch(`/products/${productId}`, { method: "PATCH", body: payload, token });
}

export function deleteProduct(productId: string, token: string) {
  return apiFetch(`/products/${productId}`, { method: "DELETE", token });
}

export function getProductImages(productId?: string) {
  const query = buildQuery({ product_id: productId });
  return apiFetch(`/product-images${query}`);
}

export function createProductImage(
  payload: {
    product_id: string;
    image_url: string;
    is_primary?: boolean;
  },
  token: string
) {
  return apiFetch("/product-images", { method: "POST", body: payload, token });
}

export function updateProductImage(
  imageId: string,
  payload: {
    image_url?: string;
    is_primary?: boolean;
  },
  token: string
) {
  return apiFetch(`/product-images/${imageId}`,
    { method: "PATCH", body: payload, token });
}

export function deleteProductImage(imageId: string, token: string) {
  return apiFetch(`/product-images/${imageId}`, { method: "DELETE", token });
}

export function getProductVariants(productId?: string) {
  const query = buildQuery({ product_id: productId });
  return apiFetch(`/product-variants${query}`);
}

export function createProductVariant(
  payload: {
    product_id: string;
    sku: string;
    attributes: Array<{ name: string; value: string }>;
    stock_quantity: number;
    price_modifier?: number;
  },
  token: string
) {
  return apiFetch("/product-variants", { method: "POST", body: payload, token });
}

export function updateProductVariant(
  variantId: string,
  payload: {
    sku?: string;
    attributes?: Array<{ name: string; value: string }>;
    stock_quantity?: number;
    price_modifier?: number;
  },
  token: string
) {
  return apiFetch(`/product-variants/${variantId}`,
    { method: "PATCH", body: payload, token });
}

export function deleteProductVariant(variantId: string, token: string) {
  return apiFetch(`/product-variants/${variantId}`, { method: "DELETE", token });
}

export function getWishlist(token: string) {
  return apiFetch("/wishlist", { token });
}

export function addWishlist(productId: string, token: string) {
  return apiFetch("/wishlist", {
    method: "POST",
    body: { product_id: productId },
    token,
  });
}

export function removeWishlist(productId: string, token: string) {
  return apiFetch(`/wishlist/${productId}`, { method: "DELETE", token });
}

export function createOrder(
  items: Array<{ variant_id: string; quantity: number }>,
  token: string
) {
  return apiFetch("/orders", {
    method: "POST",
    body: { items },
    token,
  });
}

export function getOrders(token: string) {
  return apiFetch("/orders", { token });
}

export function getOrder(orderId: string, token: string) {
  return apiFetch(`/orders/${orderId}`, { token });
}

export function updateOrderStatus(orderId: string, status: string, token: string) {
  return apiFetch(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

export function getShippingByOrder(orderId: string, token: string) {
  const query = buildQuery({ order_id: orderId });
  return apiFetch(`/shipping${query}`, { token });
}

export function getShipping(shippingId: string, token: string) {
  return apiFetch(`/shipping/${shippingId}`, { token });
}

export function createShipping(
  payload: {
    order_id: string;
    address_id: string;
    carrier?: string;
    tracking_number?: string;
    status?: string;
    estimated_delivery?: string;
  },
  token: string
) {
  return apiFetch("/shipping", { method: "POST", body: payload, token });
}

export function updateShipping(
  shippingId: string,
  payload: {
    carrier?: string;
    tracking_number?: string;
    status?: string;
    estimated_delivery?: string;
  },
  token: string
) {
  return apiFetch(`/shipping/${shippingId}`,
    { method: "PATCH", body: payload, token });
}

export function createReview(
  productId: string,
  rating: number,
  comment: string,
  token: string
) {
  return apiFetch("/reviews", {
    method: "POST",
    body: { product_id: productId, rating, comment },
    token,
  });
}

export function getReviewsByProduct(productId: string) {
  return apiFetch(`/reviews/product/${productId}`);
}

export function getMyReviews(token: string) {
  return apiFetch("/reviews/me", { token });
}

export function getPendingReviews(token: string) {
  return apiFetch("/reviews/pending", { token });
}

export function createAlert(
  keyword: string,
  categoryId: string | undefined,
  maxPrice: number | undefined,
  token: string
) {
  return apiFetch("/alerts", {
    method: "POST",
    body: { keyword, category_id: categoryId, max_price: maxPrice },
    token,
  });
}

export function getAlerts(token: string) {
  return apiFetch("/alerts", { token });
}

export function updateAlert(
  alertId: string,
  payload: {
    keyword?: string;
    category_id?: string | null;
    max_price?: number | null;
  },
  token: string
) {
  return apiFetch(`/alerts/${alertId}`, { method: "PATCH", body: payload, token });
}

export function deleteAlert(alertId: string, token: string) {
  return apiFetch(`/alerts/${alertId}`, { method: "DELETE", token });
}

export function getUsers(token: string) {
  return apiFetch("/users", { token });
}

export function updateUserRole(userId: string, role: "buyer" | "seller" | "admin", token: string) {
  return apiFetch(`/users/${userId}/role`, {
    method: "PATCH",
    body: { role },
    token,
  });
}

export function updateMe(email: string, token: string) {
  return apiFetch("/users/me", { method: "PUT", body: { email }, token });
}

export function getSellerProfile(token: string, sellerId?: string) {
  const query = buildQuery({ seller_id: sellerId });
  return apiFetch(`/seller-profile${query}`, { token });
}

export function updateSellerProfile(
  payload: {
    store_name?: string;
    store_description?: string | null;
    payout_provider?: string | null;
    payout_account?: string | null;
    seller_id?: string;
  },
  token: string
) {
  return apiFetch("/seller-profile", { method: "PUT", body: payload, token });
}

export function getAddresses(token: string, userId?: string) {
  const query = buildQuery({ user_id: userId });
  return apiFetch(`/addresses${query}`, { token });
}

export function createAddress(
  payload: {
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default?: boolean;
    user_id?: string;
  },
  token: string
) {
  return apiFetch("/addresses", { method: "POST", body: payload, token });
}

export function updateAddress(
  addressId: string,
  payload: {
    street_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
  },
  token: string
) {
  return apiFetch(`/addresses/${addressId}`, { method: "PATCH", body: payload, token });
}

export function deleteAddress(addressId: string, token: string) {
  return apiFetch(`/addresses/${addressId}`, { method: "DELETE", token });
}

type MeResponse = {
  user: {
    id: string;
  };
};

export function getMe(token: string) {
  return apiFetch<MeResponse>("/users/me", { token });
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: "buyer" | "seller" | "admin";
  };
};

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getCategories() {
  return apiFetch("/categories");
}

export function createCategory(
  payload: { name: string; parent_id?: string | null },
  token: string
) {
  return apiFetch("/categories", { method: "POST", body: payload, token });
}

export function updateCategory(
  categoryId: string,
  payload: { name?: string; parent_id?: string | null },
  token: string
) {
  return apiFetch(`/categories/${categoryId}`,
    { method: "PATCH", body: payload, token });
}

export function deleteCategory(categoryId: string, token: string) {
  return apiFetch(`/categories/${categoryId}`, { method: "DELETE", token });
}

type SellerDashboardResponse = {
  metrics: {
    total_items_sold: number | string;
    total_revenue: number | string;
    active_listings: number;
    pending_orders: number;
  };
  recent_orders: Array<{
    order_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number | string;
    status: string;
    created_at: string;
    buyer_id: string;
    buyer_email: string;
  }>;
};

type BuyerDashboardResponse = {
  metrics: {
    total_orders: number;
    wishlist_items: number;
    active_alerts: number;
    pending_reviews: number;
  };
  recent_orders: Array<{
    order_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number | string;
    status: string;
    created_at: string;
  }>;
  wishlist: Array<{
    product_id: string;
    product_name: string;
    base_price: number | string;
    added_at: string;
  }>;
  alerts: Array<{
    alert_id: string;
    keyword: string;
    category_id: string | null;
    max_price: number | string | null;
    created_at: string;
  }>;
};

export function getSellerDashboard(userId: string) {
  const query = buildQuery({ user_id: userId });
  return apiFetch<SellerDashboardResponse>(`/seller/dashboard${query}`);
}

export function getBuyerDashboard(userId: string) {
  const query = buildQuery({ user_id: userId });
  return apiFetch<BuyerDashboardResponse>(`/buyer/dashboard${query}`);
}
