"use client";

import { useState } from 'react';
import Link from 'next/link';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'HOME', href: '/' },
    { name: 'LOCATION', href: '/location' },
    { name: 'MENU', href: '/menu' },
    { name: 'OFFERS', href: '/#offers' },
    { name: 'ABOUT', href: '/#about' },
    { name: 'FOOD DELIVERY', href: '/#delivery' },
  ];

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link href="/" className="navbar-brand">
          <div className="brand-title">Arra Cafe</div>
          <div className="brand-subtitle">South Tiffin Adda</div>
        </Link>
        
        <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="nav-link"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <button 
          className="hamburger" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span className={`bar ${isOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isOpen ? 'open' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
}
