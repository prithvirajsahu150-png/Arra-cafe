"use client";

import { useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import FoodCard from '../../components/FoodCard';
import { CATEGORIES, MENU_ITEMS } from '../../data/menu';
import { useApp } from '../../context/AppContext';
import './Menu.css';

export default function MenuPage() {
  const { menuItems } = useApp();
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const itemsToDisplay = menuItems && menuItems.length > 0 ? menuItems : MENU_ITEMS;

  // Extract dynamic categories if new ones are added
  const allCategories = useMemo(() => {
    const set = new Set<string>(CATEGORIES);
    itemsToDisplay.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [itemsToDisplay]);

  const filteredItems = itemsToDisplay.filter((item) => {
    const normActive = activeCategory.trim().toLowerCase();
    const normItemCat = item.category.trim().toLowerCase();
    const matchesCategory = activeCategory === "ALL" || normItemCat === normActive;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Navbar />
      <main className="menu-main">
        <section className="menu-header">
          <div className="container">
            <span className="menu-eyebrow">OUR MENU</span>
            <h1 className="menu-title">Fresh From Arra</h1>
            <p className="menu-subtitle">Explore our menu and discover your favourites.</p>
          </div>
        </section>

        <section className="menu-controls">
          <div className="container">
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Search menu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="menu-search"
              />
            </div>
            
            <div className="category-scroll-container">
              <div className="category-tabs">
                {allCategories.map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="menu-grid-section">
          <div className="container">
            {filteredItems.length > 0 ? (
              <div className="menu-grid">
                {filteredItems.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <p>No items found matching your criteria.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
