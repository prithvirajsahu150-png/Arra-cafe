"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import './AdminMenu.css';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  description?: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formAvailable, setFormAvailable] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getImageSrc = (img: string | null | undefined) => {
    if (!img) return null;
    return img.replace(/^\/public/, '');
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/menu');
      if (!res.ok) {
        throw new Error('Failed to load menu items');
      }
      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error loading menu';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        search.trim() === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, search]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(categories[0] || 'VEG BURGER & SANDWICH');
    setFormPrice('');
    setFormDescription('');
    setFormImage(null);
    setFormAvailable(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormDescription(item.description || '');
    setFormImage(item.image);
    setFormAvailable(item.available);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Photo selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setFormError('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Photo upload failed');
      }

      setFormImage(data.url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload photo';
      setFormError(message);
    } finally {
      setIsUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Toggle availability
  const handleToggleAvailability = async (item: MenuItem) => {
    const originalAvailable = item.available;
    // Optimistic UI update
    setItems(prev =>
      prev.map(i => (i.id === item.id ? { ...i, available: !originalAvailable } : i))
    );

    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update availability');
      }
    } catch (err: unknown) {
      // Revert optimistic update
      setItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, available: originalAvailable } : i))
      );
      const message = err instanceof Error ? err.message : 'Error updating availability';
      alert(message);
    }
  };

  // Save (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Item name is required.');
      return;
    }
    if (!formCategory.trim()) {
      setFormError('Category is required.');
      return;
    }
    if (formPrice === '' || isNaN(Number(formPrice)) || Number(formPrice) < 0) {
      setFormError('Please enter a valid price in ₹.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingItem) {
        // Edit item
        const res = await fetch(`/api/admin/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            category: formCategory.trim(),
            price: Number(formPrice),
            description: formDescription.trim(),
            image: formImage,
            available: formAvailable,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Failed to update item');
        }

        setItems(prev => prev.map(i => (i.id === editingItem.id ? data.item : i)));
      } else {
        // Add new item
        const res = await fetch('/api/admin/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            category: formCategory.trim(),
            price: Number(formPrice),
            description: formDescription.trim(),
            image: formImage,
            available: formAvailable,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Failed to create item');
        }

        setItems(prev => [data.item, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save item';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Item
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/menu/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to delete item');
      }

      setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deleting item';
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="menu-admin-container">
      {/* Header */}
      <div className="menu-admin-header">
        <div className="menu-admin-title-wrap">
          <h2>MENU MANAGEMENT</h2>
          <p>Manage cafe menu items, prices, photos, and live availability.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleOpenAdd}
        >
          + ADD NEW ITEM
        </button>
      </div>

      {/* Controls Bar: Search & Category Filter */}
      <div className="menu-controls-card">
        <div className="search-box-wrap">
          <input
            type="text"
            className="search-input"
            placeholder="Search menu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="category-select-wrap">
          <select
            className="category-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories ({items.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Menu Table Card */}
      <div className="menu-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            Loading menu items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            No menu items found matching your search.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-item-cell">
                        <div className="item-thumb-box">
                          {item.image ? (
                            <img
                              src={getImageSrc(item.image) || ''}
                              alt={item.name}
                              className="item-thumb-img"
                              onError={e => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="item-thumb-placeholder">ARRA</span>
                          )}
                        </div>
                        <div>
                          <div className="item-name-text">{item.name}</div>
                          {item.description && (
                            <div className="item-desc-text">{item.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">{item.category}</span>
                    </td>
                    <td>
                      <span className="price-text">₹{item.price}</span>
                    </td>
                    <td>
                      <div className="availability-toggle-wrap">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={item.available}
                            onChange={() => handleToggleAvailability(item)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className={`toggle-label-text ${item.available ? 'on' : 'off'}`}>
                          {item.available ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => handleOpenEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => setItemToDelete(item)}
                          title="Delete Item"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Menu Item' : 'Add New Item'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ color: '#c62828', fontSize: '0.85rem', background: '#ffebee', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                    {formError}
                  </div>
                )}

                {/* Category */}
                <div className="form-group-admin">
                  <label>Category *</label>
                  <input
                    type="text"
                    list="category-suggestions"
                    className="form-input-admin"
                    placeholder="e.g. VEG BURGER & SANDWICH"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    required
                  />
                  <datalist id="category-suggestions">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* Item Name */}
                <div className="form-group-admin">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    className="form-input-admin"
                    placeholder="e.g. Veg Club Sandwich"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                  />
                </div>

                {/* Price */}
                <div className="form-group-admin">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-input-admin"
                    placeholder="e.g. 199"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    required
                  />
                </div>

                {/* Description (Optional) */}
                <div className="form-group-admin">
                  <label>Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input-admin"
                    placeholder="Short description or ingredients"
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                  />
                </div>

                {/* Photo Upload */}
                <div className="form-group-admin">
                  <label>Item Photo</label>
                  <div className="photo-uploader-box">
                    {formImage ? (
                      <div className="photo-preview-container">
                        <img
                          src={getImageSrc(formImage) || ''}
                          alt="Preview"
                          className="photo-preview-img"
                        />
                        <div className="photo-preview-actions">
                          <span style={{ fontSize: '0.78rem', color: '#2e7d32', fontWeight: 600 }}>
                            ✓ Photo Selected
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary"
                              onClick={() => galleryInputRef.current?.click()}
                              disabled={isUploading}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            >
                              📁 Gallery
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary"
                              onClick={() => cameraInputRef.current?.click()}
                              disabled={isUploading}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            >
                              📸 Camera
                            </button>
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() => setFormImage(null)}
                              disabled={isUploading}
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-prompt-wrap">
                        <span className="upload-icon">📷</span>
                        <span className="upload-text-main">
                          {isUploading ? 'Uploading Photo...' : 'Upload Food Photo'}
                        </span>
                        <div className="upload-choice-buttons">
                          <button
                            type="button"
                            className="btn-upload-choice"
                            onClick={() => galleryInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <span>📁 Choose from Gallery</span>
                          </button>
                          <button
                            type="button"
                            className="btn-upload-choice camera"
                            onClick={() => cameraInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <span>📸 Take Photo (Camera)</span>
                          </button>
                        </div>
                        <span className="upload-text-sub">
                          Works seamlessly on mobile phone camera & photo library. No file paths required.
                        </span>
                      </div>
                    )}

                    {/* Hidden inputs: Gallery (standard) and Camera (capture=environment) */}
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {/* Availability */}
                <div className="form-group-admin" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Available for Orders:</label>
                  <div className="availability-toggle-wrap">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formAvailable}
                        onChange={e => setFormAvailable(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className={`toggle-label-text ${formAvailable ? 'on' : 'off'}`}>
                      {formAvailable ? 'ON' : 'OFF'}
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
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="modal-overlay" onClick={() => setItemToDelete(null)}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setItemToDelete(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>{itemToDelete.name}</strong> (₹{itemToDelete.price})?
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#c62828', fontSize: '0.85rem' }}>
                This action will permanently remove the item from the database and customer menu.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setItemToDelete(null)}
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
                {isDeleting ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
