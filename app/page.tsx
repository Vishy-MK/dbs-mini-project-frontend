import Link from "next/link";
import TopNav from "./_components/TopNav";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

const TRENDING_TAGS = [
  "Audio",
  "Smart home",
  "Gaming",
  "Wearables",
  "Accessories",
  "Refurbished",
];

const FEATURED_PRODUCTS = [
  {
    name: "Aurora X1 Noise Canceling Headphones",
    category: "Audio",
    price: "$219",
    rating: "4.8",
    badge: "Top pick",
    summary: "Deep bass, 40 hour battery, and fast USB-C charge.",
    delay: "0.15s",
  },
  {
    name: "Pulse Pro Wireless Earbuds",
    category: "Audio",
    price: "$129",
    rating: "4.7",
    badge: "Hot drop",
    summary: "Pocket case, clear calls, and sweat resistant fit.",
    delay: "0.2s",
  },
  {
    name: "OrbitPad 11 Tablet",
    category: "Tablets",
    price: "$329",
    rating: "4.6",
    badge: "Best value",
    summary: "Slim bezels, 10 hour battery, and stylus support.",
    delay: "0.25s",
  },
  {
    name: "Nexa Smart Home Hub",
    category: "Smart home",
    price: "$89",
    rating: "4.6",
    badge: "New",
    summary: "Voice control, room sensors, and scene automations.",
    delay: "0.3s",
  },
  {
    name: "VoltEdge Gaming Mouse",
    category: "Gaming",
    price: "$59",
    rating: "4.5",
    badge: "Limited",
    summary: "Ultra light shell, 26K DPI, and RGB zones.",
    delay: "0.35s",
  },
  {
    name: "Skyline 4K Action Camera",
    category: "Cameras",
    price: "$249",
    rating: "4.4",
    badge: "Adventure",
    summary: "Waterproof body, 120 fps capture, and stabilizer.",
    delay: "0.4s",
  },
  {
    name: "LiftStand Pro Monitor Arm",
    category: "Accessories",
    price: "$79",
    rating: "4.7",
    badge: "Workspace",
    summary: "Full motion, cable guide, and quick adjust.",
    delay: "0.45s",
  },
  {
    name: "Nimbus Mechanical Keyboard",
    category: "Accessories",
    price: "$149",
    rating: "4.8",
    badge: "Pro",
    summary: "Hot swap keys, quiet switches, and per key lighting.",
    delay: "0.5s",
  },
];

const CATEGORY_SPOTLIGHTS = [
  {
    title: "Smartphones",
    description: "Flagship, midrange, and refurbished deals.",
    cta: "Shop phones",
    href: "/products",
  },
  {
    title: "Laptops",
    description: "Portable power for work, school, and gaming.",
    cta: "Shop laptops",
    href: "/products",
  },
  {
    title: "Smart home",
    description: "Security, lighting, and automation kits.",
    cta: "Shop smart home",
    href: "/products",
  },
  {
    title: "Accessories",
    description: "Chargers, cables, cases, and travel gear.",
    cta: "Shop accessories",
    href: "/products",
  },
];

const ROLE_CARDS = [
  {
    title: "Become a buyer",
    description: "Save favorites, set alerts, and track orders in one place.",
    cta: "Start shopping",
    href: "/buyer/workspace",
  },
  {
    title: "Open a seller storefront",
    description: "Publish listings, manage inventory, and fulfill orders fast.",
    cta: "Start selling",
    href: "/seller/workspace",
  },
  {
    title: "Admin oversight",
    description: "Review users, listings, and category health in one console.",
    cta: "View console",
    href: "/admin/dashboard",
  },
];

