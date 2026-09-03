"use client";

import Link from "next/link";
import { useStoredUser } from "@/lib/useStoredUser";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Briefcase,
  Heart,
  Home,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tags,
  Truck,
  Users,
} from "lucide-react";

type SidebarProps = {
  isOpen: boolean;
  onNavigate?: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type UserRole = "buyer" | "seller" | "admin" | "guest";

const MARKETPLACE_SECTION: NavSection = {
  title: "Marketplace",
  items: [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Browse products", icon: ShoppingBag },
  ],
};

const GUEST_SECTIONS: NavSection[] = [
  MARKETPLACE_SECTION,
  {
    title: "Get started",
    items: [
      { href: "/buyer/workspace", label: "Become a buyer", icon: ShoppingCart },
      { href: "/seller/workspace", label: "Start selling", icon: Briefcase },
      { href: "/admin/dashboard", label: "Admin overview", icon: Shield },
    ],
  },
];

const BUYER_SECTIONS: NavSection[] = [
  MARKETPLACE_SECTION,
  {
    title: "Buyer",
    items: [
      { href: "/buyer/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/buyer/workspace", label: "Workspace", icon: Briefcase },
      { href: "/buyer/orders", label: "Orders", icon: ShoppingCart },
      { href: "/buyer/wishlist", label: "Wishlist", icon: Heart },
      { href: "/buyer/alerts", label: "Alerts", icon: Bell },
      { href: "/buyer/reviews", label: "Reviews", icon: Star },
      { href: "/buyer/settings", label: "Settings", icon: Settings },
    ],
  },
];

const SELLER_SECTIONS: NavSection[] = [
  MARKETPLACE_SECTION,
  {
    title: "Seller",
    items: [
      { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/seller/workspace", label: "Workspace", icon: Briefcase },
      { href: "/seller/products", label: "Products", icon: Package },
      { href: "/seller/orders", label: "Orders", icon: Truck },
      { href: "/seller/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ADMIN_SECTIONS: NavSection[] = [
  MARKETPLACE_SECTION,
  {
    title: "Admin",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: Shield },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const NAV_SECTIONS_BY_ROLE: Record<UserRole, NavSection[]> = {
  guest: GUEST_SECTIONS,
  buyer: BUYER_SECTIONS,
  seller: SELLER_SECTIONS,
  admin: ADMIN_SECTIONS,
};

export default function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const { user } = useStoredUser();
  const role: UserRole = user?.role ?? "guest";
  const sections = NAV_SECTIONS_BY_ROLE[role];

  return (
    <aside
      className={`sidebar${isOpen ? " sidebar--open" : ""}`}
      aria-label="Primary navigation"
    >
      {sections.map((section) => (
        <div key={section.title} className="sidebar__section">
          <span className="sidebar__label">{section.title}</span>
          <div className="sidebar__links">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  className="sidebar__link"
                  href={item.href}
                  onClick={onNavigate}
                >
                  <span className="sidebar__icon" aria-hidden="true">
                    <Icon className="sidebar__icon-svg" />
                  </span>
                  <span className="sidebar__text">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
