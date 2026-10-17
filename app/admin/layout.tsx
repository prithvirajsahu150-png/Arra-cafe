"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './AdminLayout.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(null);

  const isLoginPage = pathname === '/admin/login';

  // Check auth user info if not on login page
  useEffect(() => {
    if (!isLoginPage) {
      fetch('/api/auth/me')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Not authenticated');
        })
        .then(data => {
          if (data?.user) setAdminUser(data.user);
        })
        .catch(() => {
          router.push('/admin/login');
        });
    }
  }, [isLoginPage, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  // If on login page, render clean page without dashboard chrome
  if (isLoginPage) {
    return <div className="admin-login-wrapper">{children}</div>;
  }

  // Exact 7 navigation items required
  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊', exact: true },
    { label: 'Menu', href: '/admin/menu', icon: '🍽️', exact: true },
    { label: 'View Menu', href: '/admin/menu/view', icon: '👁️', exact: false },
    { label: 'Book Table', href: '/admin/bookings', icon: '📅', exact: false },
    { label: 'Offers', href: '/admin/offers', icon: '🏷️', exact: false },
    { label: 'Payments', href: '/admin/payments', icon: '💳', exact: false },
  ];

  const getPageTitle = () => {
    if (pathname.includes('/admin/menu/view')) return 'View Menu';
    if (pathname.includes('/admin/menu')) return 'Menu Management';
    if (pathname.includes('/admin/bookings')) return 'Book Table Management';
    if (pathname.includes('/admin/offers')) return 'Offers Management';
    if (pathname.includes('/admin/payments')) return 'Payments';
    return 'Admin Dashboard';
  };

  return (
    <div className="admin-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-brand-info">
            <h2>Arra Cafe</h2>
            <span>Admin Panel</span>
          </div>
          <span className="admin-badge">Owner</span>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* 7. Logout */}
          <button
            type="button"
            className="admin-nav-item logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle admin menu"
            >
              ☰
            </button>
            <h1 className="topbar-title">{getPageTitle()}</h1>
          </div>

          <div className="topbar-right">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="view-site-link"
            >
              <span>🌐</span>
              <span>View Customer Site ↗</span>
            </Link>

            {adminUser && (
              <div className="admin-user-pill">
                <span>👤 {adminUser.name}</span>
              </div>
            )}
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
