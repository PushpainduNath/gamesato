'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, Pencil, Search, ShieldAlert, 
  RotateCcw, Save, Settings, Info, Check, AlertCircle,
  ChevronLeft, ChevronRight, Plus, Trash2, Code, Eye, X
} from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';
import styles from '../app/admin/page.module.css';

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  lastUpdated: string;
  status: 'published' | 'draft';
  content: string;
  type: 'static' | 'category';
  meta_title?: string | null;
  meta_description?: string | null;
  meta_tags?: string | null;
  originalName?: string; // For categories original name
}

export default function AdminContentManager() {
  const { token, globalSearchQuery, setGlobalSearchQuery } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'pages' | 'settings'>('pages');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit page modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<ContentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState<'published' | 'draft'>('published');
  const [editMetaTitle, setEditMetaTitle] = useState('');
  const [editMetaDescription, setEditMetaDescription] = useState('');
  const [editMetaTags, setEditMetaTags] = useState('');
  const [faqList, setFaqList] = useState<{ q: string; a: string }[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editorMode, setEditorMode] = useState<'code' | 'preview'>('code');

  const insertHtmlTag = (tagOpen: string, tagClose: string = '') => {
    const textarea = document.getElementById('htmlContentTextarea') as HTMLTextAreaElement;
    const defaultText = tagClose ? 'sample text' : '';
    
    if (!textarea) {
      setEditContent((prev) => prev + `${tagOpen}${defaultText}${tagClose}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    const replacement = selectedText ? `${tagOpen}${selectedText}${tagClose}` : `${tagOpen}${defaultText}${tagClose}`;
    const newContent = editContent.substring(0, start) + replacement + editContent.substring(end);
    setEditContent(newContent);
    setTimeout(() => {
      textarea.focus();
      const textLength = selectedText ? selectedText.length : defaultText.length;
      textarea.setSelectionRange(start + tagOpen.length, start + tagOpen.length + textLength);
    }, 50);
  };

  const convertLinesToHtml = () => {
    if (!editContent.trim()) return;
    if (/<\/?[a-z][\s\S]*>/i.test(editContent)) {
      return;
    }
    const lines = editContent.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const html = lines.map((l) => `<p>${l}</p>`).join('\n');
    setEditContent(html);
  };

  // Settings form states
  const [siteName, setSiteName] = useState('Gamesato Portal');
  const [contactEmail, setContactEmail] = useState('support@gamesato.com');
  const [socialTwitter, setSocialTwitter] = useState('https://twitter.com');
  const [socialFacebook, setSocialFacebook] = useState('https://facebook.com');
  const [socialYoutube, setSocialYoutube] = useState('https://youtube.com');
  const [socialInstagram, setSocialInstagram] = useState('https://instagram.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [analyticsId, setAnalyticsId] = useState('UA-182948123-1');
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const itemsPerPage = 10;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.site_name) setSiteName(data.site_name);
        if (data.support_email) setContactEmail(data.support_email);
        if (data.social_twitter) setSocialTwitter(data.social_twitter);
        if (data.social_facebook) setSocialFacebook(data.social_facebook);
        if (data.social_youtube) setSocialYoutube(data.social_youtube);
        if (data.social_instagram) setSocialInstagram(data.social_instagram);
        if (data.analytics_id) setAnalyticsId(data.analytics_id);
        if (data.maintenance_mode) setMaintenanceMode(data.maintenance_mode === 'true');
      }
    } catch (err) {
      console.error('Failed to fetch site settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [backendUrl]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch static pages
      const pagesRes = await fetch(`${backendUrl}/api/admin/content/pages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fetch categories
      const catsRes = await fetch(`${backendUrl}/api/categories`);

      if (!pagesRes.ok) {
        throw new Error('Failed to fetch static pages');
      }
      if (!catsRes.ok) {
        throw new Error('Failed to fetch categories');
      }

      const pagesData = await pagesRes.json();
      const catsData = await catsRes.json();

      const mappedPages: ContentItem[] = pagesData.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        lastUpdated: p.updated_at || p.created_at || new Date().toISOString(),
        status: p.status || 'published',
        content: p.content || '',
        type: 'static',
        meta_title: p.meta_title,
        meta_description: p.meta_description,
        meta_tags: p.meta_tags
      }));

      const mappedCats: ContentItem[] = catsData.map((c: any) => ({
        id: c.id,
        title: `${c.name} Category Page`,
        slug: c.slug,
        lastUpdated: c.updated_at || c.created_at || new Date().toISOString(),
        status: c.status || 'published',
        content: c.content || '',
        type: 'category',
        meta_title: c.meta_title,
        meta_description: c.meta_description,
        meta_tags: c.meta_tags,
        originalName: c.name
      }));

      setItems([...mappedPages, ...mappedCats]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    item.slug.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const totalItems = filteredItems.length;
  const totalPages = paginationEnabled ? Math.ceil(totalItems / itemsPerPage) : 1;
  const paginatedItems = paginationEnabled 
    ? filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredItems;

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearchQuery, paginationEnabled]);

  const handleOpenEdit = (item: ContentItem) => {
    setSelectedPage(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditStatus(item.status);
    setEditMetaTitle(item.meta_title || '');
    setEditMetaDescription(item.meta_description || '');
    setEditMetaTags(item.meta_tags || '');
    
    if (item.slug === 'faq') {
      try {
        const parsed = JSON.parse(item.content || '[]');
        setFaqList(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setFaqList([]);
      }
    }
    setEditModalOpen(true);
  };

  const handleAddFaq = () => {
    setFaqList(prev => [...prev, { q: '', a: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFaqChange = (index: number, key: 'q' | 'a', value: string) => {
    setFaqList(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [key]: value };
      }
      return item;
    }));
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;

    try {
      setSaveLoading(true);
      setError('');
      
      const payloadContent = selectedPage.slug === 'faq' ? JSON.stringify(faqList) : editContent;
      
      let res;
      if (selectedPage.type === 'static') {
        res = await fetch(`${backendUrl}/api/admin/content/pages/${selectedPage.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: editTitle,
            content: payloadContent,
            status: editStatus,
            meta_title: editMetaTitle || null,
            meta_description: editMetaDescription || null,
            meta_tags: editMetaTags || null
          })
        });
      } else {
        // Update category page
        res = await fetch(`${backendUrl}/api/categories/${selectedPage.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: selectedPage.originalName,
            slug: selectedPage.slug,
            content: payloadContent,
            status: editStatus,
            meta_title: editMetaTitle || null,
            meta_description: editMetaDescription || null,
            meta_tags: editMetaTags || null
          })
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update content');
      }

      setSuccessMessage('Content saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditModalOpen(false);
      setSelectedPage(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      const res = await fetch(`${backendUrl}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          site_name: siteName,
          support_email: contactEmail,
          social_twitter: socialTwitter,
          social_facebook: socialFacebook,
          social_youtube: socialYoutube,
          social_instagram: socialInstagram,
          analytics_id: analyticsId,
          maintenance_mode: maintenanceMode
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setSettingsMessage({ text: 'Settings successfully saved and synchronized!', type: 'success' });
      setTimeout(() => setSettingsMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      console.error(err);
      setSettingsMessage({ text: err.message || 'Failed to save settings.', type: 'error' });
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Header Row */}
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>Content Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage portal static pages, dynamic categories, legal policies, and global configuration.
          </p>
        </div>
      </div>

      {successMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#34d399', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          <Check size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#f87171', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'pages' ? '#14b8a6' : '#94a3b8',
            fontSize: '0.95rem',
            fontWeight: 700,
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'pages' ? '2px solid #14b8a6' : '2px solid transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileText size={16} />
          <span>Portal Pages</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'settings' ? '#14b8a6' : '#94a3b8',
            fontSize: '0.95rem',
            fontWeight: 700,
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'settings' ? '2px solid #14b8a6' : '2px solid transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Settings size={16} />
          <span>Global Settings</span>
        </button>
      </div>

      {activeTab === 'pages' ? (
        <div className={styles.tableCard}>
          <div className={styles.tableHeaderRow}>
            <h3 className={styles.chartTitle} style={{ border: 'none', padding: 0, margin: 0 }}>Content Library</h3>
            <div className={styles.tableHeaderControls}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px', userSelect: 'none' }}>
                <label 
                  style={{ 
                    fontSize: '0.8rem', 
                    color: '#94a3b8', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={paginationEnabled}
                    onChange={(e) => setPaginationEnabled(e.target.checked)}
                    style={{
                      cursor: 'pointer',
                      width: '14px',
                      height: '14px',
                      accentColor: '#14b8a6'
                    }}
                  />
                  Paginate
                </label>
              </div>
              <div className={styles.tableSearchWrapper}>
                <Search size={15} className={styles.tableSearchIcon} />
                <input 
                  type="text" 
                  placeholder="Search page..." 
                  className={styles.tableSearchInput}
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '34px' }}>Page / Category</th>
                  <th>Type</th>
                  <th>Slug</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      Loading content catalog...
                    </td>
                  </tr>
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((item, index) => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, minWidth: '20px', textAlign: 'center', display: 'inline-block' }}>
                            {paginationEnabled ? (currentPage - 1) * itemsPerPage + index + 1 : index + 1}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--adm-text-primary, #ffffff)' }}>{item.title}</span>
                        </div>
                      </td>
                      <td>
                        {item.type === 'static' ? (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6' }}>Static Page</span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>Category</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.85rem' }}>/{item.slug}</span>
                      </td>
                      <td style={{ color: 'var(--adm-text-primary, #cbd5e1)', fontSize: '0.85rem' }}>
                        {new Date(item.lastUpdated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${item.status === 'published' ? styles.publishedBadge : styles.draftBadge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionCell} style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button 
                            className={styles.actionBtn}
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Page"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No content pages found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {paginationEnabled && totalItems > 0 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </div>
              <div className={styles.paginationPages}>
                <button
                  type="button"
                  className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    className={`${styles.paginationBtn} ${currentPage === pg ? styles.paginationBtnActive : ''}`}
                    onClick={() => setCurrentPage(pg)}
                    disabled={loading}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  type="button"
                  className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || loading}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.tableCard} style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 210px)', overflow: 'hidden' }}>
          {/* Sticky Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--adm-border)', background: 'var(--adm-modal-bg, var(--adm-card-bg))', position: 'sticky', top: 0, zIndex: 10 }}>
            <h3 className={styles.chartTitle} style={{ border: 'none', padding: 0, margin: 0 }}>Global Portal Configuration</h3>
            {settingsMessage.text && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--adm-accent-light, rgba(16, 185, 129, 0.1))', border: '1px solid var(--adm-border)', padding: '0.6rem 1rem', borderRadius: '8px', color: 'var(--adm-accent, #34d399)', marginTop: '0.75rem' }}>
                <Check size={18} />
                <span>{settingsMessage.text}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            {/* Scrollable Middle Form Body with custom scrollbar */}
            <div className={styles.settingsFormScrollable}>
              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>Portal Name</label>
                <input 
                  type="text" 
                  className={styles.figmaInput} 
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Gamesato"
                  required
                />
              </div>

              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>Contact Support Email</label>
                <input 
                  type="email" 
                  className={styles.figmaInput} 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="support@gamesato.com"
                />
              </div>

              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>Google Analytics ID</label>
                <input 
                  type="text" 
                  className={styles.figmaInput} 
                  value={analyticsId} 
                  onChange={(e) => setAnalyticsId(e.target.value)} 
                />
              </div>

              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>Site Mode</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--adm-text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={maintenanceMode} 
                      onChange={(e) => setMaintenanceMode(e.target.checked)} 
                      style={{ accentColor: '#14b8a6' }}
                    />
                    Enable Maintenance Mode
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--adm-text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={enableRegistration} 
                      onChange={(e) => setEnableRegistration(e.target.checked)} 
                      style={{ accentColor: '#14b8a6' }}
                    />
                    Allow New User Signup
                  </label>
                </div>
              </div>

              <div className={styles.figmaFormGroup} style={{ gridColumn: 'span 2', borderTop: '1px solid var(--adm-border)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--adm-accent)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🌐 Social Media Links & Hyperlinks
                </h4>
              </div>

              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>Twitter / X URL</label>
                <input 
                  type="url" 
                  className={styles.figmaInput} 
                  value={socialTwitter} 
                  onChange={(e) => setSocialTwitter(e.target.value)} 
                  placeholder="https://twitter.com/gamesato"
                />
              </div>

              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>Facebook URL</label>
                <input 
                  type="url" 
                  className={styles.figmaInput} 
                  value={socialFacebook} 
                  onChange={(e) => setSocialFacebook(e.target.value)} 
                  placeholder="https://facebook.com/gamesato"
                />
              </div>

              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>YouTube Channel URL</label>
                <input 
                  type="url" 
                  className={styles.figmaInput} 
                  value={socialYoutube} 
                  onChange={(e) => setSocialYoutube(e.target.value)} 
                  placeholder="https://youtube.com/c/gamesato"
                />
              </div>

              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>Instagram Page URL</label>
                <input 
                  type="url" 
                  className={styles.figmaInput} 
                  value={socialInstagram} 
                  onChange={(e) => setSocialInstagram(e.target.value)} 
                  placeholder="https://instagram.com/gamesato"
                />
              </div>
            </div>

            {/* Sticky Bottom Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: '#10182f', position: 'sticky', bottom: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className={styles.addGameBtn}
                style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', border: 'none' }}
                disabled={settingsLoading}
              >
                <Save size={16} />
                <span>{settingsLoading ? 'Saving...' : 'Save Settings & Social Links'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Page Modal */}
      {editModalOpen && selectedPage && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '850px', width: '90%' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Edit Page: {selectedPage.title}</h3>
                <p className={styles.modalSubtitle}>Edit content layout, structured data, and SEO tags.</p>
              </div>
              <button 
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditModalOpen(false)}
                title="Close modal"
                style={{ alignSelf: 'flex-start', marginTop: '-2px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePage} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Publication Status */}
              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>Publication Status</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="p_status" 
                      checked={editStatus === 'published'} 
                      onChange={() => setEditStatus('published')} 
                      style={{ accentColor: '#14b8a6' }}
                    />
                    Published (Visible on site)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="p_status" 
                      checked={editStatus === 'draft'} 
                      onChange={() => setEditStatus('draft')} 
                      style={{ accentColor: '#14b8a6' }}
                    />
                    Draft (Hidden from public)
                  </label>
                </div>
              </div>

              {/* Title Input */}
              <div className={styles.figmaFormGroup}>
                <label className={styles.figmaLabel}>Display Title</label>
                <input 
                  type="text" 
                  className={styles.figmaInput} 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  required 
                />
              </div>

              {/* Conditional Content Editors */}
              {selectedPage.slug === 'faq' ? (
                <div className={styles.figmaFormGroupFull}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className={styles.figmaLabel} style={{ margin: 0 }}>Structured Questions &amp; Answers (FAQ)</label>
                    <button 
                      type="button" 
                      className={styles.addGameBtn}
                      onClick={handleAddFaq}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', height: '28px' }}
                    >
                      <Plus size={13} /> Add FAQ Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {faqList.length > 0 ? (
                      faqList.map((faq, index) => (
                        <div key={index} style={{ borderBottom: index < faqList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: index < faqList.length - 1 ? '1rem' : 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#14b8a6', fontWeight: 600 }}>FAQ Item #{index + 1}</span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveFaq(index)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                              title="Delete Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          <input 
                            type="text"
                            placeholder="Question text..."
                            className={styles.figmaInput}
                            value={faq.q}
                            onChange={(e) => handleFaqChange(index, 'q', e.target.value)}
                            required
                          />
                          <textarea 
                            placeholder="Answer text..."
                            className={styles.figmaTextarea}
                            rows={3}
                            value={faq.a}
                            onChange={(e) => handleFaqChange(index, 'a', e.target.value)}
                            required
                          />
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No FAQs added yet. Click &quot;Add FAQ Item&quot; to get started.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.figmaFormGroupFull}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '8px' }}>
                    <label className={styles.figmaLabel} style={{ margin: 0 }}>Page Layout Content (HTML)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--adm-input-bg, rgba(255, 255, 255, 0.06))', padding: '3px', borderRadius: '8px', border: '1px solid var(--adm-border, rgba(255,255,255,0.1))' }}>
                      <button
                        type="button"
                        onClick={() => setEditorMode('code')}
                        style={{
                          background: editorMode === 'code' ? 'var(--adm-accent, #14b8a6)' : 'transparent',
                          color: editorMode === 'code' ? '#ffffff' : 'var(--adm-text-secondary, #94a3b8)',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Code size={13} /> Code (HTML)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode('preview')}
                        style={{
                          background: editorMode === 'preview' ? 'var(--adm-accent, #14b8a6)' : 'transparent',
                          color: editorMode === 'preview' ? '#ffffff' : 'var(--adm-text-secondary, #94a3b8)',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Eye size={13} /> Live Visual Preview
                      </button>
                    </div>
                  </div>

                  {/* Formatting Toolbar */}
                  {editorMode === 'code' && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '0.5rem', flexWrap: 'wrap', background: 'var(--adm-input-bg, rgba(0, 0, 0, 0.25))', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--adm-border, rgba(255,255,255,0.08))' }}>
                      <button 
                        type="button" 
                        onClick={() => insertHtmlTag('<h3>', '</h3>')} 
                        style={{ background: 'var(--adm-card-bg, #1e293b)', color: 'var(--adm-text-primary, #f8fafc)', border: '1px solid var(--adm-border, #334155)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        H3
                      </button>
                      <button 
                        type="button" 
                        onClick={() => insertHtmlTag('<p>', '</p>')} 
                        style={{ background: 'var(--adm-card-bg, #1e293b)', color: 'var(--adm-text-primary, #f8fafc)', border: '1px solid var(--adm-border, #334155)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        &lt;p&gt; Paragraph
                      </button>
                      <button 
                        type="button" 
                        onClick={() => insertHtmlTag('<b>', '</b>')} 
                        style={{ background: 'var(--adm-card-bg, #1e293b)', color: 'var(--adm-text-primary, #f8fafc)', border: '1px solid var(--adm-border, #334155)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        B
                      </button>
                      <button 
                        type="button" 
                        onClick={() => insertHtmlTag('<i>', '</i>')} 
                        style={{ background: 'var(--adm-card-bg, #1e293b)', color: 'var(--adm-text-primary, #f8fafc)', border: '1px solid var(--adm-border, #334155)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', fontStyle: 'italic' }}
                      >
                        I
                      </button>
                      <button 
                        type="button" 
                        onClick={() => insertHtmlTag('<br />')} 
                        style={{ background: 'var(--adm-card-bg, #1e293b)', color: 'var(--adm-text-primary, #f8fafc)', border: '1px solid var(--adm-border, #334155)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                        title="Insert Line Break <br />"
                      >
                        &lt;br&gt; Break
                      </button>
                      <button 
                        type="button" 
                        onClick={() => insertHtmlTag('<ul>\n  <li>', '</li>\n  <li>Second item</li>\n</ul>')} 
                        style={{ background: 'var(--adm-card-bg, #1e293b)', color: 'var(--adm-text-primary, #f8fafc)', border: '1px solid var(--adm-border, #334155)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        &lt;ul&gt; Bullet List
                      </button>
                      <button 
                        type="button" 
                        onClick={() => insertHtmlTag('<a href="#" style="color:#14b8a6;">', '</a>')} 
                        style={{ background: 'var(--adm-card-bg, #1e293b)', color: 'var(--adm-text-primary, #f8fafc)', border: '1px solid var(--adm-border, #334155)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        &lt;a&gt; Link
                      </button>
                      <button 
                        type="button" 
                        onClick={convertLinesToHtml} 
                        style={{ background: 'rgba(20, 184, 166, 0.12)', color: 'var(--adm-accent, #14b8a6)', border: '1px solid var(--adm-accent, rgba(20, 184, 166, 0.4))', borderRadius: '4px', padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, marginLeft: 'auto' }}
                      >
                        ✨ Auto-wrap Lines to &lt;p&gt;
                      </button>
                    </div>
                  )}

                  {editorMode === 'code' ? (
                    <textarea 
                      id="htmlContentTextarea"
                      className={styles.figmaTextarea} 
                      style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.45', background: 'var(--adm-input-bg, #0b1120)', color: 'var(--adm-text-primary, #f8fafc)', border: '1px solid var(--adm-border, #1e293b)' }}
                      rows={12}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="<h3>Your layout title</h3><p>Your HTML layout goes here...</p>"
                      required 
                    />
                  ) : (
                    <div 
                      className="htmlContentPreview"
                      style={{ 
                        minHeight: '220px', 
                        maxHeight: '380px', 
                        overflowY: 'auto', 
                        background: 'var(--adm-input-bg, #0b1120)', 
                        color: 'var(--adm-text-primary, #f8fafc)', 
                        padding: '16px 24px', 
                        borderRadius: '10px', 
                        border: '1px solid var(--adm-border, #1e293b)', 
                        fontSize: '0.9rem', 
                        lineHeight: '1.6' 
                      }}
                      dangerouslySetInnerHTML={{ __html: editContent || '<p style="color:var(--adm-text-secondary, #94a3b8); font-style:italic;">No HTML content entered yet. Switch to Code mode to add HTML.</p>' }}
                    />
                  )}

                  <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary, #94a3b8)', marginTop: '0.35rem', display: 'block' }}>
                    💡 Tip: Switch to <b>Live Visual Preview</b> to inspect rendered formatting in real-time. Use <b>Auto-wrap Lines</b> for quick plain text formatting.
                  </span>
                </div>
              )}

              {/* SEO Meta Fields Section */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#14b8a6', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> SEO Meta Tag Settings
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className={styles.figmaFormGroup}>
                    <label className={styles.figmaLabel}>
                      Meta Title 
                      <span style={{ fontSize: '0.7rem', color: editMetaTitle.length > 60 ? '#ef4444' : '#94a3b8', marginLeft: '6px' }}>
                        ({editMetaTitle.length}/60 chars recommended)
                      </span>
                    </label>
                    <input 
                      type="text" 
                      className={styles.figmaInput} 
                      value={editMetaTitle}
                      onChange={(e) => setEditMetaTitle(e.target.value)}
                      placeholder="e.g. Play Free Online Games | Gamesato"
                    />
                  </div>

                  <div className={styles.figmaFormGroupFull}>
                    <label className={styles.figmaLabel}>
                      Meta Description 
                      <span style={{ fontSize: '0.7rem', color: editMetaDescription.length > 160 ? '#ef4444' : '#94a3b8', marginLeft: '6px' }}>
                        ({editMetaDescription.length}/160 chars recommended)
                      </span>
                    </label>
                    <textarea 
                      className={styles.figmaTextarea} 
                      rows={3}
                      value={editMetaDescription}
                      onChange={(e) => setEditMetaDescription(e.target.value)}
                      placeholder="Enter a brief summary of this page content for search engines..."
                    />
                  </div>

                  <div className={styles.figmaFormGroup}>
                    <label className={styles.figmaLabel}>Meta Keywords / Tags (comma separated)</label>
                    <input 
                      type="text" 
                      className={styles.figmaInput} 
                      value={editMetaTags}
                      onChange={(e) => setEditMetaTags(e.target.value)}
                      placeholder="e.g. gaming, html5, free games, online arcade"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem 1.25rem' }}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.addGameBtn}
                  style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', border: 'none', padding: '0.5rem 1.25rem' }}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
