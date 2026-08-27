'use client';

import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { 
  Server, HardDrive, Cpu, Activity, Folder, FileCode, FileText, Image as ImageIcon, 
  Archive, File, RefreshCw, Lock, ChevronRight, Search, Clock,
  Maximize2, Minimize2
} from 'lucide-react';
import styles from '../layout.module.css';

interface SystemOS {
  platform: string;
  release: string;
  arch: string;
  hostname: string;
  uptimeSeconds: number;
  nodeVersion: string;
}

interface SystemCPU {
  usagePercent: number;
  model: string;
  cores: number;
  loadAvg: number[];
}

interface SystemMemory {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
  totalFormatted: string;
  usedFormatted: string;
  freeFormatted: string;
}

interface SystemStorage {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
  totalFormatted: string;
  usedFormatted: string;
  freeFormatted: string;
}

interface ProcessMemory {
  rss: string;
  heapTotal: string;
  heapUsed: string;
}

interface GbGameItem {
  name: string;
  relativePath: string;
  isDir: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  modifiedAt: string;
  createdAt: string;
  itemCount?: number;
  subFolderCount?: number;
  extension?: string;
  fileType: string;
}

interface ServerDetailsResponse {
  readOnly: boolean;
  system: {
    os: SystemOS;
    cpu: SystemCPU;
    memory: SystemMemory;
    storage: SystemStorage;
    processMemory: ProcessMemory;
  };
  gbGames: {
    rootDirectory: string;
    currentPath: string;
    totalSizeFormatted: string;
    totalFilesCount: number;
    totalFoldersCount: number;
    items: GbGameItem[];
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ') || '0m';
}

function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return isoString;
  }
}

