"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TopNav from "../../../../_components/TopNav";
import LogoutButton from "../../../../_components/LogoutButton";
import {
  createProductImage,
  createProductVariant,
  deleteProductImage,
  deleteProductVariant,
  getCategories,
  getProduct,
  getProductImages,
  getProductVariants,
  updateProduct,
  updateProductImage,
  updateProductVariant,
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
};

type Category = {
  category_id: string;
  name: string;
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

type ProductResponse = {
  product?: Product;
};

type CategoriesResponse = {
  categories?: Category[];
};

type ImagesResponse = {
  images?: Image[];
};

type VariantsResponse = {
  variants?: Variant[];
};

export default function SellerProductEditPage() {
  const params = useParams();
  const productId = String(params?.product_id || "");
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productStatus, setProductStatus] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [imagePrimary, setImagePrimary] = useState(false);
  const [imageStatus, setImageStatus] = useState("");

  const [editingVariantId, setEditingVariantId] = useState("");
  const [sku, setSku] = useState("");
  const [variantAttributes, setVariantAttributes] = useState<
    Array<{ name: string; value: string }>
  >([{ name: "", value: "" }]);
  const [stockQuantity, setStockQuantity] = useState("0");
  const [priceModifier, setPriceModifier] = useState("0");
  const [variantStatus, setVariantStatus] = useState("");

  const updateVariantAttribute = (
    index: number,
    field: "name" | "value",
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

  const loadData = async () => {
    if (!productId) {
      return;
    }
    setLoading(true);
    setProductStatus("");
    try {
      const [productData, categoriesData, imagesData, variantsData] =
        await Promise.all([
          getProduct(productId) as Promise<ProductResponse>,
          getCategories() as Promise<CategoriesResponse>,
          getProductImages(productId) as Promise<ImagesResponse>,
          getProductVariants(productId) as Promise<VariantsResponse>,
        ]);
      const loadedProduct = productData?.product || null;
      setProduct(loadedProduct);
      if (loadedProduct) {
        setName(loadedProduct.name || "");
        setDescription(loadedProduct.description || "");
        setBasePrice(String(loadedProduct.base_price ?? ""));
        setCategoryId(loadedProduct.category_id || "");
      }
      setCategories(categoriesData?.categories || []);
      setImages(imagesData?.images || []);
      setVariants(variantsData?.variants || []);
    } catch (error) {
      setProductStatus(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== "seller") {
      return;
    }
    loadData();
  }, [token, user, productId]);

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !productId) {
      return;
    }
    setProductStatus("");
    try {
      const data = (await updateProduct(
        productId,
        {
          name,
          description: description || null,
          base_price: Number(basePrice),
          category_id: categoryId || null,
        },
        token
      )) as ProductResponse;
      setProduct(data?.product || null);
      setProductStatus("Product updated.");
    } catch (error) {
      setProductStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const loadImages = async () => {
    if (!productId) {
      return;
    }
    const data = (await getProductImages(productId)) as ImagesResponse;
    setImages(data?.images || []);
  };

  const loadVariants = async () => {
    if (!productId) {
      return;
    }
    const data = (await getProductVariants(productId)) as VariantsResponse;
    setVariants(data?.variants || []);
  };

  const handleImageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !productId) {
      return;
    }
    setImageStatus("");
    try {
      await createProductImage(
        { product_id: productId, image_url: imageUrl, is_primary: imagePrimary },
        token
      );
      setImageUrl("");
      setImagePrimary(false);
      await loadImages();
    } catch (error) {
      setImageStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const handleMakePrimary = async (imageId: string) => {
    if (!token) {
      return;
    }
    setImageStatus("");
    try {
      await updateProductImage(imageId, { is_primary: true }, token);
      await loadImages();
    } catch (error) {
      setImageStatus(error instanceof Error ? error.message : "Update failed");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!token) {
      return;
    }
    setImageStatus("");
    try {
      await deleteProductImage(imageId, token);
      setImages((prev) => prev.filter((image) => image.image_id !== imageId));
    } catch (error) {
      setImageStatus(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const resetVariantForm = () => {
    setEditingVariantId("");
    setSku("");
    setVariantAttributes([{ name: "", value: "" }]);
    setStockQuantity("0");
    setPriceModifier("0");
  };

  const handleVariantSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !productId) {
      return;
    }
    setVariantStatus("");
    const parsedAttributes = buildAttributesPayload(variantAttributes);

    try {
      if (editingVariantId) {
        await updateProductVariant(
          editingVariantId,
          {
            sku,
            attributes: parsedAttributes,
            stock_quantity: Number(stockQuantity),
            price_modifier: Number(priceModifier),
          },
          token
        );
      } else {
        await createProductVariant(
          {
            product_id: productId,
            sku,
            attributes: parsedAttributes,
            stock_quantity: Number(stockQuantity),
            price_modifier: Number(priceModifier),
          },
          token
        );
      }
      resetVariantForm();
      await loadVariants();
    } catch (error) {
      setVariantStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingVariantId(variant.variant_id);
    setSku(variant.sku || "");
    setVariantAttributes(normalizeAttributes(variant.attributes));
    setStockQuantity(String(variant.stock_quantity ?? "0"));
    setPriceModifier(String(variant.price_modifier ?? "0"));
    setVariantStatus("Editing variant. Submit to save changes.");
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!token) {
      return;
    }
    setVariantStatus("");
    try {
      await deleteProductVariant(variantId, token);
      setVariants((prev) => prev.filter((variant) => variant.variant_id !== variantId));
    } catch (error) {
      setVariantStatus(error instanceof Error ? error.message : "Delete failed");
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
              <span className="tag">Edit Product</span>
              <h1 className="section-title font-display">
                {product?.name || "Product details"}
              </h1>
              <p className="section-subtitle">
                Update pricing, images, and variants.
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
              <Link className="btn-ghost" href="/seller/products">
                Back to products
              </Link>
              <button className="btn-ghost" type="button" onClick={loadData}>
                Refresh
              </button>
              {loading ? <span className="helper-text">Loading...</span> : null}
              {productStatus ? <span className="helper-text">{productStatus}</span> : null}
            </div>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Product details</h3>
                <p className="panel-desc">Update core listing information.</p>
              </div>
              <form className="field-grid" onSubmit={handleProductSubmit}>
                <input
                  className="input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Product name"
                  required
                />
                <textarea
                  className="input textarea"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Description"
                  rows={4}
                />
                <input
                  className="input"
                  type="number"
                  value={basePrice}
                  onChange={(event) => setBasePrice(event.target.value)}
                  placeholder="Base price"
                  min="0"
                  step="0.01"
                  required
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
                  Save product
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Images</h3>
                <p className="panel-desc">Add visuals for the listing.</p>
              </div>
              <form className="field-grid" onSubmit={handleImageSubmit}>
                <input
                  className="input"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="Image URL"
                  required
                />
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={imagePrimary}
                    onChange={(event) => setImagePrimary(event.target.checked)}
                  />
                  <span>Set as primary</span>
                </label>
                <button className="btn-primary" type="submit">
                  Add image
                </button>
                {imageStatus ? <p className="helper-text">{imageStatus}</p> : null}
              </form>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Image URL</th>
                      <th>Primary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.length ? (
                      images.map((image) => (
                        <tr key={image.image_id}>
                          <td>{image.image_url}</td>
                          <td>{image.is_primary ? "Yes" : "No"}</td>
                          <td>
                            <div className="table-actions">
                              {!image.is_primary ? (
                                <button
                                  className="btn-ghost"
                                  type="button"
                                  onClick={() => handleMakePrimary(image.image_id)}
                                >
                                  Make primary
                                </button>
                              ) : null}
                              <button
                                className="btn-ghost"
                                type="button"
                                onClick={() => handleDeleteImage(image.image_id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="helper-text">
                          No images yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Variants</h3>
                <p className="panel-desc">Define SKUs, inventory, and attributes.</p>
              </div>
              <form className="field-grid" onSubmit={handleVariantSubmit}>
                <input
                  className="input"
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  placeholder="SKU"
                  required
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
                        placeholder="Attribute name (e.g., Size)"
                      />
                      <div className="toolbar">
                        <input
                          className="input"
                          value={attribute.value}
                          onChange={(event) =>
                            updateVariantAttribute(index, "value", event.target.value)
                          }
                          placeholder="Attribute value (e.g., M)"
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
                  type="number"
                  value={stockQuantity}
                  onChange={(event) => setStockQuantity(event.target.value)}
                  placeholder="Stock quantity"
                  min="0"
                  step="1"
                  required
                />
                <input
                  className="input"
                  type="number"
                  value={priceModifier}
                  onChange={(event) => setPriceModifier(event.target.value)}
                  placeholder="Price modifier"
                  step="0.01"
                />
                <div className="toolbar">
                  <button className="btn-primary" type="submit">
                    {editingVariantId ? "Save variant" : "Add variant"}
                  </button>
                  {editingVariantId ? (
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        resetVariantForm();
                        setVariantStatus("");
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
                {variantStatus ? <p className="helper-text">{variantStatus}</p> : null}
              </form>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Attributes</th>
                      <th>Stock</th>
                      <th>Price Mod</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.length ? (
                      variants.map((variant) => (
                        <tr key={variant.variant_id}>
                          <td>{variant.sku}</td>
                          <td>{attributesToString(variant.attributes)}</td>
                          <td>{variant.stock_quantity}</td>
                          <td>{variant.price_modifier}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-ghost"
                                type="button"
                                onClick={() => handleEditVariant(variant)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-ghost"
                                type="button"
                                onClick={() => handleDeleteVariant(variant.variant_id)}
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
                          No variants yet.
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

function attributesToString(value?: Array<{ name: string; value: string }>) {
  if (!value || !Array.isArray(value)) {
    return "-";
  }
  if (!value.length) {
    return "-";
  }
  return value.map((attr) => `${attr.name}: ${attr.value}`).join(", ");
}

function buildAttributesPayload(
  attributes: Array<{ name: string; value: string }>
) {
  return attributes
    .map((attribute) => ({
      name: attribute.name.trim(),
      value: attribute.value.trim(),
    }))
    .filter((attribute) => attribute.name && attribute.value);
}

function normalizeAttributes(
  attributes?: Array<{ name: string; value: string }>
) {
  if (!Array.isArray(attributes) || attributes.length === 0) {
    return [{ name: "", value: "" }];
  }
  return attributes.map((attribute) => ({
    name: attribute.name || "",
    value: attribute.value || "",
  }));
}
