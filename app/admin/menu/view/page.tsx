"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import './ViewMenu.css';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  description?: string;
  available: boolean;
}

export default function AdminViewMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/admin/menu')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load menu');
        return res.json();
      })
      .then(data => {
        if (data.ok && Array.isArray(data.items)) {
          setItems(data.items);
        }
      })
      .catch(err => {
        setError(err.message || 'Error fetching menu items');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Group items by category
  const groupedCategories = useMemo(() => {
    const groups: { [cat: string]: MenuItem[] } = {};

    const filtered = items.filter(item => {
      const matchesSearch =
        search.trim() === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchesCat =
        activeCategoryFilter === 'ALL' ||
        item.category.toLowerCase() === activeCategoryFilter.toLowerCase();
      return matchesSearch && matchesCat;
    });

    filtered.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return groups;
  }, [items, search, activeCategoryFilter]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => set.add(i.category));
    return Array.from(set).sort();
  }, [items]);

  return (
    <div className="view-menu-container">
      {/* Header */}
      <div className="view-menu-header">
        <div className="view-menu-header-text">
          <h2>VIEW MENU</h2>
          <p>Real-time customer view of your menu items, categories, prices, and live status.</p>
        </div>
        <Link
          href="/menu"
          target="_blank"
          rel="noopener noreferrer"
          className="view-customer-btn"
        >
          <span>👁️</span>
          <span>VIEW CUSTOMER MENU ↗</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #ebe7e1' }}>
        <input
          type="text"
          placeholder="Filter items by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '0.65rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '0.9rem',
          }}
        />
        <select
          value={activeCategoryFilter}
          onChange={e => setActiveCategoryFilter(e.target.value)}
          style={{
            minWidth: '220px',
            padding: '0.65rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '0.9rem',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Categories ({items.length} items)</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
          Loading menu preview from database...
        </div>
      ) : Object.keys(groupedCategories).length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#888', background: '#fff', borderRadius: '12px', border: '1px solid #ebe7e1' }}>
          No items match your criteria.
        </div>
      ) : (
        Object.entries(groupedCategories).map(([categoryName, categoryItems]) => (
          <section key={categoryName} className="view-category-section">
            <div className="category-header-title">
              <h3>{categoryName}</h3>
              <span className="category-count-badge">
                {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="customer-cards-grid">
              {categoryItems.map(item => (
                <div key={item.id} className="customer-item-card">
                  <div className="customer-card-media">
                    {item.image ? (
                      <img
                        src={item.image.replace(/^\/public/, '')}
                        alt={item.name}
                        className="customer-card-img"
                        onError={e => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="customer-card-placeholder">ARRA CAFE</span>
                    )}

                    <span
                      className={`availability-pill ${
                        item.available ? 'available' : 'unavailable'
                      }`}
                    >
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="customer-card-body">
                    <h4 className="customer-card-title">{item.name}</h4>
                    <span className="customer-card-category">{item.category}</span>
                    {item.description && (
                      <p className="customer-card-desc">{item.description}</p>
                    )}

                    <div className="customer-card-footer">
                      <span className="customer-card-price">₹{item.price}</span>
                      <span
                        className={`customer-status-text ${
                          item.available ? 'ok' : 'no'
                        }`}
                      >
                        {item.available ? '● In Stock' : '○ Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
