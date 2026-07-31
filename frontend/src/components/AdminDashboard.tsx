'use client';

import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { 
  Users, Gamepad2, Play, AlertCircle, Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip as ChartTooltip, CartesianGrid, BarChart, Bar, Cell 
} from 'recharts';
import styles from '../app/admin/page.module.css';
import CustomDialogModal, { DialogState } from './CustomDialogModal';

interface DashboardData {
  summary: {
    totalUsers: number;
    totalGames: number;
    totalPlays: number;
    avgPlayDuration: number;
  };
  categories: Array<{
    category: string;
    count: number;
    totalPlays: number;
  }>;
  dailyPlaysTrend: Array<{
    date: string;
    count: number;
  }>;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function AdminDashboard() {
  const { token } = useAdminStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeRange, setActiveRange] = useState('Last 7 Days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false });
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';

  const fetchDashboardData = async (range: string, start?: string, end?: string) => {
    setLoading(true);
    setError('');
    try {
      let url = `${backendUrl}/api/admin/dashboard?range=${encodeURIComponent(range)}`;
      if (range === 'Custom Range' && start && end) {
        url += `&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRange !== 'Custom Range') {
      fetchDashboardData(activeRange);
    }
  }, [activeRange]);

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setDialogState({
        isOpen: true,
        type: 'warning',
        title: 'Select Date Range',
        message: 'Please select both start and end dates.'
      });
      return;
    }
    fetchDashboardData('Custom Range', customStart, customEnd);
  };

  if (loading && !data) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>Loading Admin Console...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--color-danger)' }}>
        <AlertCircle size={40} />
        <h2 style={{ color: 'white' }}>Access Denied or Connection Error</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#14b8a6', '#6366f1', '#f43f5e'];
  const ranges = ['Today', 'Last 7 Days', 'Last 28 Days', 'This Month', 'Last 365 Days', 'This Year', 'Custom Range'];

  return (
    <div className={styles.dashboard}>
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>Admin Control Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Monitor performance metrics and system trends.
          </p>
        </div>
      </div>

      {/* Date Range Selector Pill Bar */}
      <div className={styles.dateRangeContainer}>
        <div className={styles.dateRangeBar}>
          {ranges.map((range) => {
            const isActive = activeRange === range;
            return (
              <button
                key={range}
                type="button"
                className={`${styles.dateRangeBtn} ${isActive ? styles.dateRangeBtnActive : ''}`}
                onClick={() => setActiveRange(range)}
              >
                {range}
              </button>
            );
          })}
        </div>

        {/* Custom Range Date Pickers */}
        {activeRange === 'Custom Range' && (
          <form onSubmit={handleApplyCustomRange} className={styles.customRangeInputs}>
            <input
              type="date"
              className={styles.customDateInput}
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch (err) {
                  console.warn('showPicker error:', err);
                }
              }}
              required
            />
            <span style={{ color: 'var(--text-secondary)' }}>to</span>
            <input
              type="date"
              className={styles.customDateInput}
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch (err) {
                  console.warn('showPicker error:', err);
                }
              }}
              required
            />
            <button type="submit" className={styles.customApplyBtn}>
              Apply
            </button>
          </form>
        )}
      </div>

      {/* Summary Row */}
      {data && (
        <div className={styles.summaryGrid}>
          <div className={`${styles.summaryCard} glass`}>
            <div className={`${styles.cardIcon} ${styles.usersIcon}`}>
              <Users size={20} />
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardVal}>{data?.summary.totalUsers}</span>
              <span className={styles.cardLabel}>Registered Gamers</span>
            </div>
          </div>

          <div className={`${styles.summaryCard} glass`}>
            <div className={`${styles.cardIcon} ${styles.gamesIcon}`}>
              <Gamepad2 size={20} />
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardVal}>{data?.summary.totalGames}</span>
              <span className={styles.cardLabel}>Total Games</span>
            </div>
          </div>

          <div className={`${styles.summaryCard} glass`}>
            <div className={`${styles.cardIcon} ${styles.playsIcon}`}>
              <Play size={20} fill="currentColor" />
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardVal}>{data?.summary.totalPlays}</span>
              <span className={styles.cardLabel}>Gameplay Plays</span>
            </div>
          </div>

          <div className={`${styles.summaryCard} glass`}>
            <div className={`${styles.cardIcon} ${styles.playsIcon}`} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
              <Clock size={20} />
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardVal}>{formatDuration(data?.summary.avgPlayDuration || 0)}</span>
              <span className={styles.cardLabel}>Avg Play Duration</span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {data && (
        <div className={styles.chartsGrid}>
          {/* Plays Trend Chart */}
          <div className={`${styles.chartCard} glass`}>
            <h3 className={styles.chartTitle}>
              Daily Plays Trend ({activeRange === 'Custom Range' ? `${customStart || 'Start'} to ${customEnd || 'End'}` : activeRange})
            </h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyPlaysTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#121422', border: '1px solid var(--glass-border)', color: 'white' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Bar Chart */}
          <div className={`${styles.chartCard} glass`}>
            <h3 className={styles.chartTitle}>Plays by Category</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.categories || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#121422', border: '1px solid var(--glass-border)', color: 'white' }}
                  />
                  <Bar dataKey="totalPlays" fill="#ec4899" radius={[4, 4, 0, 0]}>
                    {(data?.categories || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      <CustomDialogModal {...dialogState} onClose={() => setDialogState({ isOpen: false })} />
    </div>
  );
}
