'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { 
  ImageIcon, UploadCloud, Copy, Check, Trash2, Search, RefreshCw, Eye, ExternalLink
} from 'lucide-react';
import CustomDialogModal, { DialogState } from '@/components/CustomDialogModal';
import { getImageUrl } from '@/lib/utils';

interface MediaFile {
  name: string;
  relativePath: string;
  url: string;
  size: number;
  mtime: string;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function AdminMediaPage() {
  const { token } = useAdminStore();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3102';

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/admin/media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch media files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMedia();
    }
  }, [token]);

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setDialogState({
        isOpen: true,
        type: 'warning',
        title: 'Invalid File',
        message: 'Please select an image file (PNG, JPG, WEBP, GIF, SVG).',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await fetch(`${backendUrl}/api/admin/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchMedia();
        setDialogState({
          isOpen: true,
          type: 'success',
          title: 'Upload Successful',
          message: `Image uploaded successfully!\nURL: ${data.url}`,
        });
      } else {
        setDialogState({
          isOpen: true,
          type: 'danger',
          title: 'Upload Failed',
          message: data.error || 'Failed to upload image.',
        });
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyLink = (fileUrl: string) => {
    const fullUrl = fileUrl.startsWith('http') 
      ? fileUrl 
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gamesato.com'}${fileUrl}`;

    navigator.clipboard.writeText(fullUrl);
    setCopiedFile(fileUrl);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleDelete = (relativePath: string, fileName: string) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Image',
      message: `Are you sure you want to delete "${fileName}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${backendUrl}/api/admin/media`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ relativePath }),
          });

          if (res.ok) {
            fetchMedia();
          } else {
            const data = await res.json();
            setDialogState({
              isOpen: true,
              type: 'danger',
              title: 'Delete Failed',
              message: data.error || 'Failed to delete file.',
            });
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.relativePath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', color: 'white' }}>
      <CustomDialogModal {...dialogState} onClose={() => setDialogState({ isOpen: false })} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ImageIcon color="#14b8a6" size={28} /> Media & Image Library
          </h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Upload, manage, and copy image links for blogs, games, banners, and static pages.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={fetchMedia}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <RefreshCw size={16} /> Refresh
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
              color: '#051817',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(20, 184, 166, 0.3)',
            }}
          >
            <UploadCloud size={18} /> {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      </div>

      {/* Drag & Drop Banner */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        style={{
          border: '2px dashed rgba(20, 184, 166, 0.4)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(20, 184, 166, 0.03)',
          cursor: 'pointer',
          marginBottom: '2rem',
          transition: 'all 0.2s ease',
        }}
      >
        <UploadCloud size={36} color="#14b8a6" style={{ marginBottom: '0.75rem' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
          Drag & Drop images here or <span style={{ color: '#2dd4bf', textDecoration: 'underline' }}>Browse File</span>
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Supports PNG, JPG, WEBP, GIF, SVG (Up to 25MB)
        </p>
      </div>

      {/* Search & Stats Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.25rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Total Images: <strong style={{ color: '#2dd4bf' }}>{filteredFiles.length}</strong>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading media files...</div>
      ) : filteredFiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <ImageIcon size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3>No Images Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Upload an image above to get started!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}>
          {filteredFiles.map((file) => {
            const displayUrl = getImageUrl(file.relativePath);
            const isCopied = copiedFile === file.relativePath;

            return (
              <div
                key={file.relativePath}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                {/* Thumbnail Preview */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '150px',
                  background: '#051817',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <img
                    src={displayUrl}
                    alt={file.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* File Details */}
                <div style={{ padding: '0.85rem', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: 'white',
                      marginBottom: '0.25rem',
                      wordBreak: 'break-all',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }} title={file.name}>
                      {file.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      {formatBytes(file.size)} • {new Date(file.mtime).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleCopyLink(file.relativePath)}
                      style={{
                        flex: 1,
                        background: isCopied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(20, 184, 166, 0.15)',
                        border: '1px solid ' + (isCopied ? '#22c55e' : 'rgba(20, 184, 166, 0.3)'),
                        color: isCopied ? '#4ade80' : '#2dd4bf',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      {isCopied ? 'Copied!' : 'Copy Link'}
                    </button>

                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="View Image"
                    >
                      <ExternalLink size={14} />
                    </a>

                    <button
                      onClick={() => handleDelete(file.relativePath, file.name)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Delete Image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