export default async function Home() {
  const statsResponse = await fetchMarketplaceStats();
  const marketStats = buildMarketStats(statsResponse?.stats);
  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <main className="shell">
        <section className="hero">
          <div className="animate-rise" style={{ animationDelay: "0.05s" }}>
            <span className="tag">Open marketplace</span>
            <h1 className="hero-title font-display">
              Electronics superstore, built for speed.
            </h1>
            <p className="hero-copy">
              Browse new arrivals, track prices, and build a buyer profile in seconds.
              Sellers get the tools to publish listings and fulfill orders fast.
            </p>
            <div className="hero-actions">
              <Link className="btn-primary" href="/products">
                Browse deals
              </Link>
              <Link className="btn-secondary" href="/buyer/workspace">
                Become a buyer
              </Link>
              <Link className="btn-ghost" href="/seller/workspace">
                Start selling
              </Link>
            </div>
            <form className="hero-search" action="/products" method="get">
              <input
                className="input"
                name="q"
                placeholder="Search laptops, audio, smart home"
              />
              <button className="btn-ghost" type="submit">
                Search
              </button>
            </form>
          </div>
          <div className="card hero-card animate-rise" style={{ animationDelay: "0.2s" }}>
            <div>
              <h2 className="card-title font-display">Live marketplace</h2>
              <p className="card-subtitle">
                Fresh listings, verified sellers, and fast fulfillment.
              </p>
            </div>
            <div className="market-stats">
              {marketStats.map((stat) => (
                <div key={stat.label} className="market-stat">
                  <span className="helper-text">{stat.label}</span>
                  <span className="market-stat__value">{stat.value}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="helper-text">Trending now</p>
              <div className="chip-group">
                {TRENDING_TAGS.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="stack">
          <header className="section-header">
            <span className="tag">Featured</span>
            <h2 className="section-title font-display">Today's top picks</h2>
            <p className="section-subtitle">
              Curated tech with fast delivery and easy returns.
            </p>
          </header>
          <div className="product-grid">
            {FEATURED_PRODUCTS.map((product) => (
              <div
                key={product.name}
                className="card product-card animate-rise"
                style={{ animationDelay: product.delay }}
              >
                <div className="product-card__top">
                  <span className="badge">{product.badge}</span>
                  <span className="helper-text">{product.category}</span>
                </div>
                <h3 className="card-title font-display">{product.name}</h3>
                <p className="card-subtitle">{product.summary}</p>
                <div className="product-card__footer">
                  <span className="price-tag">{product.price}</span>
                  <span className="rating">Rating {product.rating}/5</span>
                </div>
                <Link className="link-arrow" href="/products">
                  View listing
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="stack">
          <header className="section-header">
            <span className="tag">Departments</span>
            <h2 className="section-title font-display">Shop by department</h2>
            <p className="section-subtitle">
              Explore categories with high demand and top rated sellers.
            </p>
          </header>
          <div className="section-grid">
            {CATEGORY_SPOTLIGHTS.map((spotlight, index) => (
              <div
                key={spotlight.title}
                className="card animate-rise"
                style={{ animationDelay: `${0.25 + index * 0.08}s` }}
              >
                <h3 className="card-title font-display">{spotlight.title}</h3>
                <p className="card-subtitle">{spotlight.description}</p>
                <Link className="link-arrow" href={spotlight.href}>
                  {spotlight.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="stack">
          <header className="section-header">
            <span className="tag">Roles</span>
            <h2 className="section-title font-display">Built for every role</h2>
            <p className="section-subtitle">
              Choose a path and start moving inventory or finding deals.
            </p>
          </header>
          <div className="section-grid">
            {ROLE_CARDS.map((role, index) => (
              <div
                key={role.title}
                className="card animate-rise"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <h3 className="card-title font-display">{role.title}</h3>
                <p className="card-subtitle">{role.description}</p>
                <Link className="link-arrow" href={role.href}>
                  {role.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="cta card animate-rise" style={{ animationDelay: "0.7s" }}>
          <div>
            <h2 className="card-title font-display">Ready to build your storefront?</h2>
            <p className="card-subtitle">
              Launch a seller profile or shop as a buyer without leaving the
              marketplace.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn-primary" href="/buyer/workspace">
              Become a buyer
            </Link>
            <Link className="btn-ghost" href="/seller/workspace">
              Start selling
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

async function fetchMarketplaceStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/marketplace/stats`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

function buildMarketStats(stats?: {
  active_listings?: number | string | null;
  verified_sellers?: number | string | null;
  orders_today?: number | string | null;
}) {
  return [
    {
      label: "Active listings",
      value: formatNumber(stats?.active_listings),
    },
    {
      label: "Verified sellers",
      value: formatNumber(stats?.verified_sellers),
    },
    {
      label: "Orders today",
      value: formatNumber(stats?.orders_today),
    },
  ];
}

function formatNumber(value?: number | string | null) {
  if (value === undefined || value === null) {
    return "--";
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return new Intl.NumberFormat("en-US").format(numeric);
}
