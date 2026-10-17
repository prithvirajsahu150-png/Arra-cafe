"use client";

import { useRouter } from 'next/navigation';
import { MenuItem } from '../data/menu';
import { useApp } from '../context/AppContext';
import './FoodCard.css';

interface FoodCardProps {
  item: MenuItem;
}

export default function FoodCard({ item }: FoodCardProps) {
  const router = useRouter();
  const { addToCart, setIsCartDrawerOpen, addBookingItem } = useApp();
  const imageSrc = item.image ? item.image.replace(/^\/public/, '') : null;
  const isAvailable = item.available !== false;

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAvailable) return;
    addToCart(item.id, 1);
    setIsCartDrawerOpen(true);
    router.push('/delivery');
  };

  const handleDining = (e: React.MouseEvent) => {
    e.preventDefault();
    addBookingItem(item.id, 1);
    router.push('/#booking');
  };

  return (
    <div className={`food-card ${!isAvailable ? 'unavailable-card' : ''}`}>
      <div className="food-image-container">
        {imageSrc ? (
          <img src={imageSrc} alt={item.name} className="food-image" />
        ) : (
          <div className="food-image-placeholder">
            <span className="placeholder-text">Arra Cafe</span>
          </div>
        )}
        {!isAvailable && (
          <span className="food-card-unavailable-badge">OUT OF STOCK</span>
        )}
      </div>
      <div className="food-content">
        <h3 className="food-name">{item.name}</h3>
        {item.description && <p className="food-description">{item.description}</p>}
        <div className="food-price">₹{item.price}</div>
        <div className="food-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleOrderNow}
            disabled={!isAvailable}
            style={!isAvailable ? { opacity: 0.5, cursor: 'not-allowed', background: '#999' } : {}}
          >
            {isAvailable ? 'ORDER NOW' : 'UNAVAILABLE'}
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm" 
            style={{ borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
            onClick={handleDining}
          >
            DINING
          </button>
        </div>
      </div>
    </div>
  );
}
