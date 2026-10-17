"use client";

import React, { useState, useEffect, useMemo } from 'react';
import './AdminBookings.css';

interface BookingItem {
  name: string;
  quantity: number;
  price: number;
}

interface Booking {
  id: string;
  bookingId: string;
  purpose: string;
  date: string;
  time: string;
  guests: number | string;
  customer: {
    name: string;
    phone?: string;
    mobile?: string;
    email?: string;
  };
  selectedItems: BookingItem[];
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  bookingStatus: 'Payment Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) throw new Error('Failed to load bookings');
      const data = await res.json();
      if (data.ok && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching bookings';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (
    bookingId: string,
    newStatus: 'Payment Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
  ) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingStatus: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update booking status');
      }

      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, bookingStatus: newStatus } : b))
      );
      if (selectedBookingForDetails && selectedBookingForDetails.id === bookingId) {
        setSelectedBookingForDetails(prev => (prev ? { ...prev, bookingStatus: newStatus } : null));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating status';
      alert(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesStatus = statusFilter === 'ALL' || b.bookingStatus === statusFilter;
      const q = search.toLowerCase().trim();
      const phone = b.customer?.phone || b.customer?.mobile || '';
      const matchesSearch =
        q === '' ||
        b.bookingId.toLowerCase().includes(q) ||
        b.customer.name.toLowerCase().includes(q) ||
        phone.includes(q) ||
        b.purpose.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, search]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'confirmed';
      case 'Completed':
        return 'completed';
      case 'Cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  return (
    <div className="bookings-admin-container">
      {/* Header */}
      <div className="bookings-admin-header">
        <div className="bookings-admin-title">
          <h2>BOOK TABLE MANAGEMENT</h2>
          <p>View reservations, guest details, 40% advance split, and update booking status.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={fetchBookings}
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
            placeholder="Search by customer name, mobile, booking ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            className="category-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses ({bookings.length})</option>
            <option value="Payment Pending">Payment Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Bookings Table */}
      <div className="bookings-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            Loading bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>📅</div>
            <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#444' }}>No bookings yet</div>
            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
              Real customer bookings will appear here once submitted through the website.
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Guests & Purpose</th>
                  <th>Selected Items</th>
                  <th>Amount (40% / 60%)</th>
                  <th>Payment</th>
                  <th>Booking Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--admin-text)' }}>
                        {b.bookingId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customer.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#777' }}>📞 {b.customer?.phone || b.customer?.mobile || '-'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.date}</div>
                      <div style={{ fontSize: '0.8rem', color: '#777' }}>⏰ {b.time}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>👥 {b.guests} Guests</div>
                      <div style={{ fontSize: '0.78rem', color: '#777' }}>{b.purpose || 'Casual Dining'}</div>
                    </td>
                    <td>
                      {b.selectedItems && b.selectedItems.length > 0 ? (
                        <button
                          type="button"
                          className="items-preview-pill"
                          onClick={() => setSelectedBookingForDetails(b)}
                        >
                          📦 {b.selectedItems.reduce((acc, i) => acc + i.quantity, 0)} Items ↗
                        </button>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td>
                      <div className="amount-split-tag">
                        <span className="total-amt">Total: ₹{b.totalAmount}</span>
                        <span className="advance-amt">Advance 40%: ₹{b.advanceAmount}</span>
                        <span className="remaining-amt">Remaining 60%: ₹{b.remainingAmount}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: b.paymentStatus === 'Paid Full' || b.paymentStatus === 'Partial Paid (40%)' ? '#2e7d32' : '#f57f17',
                        }}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(b.bookingStatus)}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td>
                      <select
                        className="status-select-inline"
                        value={b.bookingStatus}
                        disabled={updatingId === b.id}
                        onChange={e =>
                          handleStatusChange(
                            b.id,
                            e.target.value as 'Payment Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
                          )
                        }
                      >
                        <option value="Payment Pending">Payment Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Details Modal */}
      {selectedBookingForDetails && (
        <div className="modal-overlay" onClick={() => setSelectedBookingForDetails(null)}>
          <div className="modal-dialog" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking Details ({selectedBookingForDetails.bookingId})</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedBookingForDetails(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#faf9f6', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>CUSTOMER</div>
                  <div style={{ fontWeight: 600 }}>{selectedBookingForDetails.customer.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#555' }}>📞 {selectedBookingForDetails.customer?.phone || selectedBookingForDetails.customer?.mobile || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>RESERVATION</div>
                  <div style={{ fontWeight: 600 }}>{selectedBookingForDetails.date} at {selectedBookingForDetails.time}</div>
                  <div style={{ fontSize: '0.82rem', color: '#555' }}>👥 {selectedBookingForDetails.guests} Guests ({selectedBookingForDetails.purpose})</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>Pre-ordered Dining Items</h4>
                {selectedBookingForDetails.selectedItems.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '0.85rem' }}>No pre-ordered menu items selected for this reservation.</p>
                ) : (
                  <div style={{ border: '1px solid #ebe7e1', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead style={{ background: '#f5f2ec' }}>
                        <tr>
                          <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Item</th>
                          <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Price</th>
                          <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBookingForDetails.selectedItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f0ede8' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{item.name}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>₹{item.price}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                              ₹{item.price * item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
                  <span>Total Amount:</span>
                  <span>₹{selectedBookingForDetails.totalAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2e7d32', fontWeight: 600, fontSize: '0.9rem' }}>
                  <span>Advance 40% (Paid / Due):</span>
                  <span>₹{selectedBookingForDetails.advanceAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d12068', fontWeight: 600, fontSize: '0.9rem' }}>
                  <span>Remaining 60% (At Cafe):</span>
                  <span>₹{selectedBookingForDetails.remainingAmount}</span>
                </div>
              </div>

              {/* Status Controls inside Modal */}
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Update Booking Status:</label>
                <select
                  className="status-select-inline"
                  value={selectedBookingForDetails.bookingStatus}
                  onChange={e =>
                    handleStatusChange(
                      selectedBookingForDetails.id,
                      e.target.value as 'Payment Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
                    )
                  }
                >
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedBookingForDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
