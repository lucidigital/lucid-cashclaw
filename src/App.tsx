import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './data/supabaseClient';
import { DataProvider } from './data/DataContext';
import type { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Transactions from './pages/Transactions';
import DebtReview from './pages/DebtReview';
import BudgetForecast from './pages/BudgetForecast';
import People from './pages/People';
import Login from './pages/Login';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setChecking(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s)
    );

    return () => subscription.unsubscribe();
  }, []);

  // Still checking auth → show nothing (prevents flash)
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary, #0F0E17)',
        color: 'var(--text-muted, #666)',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💰</div>
          <div>Đang kiểm tra đăng nhập...</div>
        </div>
      </div>
    );
  }

  // Not logged in → show Login
  if (!session) {
    return <Login />;
  }

  // Logged in → show app
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/people" element={<People />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budget" element={<BudgetForecast />} />
            <Route path="/debt" element={<DebtReview />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
