"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './OffersSection.css';

interface OfferDisplay {
  id: string | number;
  title: string;
  discount: string;
  description: string;
  coupon: string | null;
  ctaLabel: string;
  ctaLink: string;
}

const DEFAULT_OFFERS: OfferDisplay[] = [
  {
    id: 'offer-1',
    title: "FIRST ORDER SPECIAL",
    discount: "15% OFF",
    description: "Get 15% off on your first food delivery order.",
    coupon: "ARRA15",
    ctaLabel: "ORDER NOW",
    ctaLink: "/delivery"
  },
  {
    id: 'offer-2',
    title: "WEEKEND TREAT",
    discount: "20% OFF",
    description: "Enjoy your favourite dishes every Saturday & Sunday.",
    coupon: "WEEKEND20",
    ctaLabel: "ORDER NOW",
    ctaLink: "/delivery"
  },
  {
    id: 'offer-3',
    title: "BIRTHDAY SPECIAL",
    discount: "FREE DESSERT",
    description: "Celebrate your special day with a complimentary dessert on eligible bookings.",
    coupon: null,
    ctaLabel: "BOOK A TABLE",
    ctaLink: "/#booking"
  },
  {
    id: 'offer-4',
    title: "COFFEE & COMBO",
    discount: "BUY 2 GET 1",
    description: "Choose selected beverages and enjoy one extra on us.",
    coupon: null,
    ctaLabel: "ORDER NOW",
    ctaLink: "/delivery"
  },
  {
    id: 'offer-5',
    title: "FAMILY FEAST",
    discount: "₹200 OFF",
    description: "Get ₹200 off on orders above ₹1,499.",
    coupon: "FAMILY200",
    ctaLabel: "ORDER NOW",
    ctaLink: "/delivery"
  },
  {
    id: 'offer-6',
    title: "DINE-IN SPECIAL",
    discount: "10% OFF",
    description: "Enjoy 10% off on selected dine-in orders.",
    coupon: null,
    ctaLabel: "BOOK A TABLE",
    ctaLink: "/#booking"
  }
];

export default function OffersSection({ id }: { id?: string }) {
  const [offers, setOffers] = useState<OfferDisplay[]>(DEFAULT_OFFERS);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch active offers from database
  useEffect(() => {
    fetch('/api/offers')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.offers) && data.offers.length > 0) {
          const mapped: OfferDisplay[] = data.offers.map((o: {
            id: string;
            title: string;
            discount: string;
            description: string;
            couponCode?: string | null;
            offerType?: string;
          }) => ({
            id: o.id,
            title: o.title,
            discount: o.discount,
            description: o.description,
            coupon: o.couponCode || null,
            ctaLabel: o.title.toLowerCase().includes('dining') || o.title.toLowerCase().includes('table') || o.title.toLowerCase().includes('birthday') ? 'BOOK A TABLE' : 'ORDER NOW',
            ctaLink: o.title.toLowerCase().includes('dining') || o.title.toLowerCase().includes('table') || o.title.toLowerCase().includes('birthday') ? '/#booking' : '/delivery'
          }));
          setOffers(mapped);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_OFFERS
      });
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <section id={id} className="offers-section" style={{ scrollMarginTop: '80px' }}>
      <div className="container">
        <div className="section-header text-center">
          <span className="section-eyebrow">SPECIAL OFFERS</span>
          <h2 className="section-title">Something special is always waiting for you at Arra Cafe.</h2>
        </div>

        <div className="offers-grid">
          {offers.map((offer) => (
            <div key={offer.id} className="offer-card">
              <div className="offer-badge">SPECIAL OFFER</div>
              <div className="offer-discount">{offer.discount}</div>
              <h3 className="offer-title">{offer.title}</h3>
              <p className="offer-description">{offer.description}</p>
              
              {offer.coupon ? (
                <div className="offer-coupon">
                  <div className="coupon-code">{offer.coupon}</div>
                  <button 
                    className="copy-btn" 
                    onClick={() => handleCopy(offer.coupon!)}
                  >
                    {copiedCode === offer.coupon ? 'COPIED ✓' : 'COPY CODE'}
                  </button>
                </div>
              ) : (
                <div className="offer-coupon no-coupon">
                  <div className="coupon-code">No coupon required</div>
                </div>
              )}
              
              <div className="offer-actions">
                <Link href={offer.ctaLink} className="btn btn-outline btn-block">
                  {offer.ctaLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