export default function AdminServerDetailsPage() {
  const { token, globalSearchQuery } = useAdminStore();
  const [data, setData] = useState<ServerDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentSubPath, setCurrentSubPath] = useState<string>('');
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(10);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [localSearch, setLocalSearch] = useState<string>('');
  const [compactMetrics, setCompactMetrics] = useState<boolean>(false); // EXPANDED BY DEFAULT per user request

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3102';

  const fetchServerDetails = async (subPath = currentSubPath, isBackground = false) => {
    if (!token) return;
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const url = `${backendUrl}/api/admin/server-details${subPath ? `?subPath=${encodeURIComponent(subPath)}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const json: ServerDetailsResponse = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch server details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServerDetails(currentSubPath, false);
  }, [token, currentSubPath]);

  // Auto-refresh interval timer
  useEffect(() => {
    if (autoRefreshSec <= 0) return;
    const interval = setInterval(() => {
      fetchServerDetails(currentSubPath, true);
    }, autoRefreshSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshSec, currentSubPath, token]);

  const getItemIcon = (item: GbGameItem) => {
    if (item.isDir) return <Folder size={18} style={{ color: '#38bdf8' }} />;
    if (item.fileType === 'HTML Document') return <FileCode size={18} style={{ color: '#f97316' }} />;
    if (item.fileType === 'JavaScript') return <FileCode size={18} style={{ color: '#eab308' }} />;
    if (item.fileType === 'Stylesheet') return <FileText size={18} style={{ color: '#a855f7' }} />;
    if (item.fileType === 'Image') return <ImageIcon size={18} style={{ color: '#ec4899' }} />;
    if (item.fileType === 'ZIP Archive') return <Archive size={18} style={{ color: '#10b981' }} />;
    return <File size={18} style={{ color: '#94a3b8' }} />;
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 85) return '#ef4444'; // Red
    if (percent >= 70) return '#f59e0b'; // Amber / Yellow
    return '#10b981'; // Green / Teal
  };

  const breadcrumbs = currentSubPath ? currentSubPath.split('/').filter(Boolean) : [];
  const activeSearch = globalSearchQuery || localSearch;

  const filteredItems = (data?.gbGames.items || []).filter(item => {
    if (!activeSearch) return true;
    return item.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
           item.relativePath.toLowerCase().includes(activeSearch.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#e2e8f0', paddingBottom: '2rem' }}>
      
      {/* Top Bar: Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={22} style={{ color: '#38bdf8' }} /> Server Details & Inspector
          </h1>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.3rem', 
            padding: '0.2rem 0.6rem', 
            borderRadius: '9999px', 
            background: 'rgba(245, 158, 11, 0.12)', 
            border: '1px solid rgba(245, 158, 11, 0.3)', 
            color: '#fbbf24', 
            fontSize: '0.725rem', 
            fontWeight: 600 
          }}>
            <Lock size={11} /> View-Only Mode
          </span>
        </div>

        {/* Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Toggle Compact vs Expanded Metrics */}
          <button
            onClick={() => setCompactMetrics(!compactMetrics)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              background: !compactMetrics ? 'rgba(56, 189, 248, 0.12)' : '#1e293b',
              border: !compactMetrics ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: !compactMetrics ? '#38bdf8' : '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title={compactMetrics ? "Expand detailed server cards" : "Collapse to compact 1-line bar"}
          >
            {!compactMetrics ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{!compactMetrics ? 'Expanded Mode (Active)' : 'Compact Mode'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.35rem 0.65rem', fontSize: '0.775rem', color: '#94a3b8' }}>
            <Clock size={13} />
            <span>Auto Refresh:</span>
            <select 
              value={autoRefreshSec} 
              onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
            >
              <option value={0} style={{ background: '#0f172a' }}>Off</option>
              <option value={5} style={{ background: '#0f172a' }}>5s</option>
              <option value={10} style={{ background: '#0f172a' }}>10s</option>
              <option value={30} style={{ background: '#0f172a' }}>30s</option>
            </select>
          </div>

          <button
            onClick={() => fetchServerDetails(currentSubPath, false)}
            disabled={loading || refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: loading || refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={13} className={loading || refreshing ? styles.spin : ''} />
            <span>{loading || refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Section: Expanded Cards (Default) vs Compact Bar */}
      {!compactMetrics ? (
        /* EXPANDED FULL CARDS GRID (DEFAULT) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', flexShrink: 0 }}>
          
          {/* 1. Storage Metric Card */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Server Storage (Disk)</span>
              <HardDrive size={18} style={{ color: '#38bdf8' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc' }}>
                {data?.system.storage.usagePercent ?? 0}%
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Capacity Used</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.85rem' }}>
              <div style={{ width: `${data?.system.storage.usagePercent ?? 0}%`, height: '100%', background: getUsageColor(data?.system.storage.usagePercent ?? 0) }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Total Storage:</span>
                <strong style={{ color: '#f8fafc' }}>{data?.system.storage.totalFormatted ?? '-'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Used Storage:</span>
                <strong style={{ color: getUsageColor(data?.system.storage.usagePercent ?? 0), fontWeight: 700 }}>
                  {data?.system.storage.usedFormatted ?? '-'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Available Free:</span>
                <strong style={{ color: '#10b981' }}>{data?.system.storage.freeFormatted ?? '-'}</strong>
              </div>
            </div>
          </div>

          {/* 2. CPU Metric Card */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live CPU Usage</span>
              <Cpu size={18} style={{ color: '#a855f7' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc' }}>
                {data?.system.cpu.usagePercent ?? 0}%
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Load Active</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.85rem' }}>
              <div style={{ width: `${data?.system.cpu.usagePercent ?? 0}%`, height: '100%', background: getUsageColor(data?.system.cpu.usagePercent ?? 0) }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>CPU Cores:</span>
                <strong style={{ color: '#f8fafc' }}>{data?.system.cpu.cores ?? 0} Cores</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Load Average (1m):</span>
                <strong style={{ color: '#38bdf8' }}>{data?.system.cpu.loadAvg ? data.system.cpu.loadAvg[0].toFixed(2) : '-'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Architecture:</span>
                <strong style={{ color: '#cbd5e1' }}>{data?.system.os.arch ?? '-'}</strong>
              </div>
            </div>
          </div>

          {/* 3. RAM / Memory Metric Card */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>RAM / Memory</span>
              <Activity size={18} style={{ color: '#10b981' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc' }}>
                {data?.system.memory.usagePercent ?? 0}%
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Allocated</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.85rem' }}>
              <div style={{ width: `${data?.system.memory.usagePercent ?? 0}%`, height: '100%', background: getUsageColor(data?.system.memory.usagePercent ?? 0) }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Total RAM:</span>
                <strong style={{ color: '#f8fafc' }}>{data?.system.memory.totalFormatted ?? '-'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Used RAM:</span>
                <strong style={{ color: getUsageColor(data?.system.memory.usagePercent ?? 0), fontWeight: 700 }}>
                  {data?.system.memory.usedFormatted ?? '-'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Available Free:</span>
                <strong style={{ color: '#10b981' }}>{data?.system.memory.freeFormatted ?? '-'}</strong>
              </div>
            </div>
          </div>

          {/* 4. OS & System Uptime Metric Card */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>OS Environment & Uptime</span>
              <Server size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.35rem' }}>
              {data ? formatUptime(data.system.os.uptimeSeconds) : '-'}
            </div>
            <div style={{ height: '6px', marginBottom: '0.85rem' }} />
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Platform / OS:</span>
                <strong style={{ color: '#f8fafc' }}>{data?.system.os.platform ?? '-'} ({data?.system.os.arch ?? '-'})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Node.js Runtime:</span>
                <strong style={{ color: '#10b981' }}>{data?.system.os.nodeVersion ?? '-'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Process RSS:</span>
                <strong style={{ color: '#38bdf8' }}>{data?.system.processMemory.rss ?? '-'}</strong>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* COMPACT HORIZONTAL BAR (WHEN TOGGLED) */
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '0.75rem',
          flexShrink: 0 
        }}>
          {/* Storage Mini Pill */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <HardDrive size={18} style={{ color: '#38bdf8' }} />
              <div>
                <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Storage (Disk)</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  {data?.system.storage.usagePercent ?? 0}% <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>(Used: {data?.system.storage.usedFormatted ?? '-'})</span>
                </div>
              </div>
            </div>
            <div style={{ width: '40px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${data?.system.storage.usagePercent ?? 0}%`, height: '100%', background: getUsageColor(data?.system.storage.usagePercent ?? 0) }} />
            </div>
          </div>

          {/* CPU Mini Pill */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Cpu size={18} style={{ color: '#a855f7' }} />
              <div>
                <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>CPU Usage</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  {data?.system.cpu.usagePercent ?? 0}% <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>({data?.system.cpu.cores ?? 0} Cores)</span>
                </div>
              </div>
            </div>
            <div style={{ width: '40px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${data?.system.cpu.usagePercent ?? 0}%`, height: '100%', background: getUsageColor(data?.system.cpu.usagePercent ?? 0) }} />
            </div>
          </div>

          {/* RAM Mini Pill */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Activity size={18} style={{ color: '#10b981' }} />
              <div>
                <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>RAM / Memory</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  {data?.system.memory.usagePercent ?? 0}% <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>(Used: {data?.system.memory.usedFormatted ?? '-'})</span>
                </div>
              </div>
            </div>
            <div style={{ width: '40px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${data?.system.memory.usagePercent ?? 0}%`, height: '100%', background: getUsageColor(data?.system.memory.usagePercent ?? 0) }} />
            </div>
          </div>

          {/* OS Mini Pill */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Server size={18} style={{ color: '#f59e0b' }} />
              <div>
                <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>OS & Uptime</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
                  {data ? formatUptime(data.system.os.uptimeSeconds) : '-'} <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 500 }}>({data?.system.os.platform ?? '-'})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* gb-games Directory Inspector Container */}
      <div style={{ 
        background: '#0f172a', 
        border: '1px solid rgba(255, 255, 255, 0.08)', 
        borderRadius: '14px', 
        padding: '1.25rem',
        marginTop: '0.25rem'
      }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Folder size={20} style={{ color: '#38bdf8' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              gb-games Directory Inspector
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
              backend/gb-games
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.775rem', color: '#94a3b8', background: '#1e293b', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              Size: <strong style={{ color: '#f8fafc' }}>{data?.gbGames.totalSizeFormatted ?? '0 MB'}</strong>
            </span>
            <span style={{ fontSize: '0.775rem', color: '#94a3b8', background: '#1e293b', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              Total Files: <strong style={{ color: '#f8fafc' }}>{data?.gbGames.totalFilesCount ?? 0}</strong>
            </span>
          </div>
        </div>

        {/* Breadcrumbs & Filter Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '0.75rem', 
          background: '#1e293b', 
          padding: '0.6rem 0.85rem', 
          borderRadius: '8px', 
          marginBottom: '0.75rem',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Breadcrumb Path Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentSubPath('')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentSubPath ? '#38bdf8' : '#f8fafc', 
                fontWeight: 600, 
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px'
              }}
            >
              gb-games (Root)
            </button>

            {breadcrumbs.map((crumb, idx) => {
              const crumbPath = breadcrumbs.slice(0, idx + 1).join('/');
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumbPath}>
                  <ChevronRight size={13} style={{ color: '#64748b' }} />
                  <button
                    onClick={() => setCurrentSubPath(crumbPath)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isLast ? '#f8fafc' : '#38bdf8',
                      fontWeight: isLast ? 700 : 500,
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px'
                    }}
                  >
                    {crumb}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Search Filter Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0f172a', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Search size={13} style={{ color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Filter items..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.8rem', outline: 'none', width: '160px' }}
            />
          </div>
        </div>

        {/* Scrollable File Table with STICKY Headers */}
        <div style={{ maxHeight: '550px', overflowY: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0b1324', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.65rem 0.85rem' }}>Name</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Type</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Size</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Details</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={22} className={styles.spin} style={{ marginBottom: '0.5rem', color: '#38bdf8' }} />
                    <div>Scanning gb-games directory...</div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    No matching files or subdirectories found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr 
                    key={item.relativePath}
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                      cursor: item.isDir ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (item.isDir) {
                        setCurrentSubPath(item.relativePath);
                      }
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 600, color: item.isDir ? '#38bdf8' : '#f8fafc' }}>
                      {getItemIcon(item)}
                      <span>{item.name}</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', color: '#cbd5e1' }}>
                      <span style={{ 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '5px', 
                        fontSize: '0.725rem', 
                        fontWeight: 600,
                        background: item.isDir ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                        color: item.isDir ? '#38bdf8' : '#94a3b8'
                      }}>
                        {item.fileType}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
                      {item.sizeFormatted}
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', color: '#94a3b8', fontSize: '0.775rem' }}>
                      {item.isDir ? `${item.itemCount ?? 0} files contained` : (item.extension || 'file')}
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', color: '#94a3b8', fontSize: '0.775rem' }}>
                      {formatDate(item.modifiedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
