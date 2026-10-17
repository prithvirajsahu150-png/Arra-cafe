"use client";

import { useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { MENU_ITEMS, CATEGORIES } from '../../data/menu';
import { useApp, DELIVERY_CHARGE } from '../../context/AppContext';
import './Delivery.css';
import Link from 'next/link';
import '../../components/BookingSection.css'; // For common form inputs

export default function DeliveryPage() {
  const {
    menuItems,
    cart,
    updateCart,
    clearCart,
    cartItems,
    subtotal,
    totalAmount,
    totalItems,
    isCartDrawerOpen,
    setIsCartDrawerOpen
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  // Checkout state
  const [isCheckout, setIsCheckout] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  
  // Confirmation state
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<{
    items: typeof cartItems;
    subtotal: number;
    totalAmount: number;
  } | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({
    name: false,
    phone: false,
    address: false,
    landmark: false,
    pincode: false
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [isTracking, setIsTracking] = useState(false);
  const [orderStatus, setOrderStatus] = useState('placed');

  const validateCustomer = (values: typeof customer) => {
    const errs: Record<string, string> = {};

    if (!values.name.trim()) {
      errs.name = 'Please enter your full name.';
    } else if (values.name.trim().length < 2) {
      errs.name = 'Please enter a valid full name.';
    }

    const cleanPhone = values.phone.replace(/\D/g, '');
    if (!values.phone.trim()) {
      errs.phone = 'Please enter your mobile number.';
    } else if (cleanPhone.length !== 10) {
      errs.phone = 'Mobile number must be 10 digits.';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Please enter a valid Indian mobile number.';
    }

    if (!values.address.trim()) {
      errs.address = 'Please enter your delivery address.';
    } else if (values.address.trim().length < 8) {
      errs.address = 'Please enter a complete delivery address.';
    }

    if (!values.landmark.trim()) {
      errs.landmark = 'Please enter a nearby landmark.';
    }

    const cleanPincode = values.pincode.replace(/\D/g, '');
    if (!values.pincode.trim()) {
      errs.pincode = 'Please enter your pincode.';
    } else if (cleanPincode.length !== 6) {
      errs.pincode = 'Pincode must be exactly 6 digits.';
    } else if (!/^\d{6}$/.test(cleanPincode)) {
      errs.pincode = 'Please enter a valid 6-digit pincode.';
    }

    return errs;
  };

  const errors = useMemo(() => validateCustomer(customer), [customer]);

  const getFieldError = (field: keyof typeof customer) => {
    if ((isSubmitted || touched[field]) && errors[field]) {
      return errors[field];
    }
    return null;
  };

  const handleFieldChange = (field: 'name' | 'address' | 'landmark', value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setCustomer(prev => ({ ...prev, phone: digits }));
  };

  const handlePincodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCustomer(prev => ({ ...prev, pincode: digits }));
  };

  const handleFieldBlur = (field: keyof typeof customer) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Filtered menu items
  const itemsPool = menuItems && menuItems.length > 0 ? menuItems : MENU_ITEMS;
  const filteredItems = useMemo(() => {
    return itemsPool.filter(item => {
      const normActive = activeCategory.trim().toLowerCase();
      const normItemCat = item.category.trim().toLowerCase();
      const matchesCategory = activeCategory === 'ALL' || normItemCat === normActive;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [itemsPool, searchQuery, activeCategory]);

  const handlePlaceOrder = () => {
    setIsSubmitted(true);
    setTouched({
      name: true,
      phone: true,
      address: true,
      landmark: true,
      pincode: true
    });

    const currentErrors = validateCustomer(customer);
    if (Object.keys(currentErrors).length > 0) {
      const fieldOrder: (keyof typeof customer)[] = ['name', 'phone', 'address', 'landmark', 'pincode'];
      const firstInvalid = fieldOrder.find(f => currentErrors[f]);
      if (firstInvalid) {
        const el = document.getElementById(`delivery-${firstInvalid}`);
        if (el) {
          el.focus();
        }
      }
      return;
    }

    const newOrderId = `ARRA-ORD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Save order in database
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          address: `${customer.address}, ${customer.landmark}, ${customer.pincode}`,
        },
        totalAmount,
        paymentMethod,
        items: cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.orderId) {
          setOrderId(data.orderId);
        }
      })
      .catch(console.error);

    setConfirmedOrder({
      items: [...cartItems],
      subtotal,
      totalAmount
    });
    setOrderId(newOrderId);
    setOrderStatus('placed');
    setIsConfirmed(true);
    setIsCartDrawerOpen(false);
    clearCart();
    window.scrollTo(0, 0);
  };

  const trackingSteps = [
    { id: 'placed', label: 'Order Placed' },
    { id: 'confirmed', label: 'Order Confirmed' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready', label: 'Ready' },
    { id: 'out_for_delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' }
  ];

  if (isTracking) {
    const currentStepIndex = trackingSteps.findIndex(s => s.id === orderStatus);
    return (
      <>
        <Navbar />
        <main className="delivery-page">
          <div className="container">
            <div className="tracking-container">
              <div className="tracking-header">
                <h2>ORDER TRACKING</h2>
                <p>Order ID: <strong>{orderId}</strong></p>
              </div>
              
              <div className="tracking-steps">
                {trackingSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isActive = index === currentStepIndex;
                  return (
                    <div key={step.id} className={`tracking-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                      <div className="tracking-icon">
                        {isCompleted ? '✓' : (isActive ? '●' : '○')}
                      </div>
                      <div className="tracking-label">{step.label}</div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button className="btn btn-outline" onClick={() => setIsTracking(false)}>
                  ← BACK TO ORDER DETAILS
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (isConfirmed) {
    return (
      <>
        <Navbar />
        <main className="delivery-page">
          <div className="container">
            <div className="confirmation-screen">
              <div className="success-icon">🎉</div>
              <h2>ORDER CONFIRMED</h2>
              <p>Thank you for your order.</p>
              
              <div className="booking-id-box">
                Order ID: {orderId}
              </div>
              
              <div className="confirmation-details">
                <div className="summary-row">
                  <span className="summary-label">Status:</span>
                  <span className="summary-value text-accent">Order Placed</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Customer:</span>
                  <span className="summary-value">{customer.name} ({customer.phone})</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Address:</span>
                  <span className="summary-value">{customer.address}, {customer.landmark}, {customer.pincode}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Payment Method:</span>
                  <span className="summary-value">{paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</span>
                </div>
                
                <div className="summary-divider"></div>
                <div className="summary-label" style={{ marginBottom: '0.5rem' }}>Items Ordered:</div>
                <div className="selected-items-list">
                  {(confirmedOrder ? confirmedOrder.items : cartItems).map(item => (
                    <div key={item.id} className="selected-item-row">
                      <span>{item.quantity} × {item.name}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="summary-divider"></div>
                
                <div className="summary-row">
                  <span className="summary-label">Subtotal:</span>
                  <span className="summary-value">₹{(confirmedOrder ? confirmedOrder.subtotal : subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Delivery Charge:</span>
                  <span className="summary-value">₹{DELIVERY_CHARGE}</span>
                </div>
                <div className="summary-row summary-total" style={{ marginTop: '0.5rem' }}>
                  <span>Total Amount:</span>
                  <span>₹{(confirmedOrder ? confirmedOrder.totalAmount : totalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div className="confirmation-actions">
                <button className="btn btn-primary" onClick={() => setIsTracking(true)}>
                  TRACK MY ORDER
                </button>
                <Link href="/" className="btn btn-outline">
                  BACK TO HOME
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="delivery-page">
        <div className="container">
          <div className="delivery-header">
            <h1>FOOD DELIVERY</h1>
            <p style={{ color: '#666' }}>Enjoy your Arra Cafe favourites at home.</p>
          </div>
          
          <div className="delivery-layout">
            <div className="menu-section">
              <input 
                type="text" 
                className="search-bar" 
                placeholder="Search for your favourite dishes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="category-filter-wrapper">
                <div className="category-filter">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat} 
                      className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="menu-grid">
                {filteredItems.map(item => {
                  const imageSrc = item.image ? item.image.replace(/^\/public/, '') : null;
                  const isAvailable = item.available !== false;
                  return (
                    <div key={item.id} className="delivery-item-card" style={!isAvailable ? { opacity: 0.7 } : {}}>
                      <div style={{ position: 'relative' }}>
                        {imageSrc ? (
                          <img src={imageSrc} alt={item.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} />
                        ) : (
                          <div style={{ width: '100%', height: '150px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                            Arra Cafe
                          </div>
                        )}
                        {!isAvailable && (
                          <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(198, 40, 40, 0.9)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                            OUT OF STOCK
                          </span>
                        )}
                      </div>
                      <div className="delivery-item-name">{item.name}</div>
                      <div className="delivery-item-price">₹{item.price}</div>
                      <div className="delivery-item-actions">
                        {isAvailable ? (
                          cart[item.id] ? (
                            <div className="quantity-controls">
                              <button className="qty-btn" onClick={() => updateCart(item.id, -1)}>-</button>
                              <span className="qty-display">{cart[item.id]}</span>
                              <button className="qty-btn" onClick={() => updateCart(item.id, 1)}>+</button>
                            </div>
                          ) : (
                            <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => updateCart(item.id, 1)}>
                              ADD +
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#c62828', fontWeight: 600 }}>UNAVAILABLE</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredItems.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#888', gridColumn: '1 / -1' }}>
                    No items found matching your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {!isCartDrawerOpen && !isConfirmed && (
        <button className="floating-cart-btn" onClick={() => setIsCartDrawerOpen(true)}>
          <span>🛒 VIEW CART</span>
          <span>{totalItems} ITEMS • ₹{totalAmount.toLocaleString('en-IN')}</span>
        </button>
      )}

      {isCartDrawerOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsCartDrawerOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h2>{isCheckout ? 'CHECKOUT' : 'YOUR ORDER'}</h2>
              <button className="close-drawer-btn" onClick={() => setIsCartDrawerOpen(false)}>×</button>
            </div>
            
            <div className="cart-drawer-body">
              {cartItems.length === 0 ? (
                <div className="empty-cart">
                  <h3 style={{ marginBottom: '0.5rem' }}>YOUR CART IS EMPTY</h3>
                  <p>Add something delicious from Arra Cafe.</p>
                  <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setIsCartDrawerOpen(false)}>
                    EXPLORE MENU
                  </button>
                </div>
              ) : (
                <>
                  {!isCheckout ? (
                    <div className="cart-items-list">
                      {cartItems.map(item => (
                        <div key={item.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <div className="cart-item-name">{item.name}</div>
                            <div className="cart-item-price">₹{item.price * item.quantity}</div>
                          </div>
                          <div className="quantity-controls" style={{ alignSelf: 'flex-start' }}>
                            <button className="qty-btn" onClick={() => updateCart(item.id, -1)}>-</button>
                            <span className="qty-display">{cart[item.id]}</span>
                            <button className="qty-btn" onClick={() => updateCart(item.id, 1)}>+</button>
                          </div>
                        </div>
                      ))}
                      
                      <button className="btn btn-outline btn-block" style={{ marginTop: '1rem', marginBottom: '2rem' }} onClick={() => setIsCartDrawerOpen(false)}>
                        CONTINUE SHOPPING
                      </button>
                    </div>
                  ) : (
                    <div className="delivery-checkout-form">
                      <h3>Delivery Details</h3>

                      <div className="delivery-form-grid">
                        {/* Row 1: Full Name & Mobile Number */}
                        <div className="delivery-form-row">
                          <div className="delivery-input-group">
                            <label htmlFor="delivery-name">Full Name *</label>
                            <input 
                              id="delivery-name"
                              name="name"
                              type="text" 
                              className={`delivery-form-input ${getFieldError('name') ? 'has-error' : ''}`}
                              placeholder="Enter your full name"
                              value={customer.name}
                              onChange={(e) => handleFieldChange('name', e.target.value)}
                              onBlur={() => handleFieldBlur('name')}
                              autoComplete="name"
                            />
                            {getFieldError('name') && (
                              <span className="delivery-field-error" role="alert">{getFieldError('name')}</span>
                            )}
                          </div>

                          <div className="delivery-input-group">
                            <label htmlFor="delivery-phone">Mobile Number *</label>
                            <input 
                              id="delivery-phone"
                              name="phone"
                              type="tel" 
                              inputMode="tel"
                              className={`delivery-form-input ${getFieldError('phone') ? 'has-error' : ''}`}
                              placeholder="10-digit mobile number"
                              value={customer.phone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              onBlur={() => handleFieldBlur('phone')}
                              autoComplete="tel"
                              maxLength={10}
                            />
                            {getFieldError('phone') && (
                              <span className="delivery-field-error" role="alert">{getFieldError('phone')}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Row 2: Full Delivery Address */}
                        <div className="delivery-input-group full-width">
                          <label htmlFor="delivery-address">Full Delivery Address *</label>
                          <textarea 
                            id="delivery-address"
                            name="address"
                            className={`delivery-form-input delivery-form-textarea ${getFieldError('address') ? 'has-error' : ''}`}
                            rows={3}
                            placeholder="House/Flat No., Building, Street, Area"
                            value={customer.address}
                            onChange={(e) => handleFieldChange('address', e.target.value)}
                            onBlur={() => handleFieldBlur('address')}
                            autoComplete="street-address"
                          />
                          {getFieldError('address') && (
                            <span className="delivery-field-error" role="alert">{getFieldError('address')}</span>
                          )}
                        </div>
                        
                        {/* Row 3: Landmark & Pincode */}
                        <div className="delivery-form-row">
                          <div className="delivery-input-group">
                            <label htmlFor="delivery-landmark">Landmark *</label>
                            <input 
                              id="delivery-landmark"
                              name="landmark"
                              type="text" 
                              className={`delivery-form-input ${getFieldError('landmark') ? 'has-error' : ''}`}
                              placeholder="Nearby landmark"
                              value={customer.landmark}
                              onChange={(e) => handleFieldChange('landmark', e.target.value)}
                              onBlur={() => handleFieldBlur('landmark')}
                            />
                            {getFieldError('landmark') && (
                              <span className="delivery-field-error" role="alert">{getFieldError('landmark')}</span>
                            )}
                          </div>

                          <div className="delivery-input-group">
                            <label htmlFor="delivery-pincode">Pincode *</label>
                            <input 
                              id="delivery-pincode"
                              name="pincode"
                              type="text" 
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`delivery-form-input ${getFieldError('pincode') ? 'has-error' : ''}`}
                              placeholder="6-digit PIN code"
                              value={customer.pincode}
                              onChange={(e) => handlePincodeChange(e.target.value)}
                              onBlur={() => handleFieldBlur('pincode')}
                              autoComplete="postal-code"
                              maxLength={6}
                            />
                            {getFieldError('pincode') && (
                              <span className="delivery-field-error" role="alert">{getFieldError('pincode')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <h3 style={{ marginTop: '1.5rem' }}>Payment Method</h3>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input 
                            type="radio" 
                            name="payment" 
                            checked={paymentMethod === 'COD'} 
                            onChange={() => setPaymentMethod('COD')}
                          />
                          Cash on Delivery
                        </label>
                        <label className="radio-option">
                          <input 
                            type="radio" 
                            name="payment" 
                            checked={paymentMethod === 'ONLINE'} 
                            onChange={() => setPaymentMethod('ONLINE')}
                          />
                          Pay Online
                        </label>
                      </div>
                      
                      {paymentMethod === 'ONLINE' && (
                        <div style={{ padding: '0.85rem 1rem', background: '#fff3cd', color: '#856404', borderRadius: '8px', marginTop: '0.75rem', fontSize: '0.875rem', lineHeight: '1.4' }}>
                          <strong>Note:</strong> Online payment gateway is pending backend integration. By proceeding, you agree to pay securely once redirected.
                        </div>
                      )}

                      <button className="btn btn-outline btn-block" style={{ marginTop: '1.25rem' }} onClick={() => setIsCheckout(false)}>
                        ← BACK TO CART
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-summary">
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Delivery Charge</span>
                    <span>₹{DELIVERY_CHARGE}</span>
                  </div>
                  <div className="cart-total">
                    <span>TOTAL</span>
                    <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                {!isCheckout ? (
                  <button className="btn btn-primary btn-block" onClick={() => {
                    setIsCheckout(true);
                    setIsSubmitted(false);
                  }}>
                    PROCEED TO CHECKOUT
                  </button>
                ) : (
                  <button className="btn btn-primary btn-block" onClick={handlePlaceOrder}>
                    {paymentMethod === 'COD' ? 'PLACE ORDER (COD)' : `PAY ₹${totalAmount.toLocaleString('en-IN')} SECURELY`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
