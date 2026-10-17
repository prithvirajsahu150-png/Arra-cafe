"use client";

import React, { useState, useEffect, useMemo } from 'react';
import './AdminPayments.css';

interface Payment {
  id: string;
  paymentReference: string;
  bookingId?: string | null;
  orderId?: string | null;
  customerName: string;
  customerPhone: string;
  type: 'Booking Advance' | 'Food Delivery' | 'Dining Remaining';
  amount: number;
  status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  method?: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/payments');
      if (!res.ok) throw new Error('Failed to load payments');
      const data = await res.json();
      if (data.ok && Array.isArray(data.payments)) {
        setPayments(data.payments);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching payments';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
      const q = search.toLowerCase().trim();
      const refId = p.paymentReference?.toLowerCase() || '';
      const orderId = (p.bookingId || p.orderId || '').toLowerCase();
      const customer = (p.customerName || '').toLowerCase();
      const phone = p.customerPhone || '';

      const matchesSearch =
        q === '' ||
        refId.includes(q) ||
        orderId.includes(q) ||
        customer.includes(q) ||
        phone.includes(q);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [payments, statusFilter, typeFilter, search]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'paid';
      case 'Pending':
        return 'pending';
      case 'Failed':
        return 'failed';
      case 'Refunded':
        return 'refunded';
      default:
        return '';
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: '-', time: '-' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: '' };
      return {
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  return (
    <div className="payments-admin-container">
      {/* Header */}
      <div className="payments-admin-header">
        <div className="payments-admin-title">
          <h2>PAYMENTS & TRANSACTIONS</h2>
          <p>Safe gateway transaction references, payment types, customer metadata, and status records.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={fetchPayments}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bookings-controls-card">
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search reference, booking ID, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            className="category-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Payment Types</option>
            <option value="Booking Advance">Booking Advance</option>
            <option value="Food Delivery">Food Delivery</option>
            <option value="Dining Remaining">Dining Remaining</option>
          </select>
        </div>

        <div>
          <select
            className="category-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses ({payments.length})</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Payments Table */}
      <div className="payments-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            Loading payment records...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>💳</div>
            <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#444' }}>No payments yet</div>
            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
              Actual payment transactions will appear here once processed by the customer checkout.
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payment ID / Reference</th>
                  <th>Order / Booking ID</th>
                  <th>Customer</th>
                  <th>Payment Type</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => {
                  const { date, time } = formatDateTime(p.createdAt);
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="ref-code">{p.paymentReference}</span>
                        {p.method && (
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.15rem' }}>
                            {p.method}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {p.bookingId || p.orderId || '-'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#777' }}>📞 {p.customerPhone}</div>
                      </td>
                      <td>
                        <span className="type-pill">{p.type}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-primary)' }}>
                          ₹{p.amount}
                        </span>
                      </td>
                      <td>
                        <span className={`payment-badge ${getStatusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#444' }}>{date}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#777' }}>{time}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
