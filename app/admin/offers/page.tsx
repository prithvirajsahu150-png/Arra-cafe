"use client";

import React, { useState, useEffect } from 'react';
import './AdminOffers.css';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  couponCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  active: boolean;
  offerType: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDiscount, setFormDiscount] = useState('');
  const [formCoupon, setFormCoupon] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formOfferType, setFormOfferType] = useState('PERCENTAGE');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/offers');
      if (!res.ok) throw new Error('Failed to load offers');
      const data = await res.json();
      if (data.ok && Array.isArray(data.offers)) {
        setOffers(data.offers);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching offers';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOpenAdd = () => {
    setEditingOffer(null);
    setFormTitle('');
    setFormDesc('');
    setFormDiscount('');
    setFormCoupon('');
    setFormStartDate('');
    setFormEndDate('');
    setFormActive(true);
    setFormOfferType('PERCENTAGE');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormTitle(offer.title);
    setFormDesc(offer.description);
    setFormDiscount(offer.discount);
    setFormCoupon(offer.couponCode || '');
    setFormStartDate(offer.startDate || '');
    setFormEndDate(offer.endDate || '');
    setFormActive(offer.active);
    setFormOfferType(offer.offerType || 'PERCENTAGE');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleActive = async (offer: Offer) => {
    const original = offer.active;
    setOffers(prev =>
      prev.map(o => (o.id === offer.id ? { ...o, active: !original } : o))
    );

    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to toggle offer');
      }
    } catch (err: unknown) {
      setOffers(prev =>
        prev.map(o => (o.id === offer.id ? { ...o, active: original } : o))
      );
      const message = err instanceof Error ? err.message : 'Error updating offer status';
      alert(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Offer title is required.');
      return;
    }
    if (!formDesc.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (!formDiscount.trim()) {
      setFormError('Discount value is required (e.g. 20% OFF or Flat ₹100).');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingOffer) {
        const res = await fetch(`/api/admin/offers/${editingOffer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDesc.trim(),
            discount: formDiscount.trim(),
            couponCode: formCoupon.trim() || null,
            startDate: formStartDate || null,
            endDate: formEndDate || null,
            active: formActive,
            offerType: formOfferType,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update offer');
        setOffers(prev => prev.map(o => (o.id === editingOffer.id ? data.offer : o)));
      } else {
        const res = await fetch('/api/admin/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDesc.trim(),
            discount: formDiscount.trim(),
            couponCode: formCoupon.trim() || null,
            startDate: formStartDate || null,
            endDate: formEndDate || null,
            active: formActive,
            offerType: formOfferType,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create offer');
        setOffers(prev => [data.offer, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving offer';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/offers/${offerToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to delete offer');
      setOffers(prev => prev.filter(o => o.id !== offerToDelete.id));
      setOfferToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deleting offer';
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="offers-admin-container">
      {/* Header */}
      <div className="offers-admin-header">
        <div className="offers-admin-title">
          <h2>OFFERS MANAGEMENT</h2>
          <p>Create and manage discount codes, festival specials, and promotions shown on the cafe website.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleOpenAdd}
        >
          + ADD OFFER
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
          Loading promotional offers...
        </div>
      ) : offers.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#888', background: '#fff', borderRadius: '12px', border: '1px solid #ebe7e1' }}>
          No offers currently available. Click &quot;+ ADD OFFER&quot; to create one.
        </div>
      ) : (
        <div className="offers-grid">
          {offers.map(offer => (
            <div
              key={offer.id}
              className={`offer-admin-card ${!offer.active ? 'inactive' : ''}`}
            >
              <div>
                <div className="offer-card-top">
                  <span className="offer-badge-discount">{offer.discount}</span>
                  <div className="availability-toggle-wrap">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={offer.active}
                        onChange={() => handleToggleActive(offer)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className={`toggle-label-text ${offer.active ? 'on' : 'off'}`}>
                      {offer.active ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>

                <h3 className="offer-title-text">{offer.title}</h3>
                <p className="offer-desc-text">{offer.description}</p>

                <div className="offer-meta-info">
                  {offer.couponCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Coupon:</span>
                      <span className="coupon-code-pill">{offer.couponCode}</span>
                    </div>
                  )}
                  <div>
                    <span>Type: </span>
                    <strong style={{ color: '#444' }}>{offer.offerType}</strong>
                  </div>
                  {(offer.startDate || offer.endDate) && (
                    <div>
                      <span>Validity: </span>
                      <span>
                        {offer.startDate ? offer.startDate : 'Anytime'} &rarr;{' '}
                        {offer.endDate ? offer.endDate : 'Ongoing'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="offer-card-footer">
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: offer.active ? '#2e7d32' : '#888',
                  }}
                >
                  {offer.active ? '● Live on Website' : '○ Inactive'}
                </span>

                <div className="table-actions">
                  <button
                    type="button"
                    className="btn-action-edit"
                    onClick={() => handleOpenEdit(offer)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-action-delete"
                    onClick={() => setOfferToDelete(offer)}
                    title="Delete Offer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Offer Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingOffer ? 'Edit Offer' : 'Add New Offer'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ color: '#c62828', fontSize: '0.85rem', background: '#ffebee', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                    {formError}
                  </div>
                )}

                {/* Offer Title */}
                <div className="form-group-admin">
                  <label>Offer Title *</label>
                  <input
                    type="text"
                    className="form-input-admin"
                    placeholder="e.g. Weekend Special 20% Off"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-group-admin">
                  <label>Description *</label>
                  <textarea
                    rows={3}
                    className="form-input-admin"
                    placeholder="e.g. Get 20% off on all main courses and pizzas this Saturday & Sunday."
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    required
                  />
                </div>

                {/* Discount / Value & Offer Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group-admin">
                    <label>Discount / Value *</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      placeholder="e.g. 20% OFF or ₹150 OFF"
                      value={formDiscount}
                      onChange={e => setFormDiscount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group-admin">
                    <label>Offer Type</label>
                    <select
                      className="form-input-admin"
                      value={formOfferType}
                      onChange={e => setFormOfferType(e.target.value)}
                    >
                      <option value="PERCENTAGE">Percentage Discount</option>
                      <option value="FLAT">Flat Cash Discount</option>
                      <option value="BOGO">Buy 1 Get 1 (BOGO)</option>
                      <option value="SPECIAL">Special Combo</option>
                    </select>
                  </div>
                </div>

                {/* Coupon Code (Optional) */}
                <div className="form-group-admin">
                  <label>Coupon Code (Optional)</label>
                  <input
                    type="text"
                    className="form-input-admin"
                    placeholder="e.g. ARRA20"
                    value={formCoupon}
                    onChange={e => setFormCoupon(e.target.value.toUpperCase())}
                  />
                </div>

                {/* Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group-admin">
                    <label>Start Date (Optional)</label>
                    <input
                      type="date"
                      className="form-input-admin"
                      value={formStartDate}
                      onChange={e => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>End Date (Optional)</label>
                    <input
                      type="date"
                      className="form-input-admin"
                      value={formEndDate}
                      onChange={e => setFormEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Active ON/OFF */}
                <div className="form-group-admin" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Active on Website:</label>
                  <div className="availability-toggle-wrap">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={e => setFormActive(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className={`toggle-label-text ${formActive ? 'on' : 'off'}`}>
                      {formActive ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {offerToDelete && (
        <div className="modal-overlay" onClick={() => setOfferToDelete(null)}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setOfferToDelete(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>
                Are you sure you want to delete offer <strong>{offerToDelete.title}</strong>?
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#c62828', fontSize: '0.85rem' }}>
                This promo will immediately be removed from the customer website.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setOfferToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
