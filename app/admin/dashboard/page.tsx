"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import './AdminDashboard.css';

interface DashboardStats {
  todayBookingsCount: number;
  pendingBookingsCount: number;
  activeMenuItemsCount: number;
  inactiveMenuItemsCount: number;
  activeOffersCount: number;
  totalRevenue: number;
  recentPayments: Array<{
    id: string;
    paymentReference: string;
    customerName: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  recentBookings: Array<{
    id: string;
    bookingId: string;
    customer: { name: string; phone: string };
    date: string;
    time: string;
    totalAmount: number;
    bookingStatus: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.ok) setStats(data.stats);
      })
      .catch(err => console.error('Failed to load stats', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div>
          <h2>Welcome back to Arra Cafe Admin</h2>
          <p>Manage your menu items, table bookings, special offers, and payments in one place.</p>
        </div>
        <div className="quick-action-btns">
          <Link href="/admin/menu" className="btn-admin btn-admin-primary">
            <span>+</span> Add Menu Item
          </Link>
          <Link href="/admin/bookings" className="btn-admin btn-admin-outline">
            View Bookings
          </Link>
        </div>
      </div>

      {/* 6 Required Summary Cards */}
      <div className="stats-grid">
        {/* 1. Today's Bookings */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Today&apos;s Bookings</span>
            <span className="stat-value">{loading ? '...' : stats?.todayBookingsCount ?? 0}</span>
          </div>
          <span className="stat-icon">📅</span>
        </div>

        {/* 2. Pending Bookings */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Pending Bookings</span>
            <span className="stat-value" style={{ color: '#ef6c00' }}>
              {loading ? '...' : stats?.pendingBookingsCount ?? 0}
            </span>
          </div>
          <span className="stat-icon">⏳</span>
        </div>

        {/* 3. Active Menu Items */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Active Menu Items</span>
            <span className="stat-value" style={{ color: '#2e7d32' }}>
              {loading ? '...' : stats?.activeMenuItemsCount ?? 0}
            </span>
          </div>
          <span className="stat-icon">🍽️</span>
        </div>

        {/* 4. Inactive Menu Items */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Inactive Menu Items</span>
            <span className="stat-value" style={{ color: '#888' }}>
              {loading ? '...' : stats?.inactiveMenuItemsCount ?? 0}
            </span>
          </div>
          <span className="stat-icon">🚫</span>
        </div>

        {/* 5. Active Offers */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Active Offers</span>
            <span className="stat-value" style={{ color: '#d12068' }}>
              {loading ? '...' : stats?.activeOffersCount ?? 0}
            </span>
          </div>
          <span className="stat-icon">🏷️</span>
        </div>

        {/* 6. Recent Payments Total */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Recent Payments</span>
            <span className="stat-value">
              ₹{loading ? '...' : (stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="stat-icon">💳</span>
        </div>
      </div>

      {/* Tables: Recent Bookings & Recent Payments */}
      <div className="dashboard-tables-grid">
        {/* Recent Bookings */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Recent Bookings</h3>
            <Link href="/admin/bookings" className="panel-link">View All Bookings →</Link>
          </div>
          {loading ? (
            <p style={{ color: '#888', padding: '1rem' }}>Loading bookings...</p>
          ) : (stats?.recentBookings.length ?? 0) === 0 ? (
            <p style={{ color: '#888', padding: '1.25rem', textAlign: 'center' }}>No bookings yet.</p>
          ) : (
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Date &amp; Time</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentBookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.bookingId}</strong></td>
                    <td>{b.customer.name}</td>
                    <td>{b.date} {b.time}</td>
                    <td>₹{b.totalAmount}</td>
                    <td>
                      <span className={`badge-status ${
                        b.bookingStatus === 'Confirmed' ? 'badge-success' :
                        b.bookingStatus === 'Payment Pending' ? 'badge-warning' :
                        b.bookingStatus === 'Completed' ? 'badge-info' : 'badge-danger'
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Payments */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Recent Payments</h3>
            <Link href="/admin/payments" className="panel-link">View All Payments →</Link>
          </div>
          {loading ? (
            <p style={{ color: '#888', padding: '1rem' }}>Loading payments...</p>
          ) : (stats?.recentPayments.length ?? 0) === 0 ? (
            <p style={{ color: '#888', padding: '1.25rem', textAlign: 'center' }}>No payments yet.</p>
          ) : (
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentPayments.map(p => (
                  <tr key={p.id}>
                    <td><small>{p.paymentReference}</small></td>
                    <td>{p.customerName}</td>
                    <td>{p.type}</td>
                    <td><strong>₹{p.amount}</strong></td>
                    <td>
                      <span className={`badge-status ${
                        p.status === 'Paid' ? 'badge-success' :
                        p.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
