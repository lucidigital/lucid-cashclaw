import { useState } from 'react';
import { supabase } from '../data/supabaseClient';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Sai email hoặc mật khẩu'
        : authError.message);
      setLoading(false);
      return;
    }

    // Remember me is handled by Supabase session persistence by default
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />

      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-logo">
          <span className="login-logo-icon">💰</span>
          <h1 className="login-title">CashClaw</h1>
          <p className="login-subtitle">Lucid Digital Post-House</p>
        </div>

        {error && (
          <div className="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="login-field">
          <label className="login-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="login-input"
            type="email"
            placeholder="headquarter@lucid.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
          />
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            className="login-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <label className="login-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
          />
          <span>Nhớ đăng nhập</span>
        </label>

        <button
          className="login-btn"
          type="submit"
          disabled={loading || !email || !password}
        >
          {loading ? (
            <span className="login-spinner" />
          ) : (
            <>🔐 Đăng nhập</>
          )}
        </button>

        <p className="login-footer">
          Quản lý tài chính nội bộ — Chỉ dành cho team HQ
        </p>
      </form>
    </div>
  );
}
