"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './AdminLogin.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      // Successful login -> Redirect to admin dashboard
      router.push(from);
      router.refresh();
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <h1 className="login-brand-title">Arra Cafe</h1>
        <span className="login-brand-sub">South Tiffin Adda</span>
        <span className="login-badge">Admin Portal</span>
      </div>

      {error && (
        <div className="login-error-alert" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="login-form-group">
          <label htmlFor="admin-email">Email Address</label>
          <input
            id="admin-email"
            type="email"
            className="login-input"
            placeholder="admin@arracafe.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div className="login-form-group">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            className="login-input"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="login-hint-box">
        Default Owner Login:<br />
        Email: <code>admin@arracafe.com</code><br />
        Password: <code>admin123</code>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="login-card" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
