"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

export default function TopNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const MenuIcon = sidebarOpen ? X : Menu;

  return (
    <>
      <header className="top-nav">
        <div className="top-nav__inner">
          <div className="top-nav__left">
            <button
              className="menu-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <MenuIcon className="menu-icon-svg" aria-hidden="true" />
            </button>
            <Link className="brand" href="/">
              Electronics Marketplace
            </Link>
          </div>
        </div>
      </header>
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
    </>
  );
}
