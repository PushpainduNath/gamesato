'use client';

import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { 
  Server, HardDrive, Cpu, Activity, Folder, FileCode, FileText, Image as ImageIcon, 
  Archive, File, RefreshCw, Lock, ChevronRight, Search, Clock, CheckCircle2
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
    if (item.isDir) return <Folder size={20} style={{ color: '#38bdf8' }} />;
    if (item.fileType === 'HTML Document') return <FileCode size={20} style={{ color: '#f97316' }} />;
    if (item.fileType === 'JavaScript') return <FileCode size={20} style={{ color: '#eab308' }} />;
    if (item.fileType === 'Stylesheet') return <FileText size={20} style={{ color: '#a855f7' }} />;
    if (item.fileType === 'Image') return <ImageIcon size={20} style={{ color: '#ec4899' }} />;
    if (item.fileType === 'ZIP Archive') return <Archive size={20} style={{ color: '#10b981' }} />;
    return <File size={20} style={{ color: '#94a3b8' }} />;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#e2e8f0', paddingBottom: '3rem' }}>
      
      {/* Header Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
              Server Details & Metrics
            </h1>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              padding: '0.25rem 0.65rem', 
              borderRadius: '9999px', 
              background: 'rgba(245, 158, 11, 0.12)', 
              border: '1px solid rgba(245, 158, 11, 0.3)', 
              color: '#fbbf24', 
              fontSize: '0.75rem', 
              fontWeight: 600 
            }}>
              <Lock size={12} /> View-Only Mode
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Real-time server storage, CPU, RAM performance metrics, and read-only <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8' }}>gb-games</code> static build inspector.
          </p>
        </div>

        {/* Auto Refresh & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <Clock size={14} />
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
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: loading || refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={14} className={loading || refreshing ? styles.spin : ''} />
            <span>{loading || refreshing ? 'Updating...' : 'Refresh Now'}</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0.85rem 1.25rem', 
        background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)', 
        borderLeft: '4px solid #14b8a6', 
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={18} style={{ color: '#14b8a6', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
            System Status: <strong>All Server Subsystems Operating Normally</strong>. Read-Only mode is enforced across all file operations.
          </span>
        </div>
        {lastUpdated && (
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Last Sync: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Real-time Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        
        {/* 1. Storage Metric Card */}
        <div style={{ 
          background: '#0f172a', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '14px', 
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Server Storage (Disk)
              </span>
              <HardDrive size={22} style={{ color: '#38bdf8' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
                {data?.system.storage.usagePercent ?? 0}%
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Used</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ 
                width: `${data?.system.storage.usagePercent ?? 0}%`, 
                height: '100%', 
                background: getUsageColor(data?.system.storage.usagePercent ?? 0),
                borderRadius: '9999px',
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Total Storage:</span>
                <span style={{ fontWeight: 600 }}>{data?.system.storage.totalFormatted ?? '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Used Storage:</span>
                <span style={{ fontWeight: 600, color: getUsageColor(data?.system.storage.usagePercent ?? 0) }}>{data?.system.storage.usedFormatted ?? '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Available Free:</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{data?.system.storage.freeFormatted ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CPU Metric Card */}
        <div style={{ 
          background: '#0f172a', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '14px', 
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live CPU Usage
              </span>
              <Cpu size={22} style={{ color: '#a855f7' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
                {data?.system.cpu.usagePercent ?? 0}%
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Capacity</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ 
                width: `${data?.system.cpu.usagePercent ?? 0}%`, 
                height: '100%', 
                background: getUsageColor(data?.system.cpu.usagePercent ?? 0),
                borderRadius: '9999px',
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>CPU Cores:</span>
                <span style={{ fontWeight: 600 }}>{data?.system.cpu.cores ?? 0} Cores</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Load Average (1m):</span>
                <span style={{ fontWeight: 600 }}>{data?.system.cpu.loadAvg ? data.system.cpu.loadAvg[0].toFixed(2) : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#94a3b8' }}>Architecture:</span>
                <span style={{ fontWeight: 600 }}>{data?.system.os.arch ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. System RAM Metric Card */}
        <div style={{ 
          background: '#0f172a', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '14px', 
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                RAM / Memory
              </span>
              <Activity size={22} style={{ color: '#10b981' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
                {data?.system.memory.usagePercent ?? 0}%
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Allocated</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ 
                width: `${data?.system.memory.usagePercent ?? 0}%`, 
                height: '100%', 
                background: getUsageColor(data?.system.memory.usagePercent ?? 0),
                borderRadius: '9999px',
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Total RAM:</span>
                <span style={{ fontWeight: 600 }}>{data?.system.memory.totalFormatted ?? '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Used RAM:</span>
                <span style={{ fontWeight: 600, color: getUsageColor(data?.system.memory.usagePercent ?? 0) }}>{data?.system.memory.usedFormatted ?? '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Process RSS:</span>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>{data?.system.processMemory.rss ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OS Environment Card */}
        <div style={{ 
          background: '#0f172a', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '14px', 
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                OS Environment & Uptime
              </span>
              <Server size={22} style={{ color: '#f59e0b' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                {data ? formatUptime(data.system.os.uptimeSeconds) : '-'}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Uptime</span>
            </div>

            <div style={{ height: '8px', marginBottom: '1rem' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Platform / OS:</span>
                <span style={{ fontWeight: 600 }}>{data?.system.os.platform ?? '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Hostname:</span>
                <span style={{ fontWeight: 600 }}>{data?.system.os.hostname ?? '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Node.js Runtime:</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{data?.system.os.nodeVersion ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* gb-games Directory & File Inspector Section */}
      <div style={{ 
        background: '#0f172a', 
        border: '1px solid rgba(255, 255, 255, 0.08)', 
        borderRadius: '16px', 
        padding: '1.5rem',
        marginTop: '0.5rem'
      }}>
        {/* Inspector Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Folder size={22} style={{ color: '#38bdf8' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                gb-games Directory Inspector
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Inspecting static game builds inside <code style={{ color: '#38bdf8', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>backend/gb-games</code>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#1e293b', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              Total Build Size: <strong style={{ color: '#f8fafc' }}>{data?.gbGames.totalSizeFormatted ?? '0 MB'}</strong>
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#1e293b', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              Files: <strong style={{ color: '#f8fafc' }}>{data?.gbGames.totalFilesCount ?? 0}</strong>
            </span>
          </div>
        </div>

        {/* Breadcrumb Navigation & Local Filter Search */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          background: '#1e293b', 
          padding: '0.75rem 1rem', 
          borderRadius: '10px', 
          marginBottom: '1rem',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Breadcrumb Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentSubPath('')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentSubPath ? '#38bdf8' : '#f8fafc', 
                fontWeight: 600, 
                cursor: 'pointer',
                padding: '2px 6px',
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
                  <ChevronRight size={14} style={{ color: '#64748b' }} />
                  <button
                    onClick={() => setCurrentSubPath(crumbPath)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isLast ? '#f8fafc' : '#38bdf8',
                      fontWeight: isLast ? 700 : 500,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {crumb}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Local Filter Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Search size={14} style={{ color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Filter files by name..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.825rem', outline: 'none', width: '180px' }}
            />
          </div>
        </div>

        {/* Directory Items Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.775rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Size</th>
                <th style={{ padding: '0.75rem 1rem' }}>Details</th>
                <th style={{ padding: '0.75rem 1rem' }}>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={24} className={styles.spin} style={{ marginBottom: '0.5rem', color: '#38bdf8' }} />
                    <div>Reading gb-games directory...</div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No files or subdirectories found in this folder.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr 
                    key={item.relativePath}
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease',
                      cursor: item.isDir ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (item.isDir) {
                        setCurrentSubPath(item.relativePath);
                      }
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, color: item.isDir ? '#38bdf8' : '#f8fafc' }}>
                      {getItemIcon(item)}
                      <span>{item.name}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                      <span style={{ 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        background: item.isDir ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                        color: item.isDir ? '#38bdf8' : '#94a3b8'
                      }}>
                        {item.fileType}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontWeight: 500 }}>
                      {item.sizeFormatted}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {item.isDir ? `${item.itemCount ?? 0} files contained` : (item.extension || 'file')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
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
