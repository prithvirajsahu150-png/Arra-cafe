"use client";

import { useState, useMemo, useEffect } from 'react';
import { MENU_ITEMS, CATEGORIES, MenuItem } from '../data/menu';
import { useApp } from '../context/AppContext';
import './BookingSection.css';

export default function BookingSection({ id }: { id?: string }) {
  const {
    menuItems,
    bookingSelectedItems: selectedItems,
    updateBookingItem: updateQuantity,
    clearBookingItems
  } = useApp();

  const itemsPool = menuItems && menuItems.length > 0 ? menuItems : MENU_ITEMS;

  // Form State
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guestsOption, setGuestsOption] = useState('');
  const [customGuests, setCustomGuests] = useState('');
  
  // Special Requirements
  const [specialReqs, setSpecialReqs] = useState({
    decoration: false,
    cakeArrangement: false,
    specialTableSetup: false,
    additionalRequest: ''
  });

  // Customer Details
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Booking Flow State
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [confirmedSummary, setConfirmedSummary] = useState<{
    items: { id: string; name: string; price: number; quantity: number }[];
    total: number;
    advance: number;
    remaining: number;
  } | null>(null);

  // Derived Values
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const handleHashScroll = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#booking') {
        const el = document.getElementById(id || 'booking');
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
    };

    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, [id]);

  const selectedItemsList = useMemo(() => {
    return Object.keys(selectedItems)
      .map(id => {
        const item = itemsPool.find(m => m.id === id);
        if (!item) return null;
        return {
          ...item,
          quantity: selectedItems[id]
        };
      })
      .filter((item): item is MenuItem & { quantity: number } => item !== null && item.quantity > 0);
  }, [selectedItems, itemsPool]);

  const totalAmount = selectedItemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const advanceAmount = totalAmount * 0.40;
  const remainingAmount = totalAmount * 0.60;

  const handlePayment = () => {
    // Validate
    const errors: string[] = [];
    if (!purpose && !customPurpose) errors.push('Please select a purpose for booking.');
    if (purpose === 'Other' && !customPurpose) errors.push('Please enter your custom purpose.');
    if (!date) errors.push('Please select a date.');
    if (!time) errors.push('Please select a time.');
    
    const guestCount = guestsOption === '10+' ? customGuests : guestsOption;
    if (!guestCount || parseInt(guestCount) <= 0) errors.push('Please specify a valid number of guests.');
    
    if (!customer.name.trim()) errors.push('Please enter your full name.');
    if (!customer.phone.trim()) errors.push('Please enter your mobile number.');
    if (totalAmount <= 0) errors.push('Please select at least one menu item.');

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    // Generate booking ID and persist to database
    const newBookingId = `ARRA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purpose: purpose === 'Other' ? customPurpose : purpose,
        customPurpose,
        date,
        time,
        guests: guestCount,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email ? customer.email.trim() : undefined,
        },
        specialRequirements: specialReqs,
        selectedItems: selectedItemsList.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        totalAmount,
        advanceAmount,
        remainingAmount,
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.bookingId) {
          setBookingId(data.bookingId);
        }
      })
      .catch(console.error);

    setConfirmedSummary({
      items: selectedItemsList.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      total: totalAmount,
      advance: advanceAmount,
      remaining: remainingAmount
    });
    setBookingId(newBookingId);
    setIsConfirmed(true);
    setFormErrors([]);
    clearBookingItems();
  };

  const purposes = ['Birthday', 'Anniversary', 'Celebration', 'Family Gathering', 'Small Meeting', 'Normal Dining', 'Other'];
  const guestOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];

  return (
    <section id={id} className="booking-page" style={{ scrollMarginTop: '80px' }}>
      <div className="container">
        {!isConfirmed ? (
          <>
            <div className="booking-header">
              <h1>BOOK A TABLE</h1>
              <p>Make your visit special at Arra Cafe.</p>
            </div>
            
            <div className="booking-form">
              {formErrors.length > 0 && (
                <div className="form-error-summary">
                  <strong>Please fix the following errors:</strong>
                  <ul style={{ listStyle: 'none', marginTop: '0.5rem' }}>
                    {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {/* 1. Purpose */}
              <div className="form-section">
                <h3>1. Purpose of Booking <span className="text-accent">*</span></h3>
                <div className="cards-grid">
                  {purposes.map(p => (
                    <div 
                      key={p} 
                      className={`purpose-card ${purpose === p ? 'selected' : ''}`}
                      onClick={() => setPurpose(p)}
                    >
                      {p}
                    </div>
                  ))}
                </div>
                {purpose === 'Other' && (
                  <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label>Please specify:</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      placeholder="e.g. Kitty Party"
                    />
                  </div>
                )}
              </div>

              {/* 2. Date & Time */}
              <div className="form-section">
                <h3>2. Date & Time <span className="text-accent">*</span></h3>
                <div className="form-row">
                  <div className="input-group">
                    <label>Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={date}
                      min={today}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Time</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Number of Guests */}
              <div className="form-section">
                <h3>3. Number of Guests <span className="text-accent">*</span></h3>
                <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  {guestOptions.map(g => (
                    <div 
                      key={g} 
                      className={`purpose-card ${guestsOption === g ? 'selected' : ''}`}
                      onClick={() => setGuestsOption(g)}
                    >
                      {g}
                    </div>
                  ))}
                </div>
                {guestsOption === '10+' && (
                  <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label>Exact Number of Guests:</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={customGuests}
                      min="10"
                      onChange={(e) => setCustomGuests(e.target.value)}
                      placeholder="e.g. 15"
                    />
                  </div>
                )}
              </div>

              {/* 4. Menu Selection */}
              <div className="form-section">
                <h3>4. Food / Menu Items <span className="text-accent">*</span></h3>
                <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                  Select items for your booking. The remaining 60% will be paid at the cafe.
                </p>
                <div className="menu-selection-container">
                  {CATEGORIES.filter(c => c !== "ALL").map(category => {
                    const itemsInCategory = itemsPool.filter(m => m.category === category && m.available !== false);
                    if (itemsInCategory.length === 0) return null;
                    return (
                      <div key={category} style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ background: '#f5f5f5', padding: '0.5rem', marginBottom: '0.5rem' }}>{category}</h4>
                        {itemsInCategory.map(item => (
                          <div key={item.id} className="menu-item-row">
                            <div className="menu-item-info">
                              <div className="menu-item-name">{item.name}</div>
                              <div className="menu-item-price">₹{item.price}</div>
                            </div>
                            <div className="quantity-controls">
                              <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                              <span className="qty-display">{selectedItems[item.id] || 0}</span>
                              <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Special Requirements */}
              <div className="form-section">
                <h3>5. Special Requirements (Optional)</h3>
                <label className="checkbox-group">
                  <input 
                    type="checkbox" 
                    checked={specialReqs.decoration}
                    onChange={(e) => setSpecialReqs({...specialReqs, decoration: e.target.checked})}
                  />
                  Decoration Required
                </label>
                <label className="checkbox-group">
                  <input 
                    type="checkbox" 
                    checked={specialReqs.cakeArrangement}
                    onChange={(e) => setSpecialReqs({...specialReqs, cakeArrangement: e.target.checked})}
                  />
                  Cake Arrangement
                </label>
                <label className="checkbox-group">
                  <input 
                    type="checkbox" 
                    checked={specialReqs.specialTableSetup}
                    onChange={(e) => setSpecialReqs({...specialReqs, specialTableSetup: e.target.checked})}
                  />
                  Special Table Setup
                </label>
                
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label>Additional Request</label>
                  <textarea 
                    className="form-input" 
                    rows={3}
                    value={specialReqs.additionalRequest}
                    onChange={(e) => setSpecialReqs({...specialReqs, additionalRequest: e.target.value})}
                    placeholder="Any other special instructions..."
                  />
                </div>
              </div>

              {/* 6. Customer Details */}
              <div className="form-section">
                <h3>6. Customer Details <span className="text-accent">*</span></h3>
                <div className="form-row">
                  <div className="input-group">
                    <label>Full Name <span className="text-accent">*</span></label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={customer.name}
                      onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Mobile Number <span className="text-accent">*</span></label>
                    <input 
                      type="tel" 
                      className="form-input"
                      value={customer.phone}
                      onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label>Email Address (Optional)</label>
                  <input 
                    type="email" 
                    className="form-input"
                    value={customer.email}
                    onChange={(e) => setCustomer({...customer, email: e.target.value})}
                  />
                </div>
              </div>

              {/* 7. Summary & Payment */}
              <div className="form-section">
                <h3>7. Booking Summary</h3>
                <div className="summary-card">
                  <div className="summary-row">
                    <span className="summary-label">Purpose:</span>
                    <span className="summary-value">{purpose === 'Other' ? customPurpose || '-' : purpose || '-'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Date:</span>
                    <span className="summary-value">{date || '-'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Time:</span>
                    <span className="summary-value">{time || '-'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Guests:</span>
                    <span className="summary-value">{guestsOption === '10+' ? customGuests || '-' : guestsOption || '-'}</span>
                  </div>
                  
                  {selectedItemsList.length > 0 && (
                    <>
                      <div className="summary-divider"></div>
                      <div className="summary-label" style={{ marginBottom: '0.5rem' }}>Selected Items:</div>
                      <div className="selected-items-list">
                        {selectedItemsList.map(item => (
                          <div key={item.id} className="selected-item-row">
                            <span>{item.quantity} × {item.name}</span>
                            <span>₹{item.price! * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="summary-divider"></div>
                  
                  <div className="summary-row summary-total">
                    <span>TOTAL BOOKING AMOUNT</span>
                    <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="summary-row summary-advance" style={{ marginTop: '1rem' }}>
                    <span>ADVANCE PAYMENT – 40%</span>
                    <span>₹{Math.round(advanceAmount).toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="summary-row summary-remaining">
                    <span>REMAINING – 60%</span>
                    <span>₹{Math.round(remainingAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="submit-container">
                <button 
                  className="btn btn-primary btn-large" 
                  onClick={handlePayment}
                >
                  PAY ₹{Math.round(advanceAmount).toLocaleString('en-IN')} ADVANCE
                </button>
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                  By clicking pay, you will be redirected to a secure payment gateway. (Mocked for now)
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Confirmation Screen */
          <div className="confirmation-screen">
            <div className="success-icon">🎉</div>
            <h2>BOOKING CONFIRMED</h2>
            <p>Thank you for choosing Arra Cafe.</p>
            
            <div className="booking-id-box">
              ID: {bookingId}
            </div>
            
            <div className="confirmation-details">
              <div className="summary-row">
                <span className="summary-label">Purpose:</span>
                <span className="summary-value">{purpose === 'Other' ? customPurpose : purpose}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Date:</span>
                <span className="summary-value">{date}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Time:</span>
                <span className="summary-value">{time}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Guests:</span>
                <span className="summary-value">{guestsOption === '10+' ? customGuests : guestsOption}</span>
              </div>
              
              <div className="summary-divider"></div>
              <div className="summary-label" style={{ marginBottom: '0.5rem' }}>Selected Items:</div>
              <div className="selected-items-list">
                {(confirmedSummary ? confirmedSummary.items : selectedItemsList).map(item => (
                  <div key={item.id} className="selected-item-row">
                    <span>{item.quantity} × {item.name}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>
              
              <div className="summary-row">
                <span className="summary-label">Total Booking Amount:</span>
                <span className="summary-value">₹{(confirmedSummary ? confirmedSummary.total : totalAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-row summary-advance">
                <span className="summary-label" style={{ color: 'inherit' }}>Advance Paid (40%):</span>
                <span className="summary-value">₹{Math.round(confirmedSummary ? confirmedSummary.advance : advanceAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-row summary-remaining">
                <span className="summary-label" style={{ color: 'inherit' }}>Remaining Amount (60%):</span>
                <span className="summary-value">₹{Math.round(confirmedSummary ? confirmedSummary.remaining : remainingAmount).toLocaleString('en-IN')}</span>
              </div>
              
              <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
                Remaining amount is payable after the booking/event is completed.
              </p>
            </div>
            
            <div className="confirmation-actions">
              <button className="btn btn-outline" onClick={() => { setIsConfirmed(false); setConfirmedSummary(null); window.location.hash = ''; window.location.hash = '#booking'; }}>
                MAKE ANOTHER BOOKING
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
