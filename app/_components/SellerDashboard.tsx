"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Panel from "./Panel";
import {
  createProduct,
  createProductVariant,
  getCategories,
  getMe,
  getOrders,
  getProductVariants,
  getProducts,
} from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type VariantAttributeInput = {
  name: string;
  value: string;
};

type CategoryOption = {
  category_id: string;
  name: string;
};

type ProductOption = {
  product_id: string;
  name: string;
  base_price?: number | string;
  category_name?: string | null;
  created_at?: string;
};

type VariantRow = {
  variant_id: string;
  sku: string;
  stock_quantity: number | string;
  price_modifier: number | string;
  attributes?: Array<{ name: string; value: string }>;
};

type SellerOrderRow = {
  order_id: string;
  buyer_id: string;
  status: string;
  created_at: string;
  total_units?: number | string;
  seller_total?: number | string;
};

type CategoriesResponse = {
  categories?: CategoryOption[];
};

type ProductsResponse = {
  products?: ProductOption[];
};

type ProductResponse = {
  product?: ProductOption;
};

type VariantsResponse = {
  variants?: VariantRow[];
};

type OrdersResponse = {
  orders?: SellerOrderRow[];
};

export default function SellerDashboard() {
  const router = useRouter();
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [createResults, setCreateResults] = useState("");
  const [listingResults, setListingResults] = useState("");
  const [ordersResults, setOrdersResults] = useState("");
  const [variantProductId, setVariantProductId] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [variantAttributes, setVariantAttributes] = useState<VariantAttributeInput[]>([
    { name: "Color", value: "Black" },
  ]);
  const [variantStock, setVariantStock] = useState("10");
  const [variantPriceModifier, setVariantPriceModifier] = useState("0");
  const [variantResults, setVariantResults] = useState("");
  const [variantLookupProductId, setVariantLookupProductId] = useState("");
  const [variantListResults, setVariantListResults] = useState("");
  const [variantList, setVariantList] = useState<VariantRow[]>([]);
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [sellerProducts, setSellerProducts] = useState<ProductOption[]>([]);

  const updateVariantAttribute = (
    index: number,
    field: keyof VariantAttributeInput,
    value: string
  ) => {
    setVariantAttributes((prev) =>
      prev.map((attribute, currentIndex) =>
        currentIndex === index ? { ...attribute, [field]: value } : attribute
      )
    );
  };

  const addVariantAttribute = () => {
    setVariantAttributes((prev) => [...prev, { name: "", value: "" }]);
  };

  const removeVariantAttribute = (index: number) => {
    setVariantAttributes((prev) => prev.filter((_, current) => current !== index));
  };

  const loadSellerContext = async () => {
    if (!token || !user || user.role !== "seller") {
      return;
    }
    try {
      const [categoryData, productData] = await Promise.all([
        getCategories() as Promise<CategoriesResponse>,
        getProducts({ seller_id: user.id }, token) as Promise<ProductsResponse>,
      ]);
      const loadedCategories = categoryData?.categories || [];
      const loadedProducts = productData?.products || [];
      setCategories(loadedCategories);
      setSellerProducts(loadedProducts);
      setListingResults(loadedProducts.length
        ? `Loaded ${loadedProducts.length} listings.`
        : "No listings found."
      );
      if (!variantProductId && loadedProducts.length) {
        setVariantProductId(loadedProducts[0].product_id);
      }
      if (!variantLookupProductId && loadedProducts.length) {
        setVariantLookupProductId(loadedProducts[0].product_id);
      }
    } catch (error) {
      const message = formatError(error);
      setCreateResults(message);
    }
  };

  useEffect(() => {
    loadSellerContext();
  }, [token, user]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setCreateResults("Missing token");
      return;
    }
    const priceValue = parsePositiveNumber(basePrice, "Base price", setCreateResults);
    if (!priceValue) {
      return;
    }
    const parsedCategory = categoryId
      ? parseUuid(categoryId, "Category ID", setCreateResults)
      : undefined;
    if (categoryId && !parsedCategory) {
      return;
    }
    try {
      const data = (await createProduct(
        {
          name,
          description,
          base_price: priceValue,
          category_id: parsedCategory,
        },
        token
      )) as ProductResponse;
      const created = data?.product;
      if (created) {
        setSellerProducts((prev) => [created, ...prev]);
        setCreateResults("Product created successfully.");
      } else {
        setCreateResults("Product saved.");
      }
    } catch (error) {
      setCreateResults(formatError(error));
    }
  };

  const handleCreateVariant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setVariantResults("Missing token");
      return;
    }
    if (!variantProductId) {
      setVariantResults("Select a product to attach the variant");
      return;
    }
    const productId = parseUuid(
      variantProductId,
      "Product ID",
      setVariantResults
    );
    if (!productId) {
      return;
    }
    const stockValue = parseNonNegativeInt(
      variantStock,
      "Stock quantity",
      setVariantResults
    );
    if (stockValue === null) {
      return;
    }
    const priceModifierValue = variantPriceModifier
      ? parseNumber(variantPriceModifier, "Price modifier", setVariantResults)
      : 0;
    if (priceModifierValue === null) {
      return;
    }
    const attributesValue = buildAttributesPayload(variantAttributes);

    try {
      await createProductVariant(
        {
          product_id: productId,
          sku: variantSku,
          attributes: attributesValue,
          stock_quantity: stockValue,
          price_modifier: priceModifierValue,
        },
        token
      );
      setVariantResults("Variant created successfully.");
      if (variantLookupProductId === productId) {
        handleLoadVariants();
      }
    } catch (error) {
      setVariantResults(formatError(error));
    }
  };

  const handleLoadListings = async () => {
    if (!token) {
      setListingResults("Missing token");
      return;
    }
    try {
      const sellerId = user?.id || (await getMe(token))?.user?.id;
      if (!sellerId) {
        setListingResults("Unable to resolve seller id");
        return;
      }
      const data = (await getProducts(
        { seller_id: sellerId },
        token
      )) as ProductsResponse;
      const loadedProducts = data?.products || [];
      setSellerProducts(loadedProducts);
      setListingResults(
        loadedProducts.length
          ? `Loaded ${loadedProducts.length} listings.`
          : "No listings found."
      );
    } catch (error) {
      setListingResults(formatError(error));
    }
  };

  const handleLoadVariants = async () => {
    if (!variantLookupProductId) {
      setVariantListResults("Select a product to load variants");
      return;
    }
    const productId = parseUuid(
      variantLookupProductId,
      "Product ID",
      setVariantListResults
    );
    if (!productId) {
      return;
    }
    try {
      const data = (await getProductVariants(productId)) as VariantsResponse;
      const loadedVariants = data?.variants || [];
      setVariantList(loadedVariants);
      setVariantListResults(
        loadedVariants.length
          ? `Loaded ${loadedVariants.length} variants.`
          : "No variants found."
      );
    } catch (error) {
      setVariantListResults(formatError(error));
    }
  };

  const handleLoadOrders = async () => {
    if (!token) {
      setOrdersResults("Missing token");
      return;
    }
    try {
      const data = (await getOrders(token)) as OrdersResponse;
      const loadedOrders = data?.orders || [];
      setOrders(loadedOrders);
      setOrdersResults(
        loadedOrders.length
          ? `Loaded ${loadedOrders.length} orders.`
          : "No orders found."
      );
    } catch (error) {
      setOrdersResults(formatError(error));
    }
  };

  if (!token || !user) {
    return (
      <div className="card field-grid">
        <div className="panel-header">
          <h2 className="panel-title font-display">Seller workspace</h2>
          <p className="panel-desc">
            Create a seller profile to publish listings, manage inventory, and
            fulfill orders.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => router.push("/login")}>
          Start selling
        </button>
      </div>
    );
  }

  if (user.role !== "seller") {
    return (
      <div className="card field-grid">
        <div className="panel-header">
          <h2 className="panel-title font-display">Switch to seller profile</h2>
          <p className="panel-desc">
            Use a seller profile to manage listings, inventory, and orders.
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
          title="Add product"
          description="Publish new listings for buyers to browse."
          delay="0.1s"
        >
          <form className="field-grid" onSubmit={handleCreate}>
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
            />
            <textarea
              className="textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
            />
            <input
              className="input"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              placeholder="Base price"
            />
            <select
              className="input"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Select category (optional)</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button className="btn-primary" type="submit">
              Publish listing
            </button>
          </form>
          {createResults ? <p className="helper-text">{createResults}</p> : null}
        </Panel>

        <Panel
          title="Add product variant"
          description="Add SKU-level inventory for a product."
          delay="0.2s"
        >
          <form className="field-grid" onSubmit={handleCreateVariant}>
            <select
              className="input"
              value={variantProductId}
              onChange={(event) => setVariantProductId(event.target.value)}
            >
              <option value="">Select product</option>
              {sellerProducts.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              value={variantSku}
              onChange={(event) => setVariantSku(event.target.value)}
              placeholder="SKU"
            />
            <div className="field-grid">
              {variantAttributes.map((attribute, index) => (
                <div key={`${attribute.name}-${index}`} className="field-grid">
                  <input
                    className="input"
                    value={attribute.name}
                    onChange={(event) =>
                      updateVariantAttribute(index, "name", event.target.value)
                    }
                    placeholder="Attribute name (e.g., Color)"
                  />
                  <div className="toolbar">
                    <input
                      className="input"
                      value={attribute.value}
                      onChange={(event) =>
                        updateVariantAttribute(index, "value", event.target.value)
                      }
                      placeholder="Attribute value (e.g., Black)"
                    />
                    {variantAttributes.length > 1 ? (
                      <button
                        className="btn-ghost"
                        type="button"
                        onClick={() => removeVariantAttribute(index)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              <button
                className="btn-ghost"
                type="button"
                onClick={addVariantAttribute}
              >
                Add attribute
              </button>
            </div>
            <input
              className="input"
              value={variantStock}
              onChange={(event) => setVariantStock(event.target.value)}
              placeholder="Stock quantity"
            />
            <input
              className="input"
              value={variantPriceModifier}
              onChange={(event) => setVariantPriceModifier(event.target.value)}
              placeholder="Price modifier (optional)"
            />
            <button className="btn-secondary" type="submit">
              Create variant
            </button>
          </form>
          {variantResults ? <p className="helper-text">{variantResults}</p> : null}
        </Panel>

        <Panel
          title="Manage listings"
          description="Review your live products and inventory."
          delay="0.3s"
        >
          <div className="field-grid">
            <button className="btn-ghost" type="button" onClick={handleLoadListings}>
              Load my listings
            </button>
            <select
              className="input"
              value={variantLookupProductId}
              onChange={(event) => setVariantLookupProductId(event.target.value)}
            >
              <option value="">Select product for variants</option>
              {sellerProducts.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name}
                </option>
              ))}
            </select>
            <button className="btn-ghost" type="button" onClick={handleLoadVariants}>
              Load variants
            </button>
          </div>
          {listingResults ? <p className="helper-text">{listingResults}</p> : null}
          {sellerProducts.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerProducts.slice(0, 10).map((product) => (
                    <tr key={product.product_id}>
                      <td>{product.name}</td>
                      <td>{product.category_name || "-"}</td>
                      <td>{formatCurrency(product.base_price)}</td>
                      <td>{formatDate(product.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {sellerProducts.length > 10 ? (
            <p className="helper-text">
              Showing first 10 of {sellerProducts.length} listings.
            </p>
          ) : null}
          {variantListResults ? <p className="helper-text">{variantListResults}</p> : null}
          {variantList.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Attributes</th>
                    <th>Stock</th>
                    <th>Price Mod</th>
                  </tr>
                </thead>
                <tbody>
                  {variantList.slice(0, 10).map((variant) => (
                    <tr key={variant.variant_id}>
                      <td>{variant.sku}</td>
                      <td>{formatAttributes(variant.attributes)}</td>
                      <td>{variant.stock_quantity}</td>
                      <td>{formatCurrency(variant.price_modifier)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {variantList.length > 10 ? (
            <p className="helper-text">
              Showing first 10 of {variantList.length} variants.
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Incoming orders"
          description="View orders assigned to your listings."
          delay="0.4s"
        >
          <div className="field-grid">
            <button className="btn-ghost" type="button" onClick={handleLoadOrders}>
              Load orders
            </button>
          </div>
          {ordersResults ? <p className="helper-text">{ordersResults}</p> : null}
          {orders.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Buyer</th>
                    <th>Status</th>
                    <th>Units</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.order_id}>
                      <td>#{order.order_id}</td>
                      <td>{order.buyer_id}</td>
                      <td>{order.status}</td>
                      <td>{order.total_units ?? "-"}</td>
                      <td>{formatCurrency(order.seller_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {orders.length > 10 ? (
            <p className="helper-text">
              Showing first 10 of {orders.length} orders.
            </p>
          ) : null}
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

function parseNonNegativeInt(
  value: string,
  label: string,
  setError: (message: string) => void
) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    setError(`${label} must be a non-negative integer`);
    return null;
  }
  return parsed;
}

function parsePositiveNumber(
  value: string,
  label: string,
  setError: (message: string) => void
) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    setError(`${label} must be a positive number`);
    return null;
  }
  return parsed;
}

function parseNumber(
  value: string,
  label: string,
  setError: (message: string) => void
) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    setError(`${label} must be a number`);
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

function buildAttributesPayload(attributes: VariantAttributeInput[]) {
  return attributes
    .map((attribute) => ({
      name: attribute.name.trim(),
      value: attribute.value.trim(),
    }))
    .filter((attribute) => attribute.name && attribute.value);
}

function formatAttributes(attributes?: Array<{ name: string; value: string }>) {
  if (!attributes || !attributes.length) {
    return "-";
  }
  return attributes.map((attribute) => `${attribute.name}: ${attribute.value}`).join(", ");
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
