'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { 
  Gamepad2, Upload, Plus, Edit2, Pencil, Check,
  AlertCircle, Sparkles, FolderSync, Eye, EyeOff, Star,
  Layers, X, Play, Crown, Trash2, Search, ChevronDown, Filter,
  ArrowUpDown, ArrowUp, ArrowDown, Calendar, ChevronLeft, ChevronRight,
  HardDrive, FileText, CheckCircle2, XCircle, AlertTriangle,
  List, Folder, FolderOpen, ToggleRight, ToggleLeft
} from 'lucide-react';
import styles from '../app/admin/page.module.css';
import DragAndDropUpload from './DragAndDropUpload';
import CustomDialogModal, { DialogState } from './CustomDialogModal';

interface Game {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnailUrl: string;
  playCount: number;
  likesCount: number;
  avgDuration: number;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaTags?: string | null;
  howToPlay?: string | null;
  how_to_play?: string | null;
  status: 'published' | 'draft';
  description?: string;
  featuredDesktopUrl?: string | null;
  featuredMobileUrl?: string | null;
  newGameBothUrl?: string | null;
  gamePageBothUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface FileEntryInfo {
  name: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  type: string;
}

interface GameFilesInfo {
  slug: string;
  folderExists: boolean;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  hasIndexHtml: boolean;
  indexHtmlPath: string | null;
  fileCount: number;
  files: FileEntryInfo[];
}

interface FilterSelectOption {
  value: string;
  label: string;
}

interface CustomFilterSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: FilterSelectOption[];
  width?: string;
}

const CustomFilterSelect: React.FC<CustomFilterSelectProps> = ({ value, onChange, options, width = '150px' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeOption = options.find(opt => opt.value.toLowerCase() === value.toLowerCase()) || options[0];

  return (
    <div ref={dropdownRef} className={styles.customSelectContainer} style={{ width }}>
      <div 
        className={styles.customSelectTrigger} 
        onClick={() => setIsOpen(!isOpen)}
        style={{ height: '32px', padding: '0 10px', borderRadius: '8px', background: 'var(--adm-input-bg, #161b22)', border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.1))' }}
      >
        <span style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--adm-text-primary, #cbd5e1)', fontWeight: 600 }}>
          {activeOption.label}
        </span>
        <ChevronDown size={14} className={`${styles.selectArrow} ${isOpen ? styles.selectArrowOpen : ''}`} />
      </div>

      {isOpen && (
        <div className={styles.customSelectDropdown} style={{ top: 'calc(100% + 4px)', zIndex: 100, background: 'var(--adm-modal-bg, var(--adm-card-bg, #161b22))', border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.12))' }}>
          <div className={styles.customSelectOptionsList} style={{ maxHeight: '250px' }}>
            {options.map((opt) => (
              <div 
                key={opt.value} 
                className={`${styles.customSelectOption} ${value.toLowerCase() === opt.value.toLowerCase() ? styles.customSelectOptionActive : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface DashboardData {
  games: Game[];
}

const CATEGORIES = [
  'New', 'Popular', 'Racing', 'Action', 'Sport', 
  'Arcade', 'Logic', 'Number', 'Adventure'
];

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  type?: string;
  children: TreeNode[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function buildFileTree(files: FileEntryInfo[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.relativePath.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');

      let existing = currentLevel.find(item => item.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          sizeBytes: isLast ? file.sizeBytes : 0,
          sizeFormatted: isLast ? file.sizeFormatted : '',
          type: isLast ? file.type : 'FOLDER',
          children: []
        };
        currentLevel.push(existing);
      }

      if (!isLast) {
        currentLevel = existing.children;
      }
    });
  }

  function computeFolderSizes(node: TreeNode): number {
    if (!node.isDirectory) return node.sizeBytes;
    const folderSize = node.children.reduce((acc, child) => acc + computeFolderSizes(child), 0);
    node.sizeBytes = folderSize;
    node.sizeFormatted = formatBytes(folderSize);
    return folderSize;
  }

  root.forEach(node => computeFolderSizes(node));

  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      if (a.name.toLowerCase() === 'index.html') return -1;
      if (b.name.toLowerCase() === 'index.html') return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.isDirectory) sortNodes(node.children);
    });
  }

  sortNodes(root);
  return root;
}

const FileTreeNodeItem: React.FC<{
  node: TreeNode;
  depth: number;
  searchQuery: string;
}> = ({ node, depth, searchQuery }) => {
  const [isOpen, setIsOpen] = useState(true);

  const matchesSearch = (n: TreeNode, q: string): boolean => {
    if (!q) return true;
    if (n.name.toLowerCase().includes(q.toLowerCase())) return true;
    if (n.isDirectory) {
      return n.children.some(c => matchesSearch(c, q));
    }
    return false;
  };

  if (!matchesSearch(node, searchQuery)) return null;

  return (
    <div style={{ userSelect: 'none' }}>
      <div 
        onClick={() => node.isDirectory && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 8px',
          paddingLeft: `${depth * 18 + 8}px`,
          borderRadius: '4px',
          cursor: node.isDirectory ? 'pointer' : 'default',
          background: 'transparent',
          transition: 'background 0.15s ease',
          fontSize: '0.8rem',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--adm-table-row-hover, rgba(255, 255, 255, 0.05))')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, paddingRight: '8px' }}>
          {node.isDirectory ? (
            <>
              {isOpen ? <ChevronDown size={14} style={{ color: 'var(--adm-accent, #0086ec)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--adm-text-muted, #64748b)', flexShrink: 0 }} />}
              {isOpen ? <FolderOpen size={15} style={{ color: 'var(--adm-accent, #0086ec)', flexShrink: 0 }} /> : <Folder size={15} style={{ color: 'var(--adm-accent, #0086ec)', flexShrink: 0 }} />}
              <span style={{ fontWeight: 600, color: 'var(--adm-text-primary, #ffffff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--adm-text-muted, #64748b)', marginLeft: '4px' }}>
                ({node.children.length})
              </span>
            </>
          ) : (
            <>
              <span style={{ width: '14px', flexShrink: 0 }} />
              <FileText size={14} style={{ color: node.name.toLowerCase() === 'index.html' ? '#22c55e' : 'var(--adm-accent, #0086ec)', flexShrink: 0 }} />
              <span style={{ color: node.name.toLowerCase() === 'index.html' ? '#22c55e' : 'var(--adm-text-primary, #ffffff)', fontWeight: node.name.toLowerCase() === 'index.html' ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node.name}
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {!node.isDirectory && (
            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--adm-table-header-bg, rgba(255, 255, 255, 0.06))', color: 'var(--adm-text-secondary, #94a3b8)', fontWeight: 600 }}>
              {node.type}
            </span>
          )}
          <span style={{ color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.75rem', width: '65px', textAlign: 'right' }}>
            {node.sizeFormatted}
          </span>
        </div>
      </div>

      {node.isDirectory && isOpen && (
        <div>
          {node.children.map((child, idx) => (
            <FileTreeNodeItem key={idx} node={child} depth={depth + 1} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
};

const CustomCategorySelect = ({
  value,
  onChange,
  categories,
  onCreateClick
}: {
  value: string;
  onChange: (val: string) => void;
  categories: string[];
  onCreateClick: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} className={styles.customSelectContainer}>
      <div 
        className={styles.customSelectTrigger} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || 'Select category...'}</span>
        <ChevronDown size={16} className={`${styles.selectArrow} ${isOpen ? styles.selectArrowOpen : ''}`} />
      </div>

      {isOpen && (
        <div className={styles.customSelectDropdown}>
          <div className={styles.customSelectOptionsList}>
            {categories.map((cat) => (
              <div 
                key={cat} 
                className={`${styles.customSelectOption} ${value === cat ? styles.customSelectOptionActive : ''}`}
                onClick={() => {
                  onChange(cat);
                  setIsOpen(false);
                }}
              >
                {cat}
              </div>
            ))}
          </div>
          <div 
            className={styles.customSelectCreateBtn}
            onClick={() => {
              onCreateClick();
              setIsOpen(false);
            }}
          >
            <Plus size={16} />
            <span>Create new category</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminGamesManager() {
  const { token, globalSearchQuery, setGlobalSearchQuery } = useAdminStore();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting & Filtering states
  const [sortField, setSortField] = useState<'title' | 'likesCount' | 'playCount' | 'status' | 'createdAt' | 'updatedAt' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLTableHeaderCellElement>(null);

  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'on' | 'off'>('all');
  const [featuredDropdownOpen, setFeaturedDropdownOpen] = useState(false);
  const featuredDropdownRef = useRef<HTMLTableHeaderCellElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (featuredDropdownRef.current && !featuredDropdownRef.current.contains(e.target as Node)) {
        setFeaturedDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (field: 'title' | 'likesCount' | 'playCount' | 'status' | 'createdAt' | 'updatedAt') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };
  
  // Upload modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('published');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [featuredDesktopFile, setFeaturedDesktopFile] = useState<File | null>(null);
  const [featuredMobileFile, setFeaturedMobileFile] = useState<File | null>(null);
  const [newGameBothFile, setNewGameBothFile] = useState<File | null>(null);
  const [gamePageBothFile, setGamePageBothFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [isFeatured, setIsFeatured] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaTags, setMetaTags] = useState('');
  const [howToPlay, setHowToPlay] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0, 16));

  const resetUploadForm = () => {
    setTitle('');
    setSlug('');
    setCategory(dbCategories[0] || '');
    setDescription('');
    setHowToPlay('');
    setStatus('published');
    setZipFile(null);
    setThumbnailFile(null);
    setFeaturedDesktopFile(null);
    setFeaturedMobileFile(null);
    setNewGameBothFile(null);
    setGamePageBothFile(null);
    setIsFeatured(false);
    setIsPopular(false);
    setIsNew(false);
    setMetaTitle('');
    setMetaDescription('');
    setMetaTags('');
    setCreatedAt(new Date().toISOString().slice(0, 16));
    setLikesCount(0);
    setPlayCount(0);
    setMessage({ text: '', type: '' });
  };

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editGameId, setEditGameId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editHowToPlay, setEditHowToPlay] = useState('');
  const [editStatus, setEditStatus] = useState('published');
  const [editZipFile, setEditZipFile] = useState<File | null>(null);
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editFeaturedDesktopFile, setEditFeaturedDesktopFile] = useState<File | null>(null);
  const [editFeaturedMobileFile, setEditFeaturedMobileFile] = useState<File | null>(null);
  const [editNewGameBothFile, setEditNewGameBothFile] = useState<File | null>(null);
  const [editGamePageBothFile, setEditGamePageBothFile] = useState<File | null>(null);
  const [clearFeaturedDesktop, setClearFeaturedDesktop] = useState(false);
  const [clearFeaturedMobile, setClearFeaturedMobile] = useState(false);
  const [clearNewGameBoth, setClearNewGameBoth] = useState(false);
  const [clearGamePageBoth, setClearGamePageBoth] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState({ text: '', type: '' });
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsPopular, setEditIsPopular] = useState(false);
  const [editIsNew, setEditIsNew] = useState(false);
  const [editMetaTitle, setEditMetaTitle] = useState('');
  const [editMetaDescription, setEditMetaDescription] = useState('');
  const [editMetaTags, setEditMetaTags] = useState('');
  const [editCreatedAt, setEditCreatedAt] = useState('');
  const [editUpdatedAt, setEditUpdatedAt] = useState('');
  const [likesCount, setLikesCount] = useState<number>(0);
  const [playCount, setPlayCount] = useState<number>(0);
  const [editLikesCount, setEditLikesCount] = useState<number>(0);
  const [editPlayCount, setEditPlayCount] = useState<number>(0);
  const [editingLikesId, setEditingLikesId] = useState<string | null>(null);
  const [tempLikesCount, setTempLikesCount] = useState<number>(0);
  const [editingPlaysId, setEditingPlaysId] = useState<string | null>(null);
  const [tempPlayCount, setTempPlayCount] = useState<number>(0);
  const [inlineEditingGameId, setInlineEditingGameId] = useState<string | null>(null);
  const [inlineTempCreatedAt, setInlineTempCreatedAt] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationEnabled, setPaginationEnabled] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  
  // Inline category creation modal states
  const [inlineCategoryModalOpen, setInlineCategoryModalOpen] = useState(false);
  const [inlineCategoryTrigger, setInlineCategoryTrigger] = useState<'upload' | 'edit'>('upload');
  const [inlineCatName, setInlineCatName] = useState('');
  const [inlineCatSlug, setInlineCatSlug] = useState('');
  const [inlineCatIconFile, setInlineCatIconFile] = useState<File | null>(null);

  // Custom theme dialog modal state
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false
  });

  // Floating Toast Notification state
  const [toast, setToast] = useState<{ id: number; type: 'warning' | 'error' | 'success' | 'info'; title: string; message: string } | null>(null);

  const showToast = (message: string, type: 'warning' | 'error' | 'success' | 'info' = 'warning', title?: string) => {
    const defaultTitle = type === 'warning' ? 'Featured Image Required' : type === 'error' ? 'Error' : 'Notification';
    setToast({
      id: Date.now(),
      type,
      title: title || defaultTitle,
      message,
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getMissingFeaturedMessage = (hasDesktop: boolean, hasMobile: boolean): string | null => {
    if (!hasDesktop && !hasMobile) {
      return "Both Featured Desktop (21:9) and Featured Mobile (16:9) images are missing.";
    }
    if (!hasDesktop) {
      return "Featured Desktop Image (21:9) is missing.";
    }
    if (!hasMobile) {
      return "Featured Mobile Image (16:9) is missing.";
    }
    return null;
  };

  const showAlertDialog = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'warning', onConfirm?: () => void) => {
    setDialogState({
      isOpen: true,
      type,
      title,
      message,
      confirmText: 'OK',
      onConfirm
    });
  };

  const showConfirmDialog = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: 'danger' | 'confirm' = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ) => {
    setDialogState({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm
    });
  };

  // Files inspection & storage modal states
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [inspectingGame, setInspectingGame] = useState<Game | null>(null);
  const [filesInfo, setFilesInfo] = useState<GameFilesInfo | null>(null);
  const [loadingFilesInfo, setLoadingFilesInfo] = useState(false);
  const [clearingFiles, setClearingFiles] = useState(false);
  const [filesSearchQuery, setFilesSearchQuery] = useState('');
  const [filesViewMode, setFilesViewMode] = useState<'list' | 'tree'>('list');

  const handleOpenFilesModal = async (game: Game) => {
    setInspectingGame(game);
    setFilesInfo(null);
    setLoadingFilesInfo(true);
    setFilesSearchQuery('');
    setFilesModalOpen(true);

    try {
      const res = await fetch(`${backendUrl}/api/games/${game.id}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFilesInfo(data.filesInfo);
      } else {
        showAlertDialog('Inspect Files Failed', 'Failed to fetch game files info.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showAlertDialog('Inspect Files Error', 'Error fetching game files info.', 'danger');
    } finally {
      setLoadingFilesInfo(false);
    }
  };

  const handleClearBuildFiles = () => {
    if (!inspectingGame) return;
    const targetGame = inspectingGame;
    showConfirmDialog(
      'Clear Build Files?',
      `Are you sure you want to CLEAR all build files for "${targetGame.title}"?\n\nThis will delete the extracted game folder from server disk and automatically set the game to Inactive (draft).`,
      async () => {
        setClearingFiles(true);
        try {
          const res = await fetch(`${backendUrl}/api/games/${targetGame.id}/clear-files`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            showAlertDialog('Build Files Cleared', data.message, 'success');
            setFilesModalOpen(false);
            fetchGamesData();
          } else {
            const err = await res.json();
            showAlertDialog('Clear Failed', err.error || 'Failed to clear build files', 'danger');
          }
        } catch (err) {
          console.error(err);
          showAlertDialog('Connection Error', 'Error connecting to server.', 'danger');
        } finally {
          setClearingFiles(false);
        }
      },
      'danger',
      'Clear Build Files',
      'Cancel'
    );
  };

  const fetchGamesData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/admin/dashboard?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json: DashboardData = await res.json();
        const sanitizedGames = (json.games || []).map((g: any) => ({
          ...g,
          howToPlay: g.how_to_play || g.howToPlay || '',
          how_to_play: g.how_to_play || g.howToPlay || '',
          isFeatured: !!g.isFeatured && !!g.featuredDesktopUrl && !!g.featuredMobileUrl
        }));
        setGames(sanitizedGames);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch games data');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDbCategories = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        const names = data.map((c: any) => c.name) as string[];
        setDbCategories(names);
        if (names.length > 0) {
          setCategory(prev => prev === 'New' || !prev ? names[0] : prev);
          setEditCategory(prev => prev === 'New' || !prev ? names[0] : prev);
        }
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchGamesData();
    fetchDbCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearchQuery]);

  const handleCreateCategoryInline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineCatName.trim()) return;

    const formData = new FormData();
    formData.append('name', inlineCatName.trim());
    formData.append('slug', inlineCatSlug.trim());
    if (inlineCatIconFile) {
      formData.append('icon', inlineCatIconFile);
    }

    try {
      const res = await fetch(`${backendUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const created = await res.json();
        setDbCategories(prev => Array.from(new Set([...prev, created.name])));
        if (inlineCategoryTrigger === 'upload') {
          setCategory(created.name);
        } else {
          setEditCategory(created.name);
        }
        setInlineCategoryModalOpen(false);
        setInlineCatName('');
        setInlineCatSlug('');
        setInlineCatIconFile(null);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create category', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  const handleInlineNameChange = (val: string) => {
    setInlineCatName(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setInlineCatSlug(autoSlug);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setTitle(text);
    setSlug(text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleEditTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setEditTitle(text);
    setEditSlug(text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a title for the game before publishing.', 'warning', 'Missing Game Title');
      setMessage({ text: 'Game Title is required!', type: 'error' });
      return;
    }

    if (!zipFile) {
      showToast('Please select and upload a Game Build ZIP file (.zip) containing index.html before publishing.', 'warning', 'Missing Game File');
      setMessage({ text: 'Game Build ZIP file is required!', type: 'error' });
      return;
    }

    if (!thumbnailFile) {
      showToast('Please select and upload a Thumbnail image before publishing.', 'warning', 'Missing Game Thumbnail');
      setMessage({ text: 'Thumbnail image is required!', type: 'error' });
      return;
    }

    const hasDesktop = !!featuredDesktopFile;
    const hasMobile = !!featuredMobileFile;
    const missingMsg = getMissingFeaturedMessage(hasDesktop, hasMobile);
    if (isFeatured && missingMsg) {
      showToast(
        `Cannot mark as Featured Game!\n${missingMsg}`,
        'warning',
        'Featured Images Required'
      );
      return;
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('howToPlay', howToPlay);
      formData.append('status', status);
      formData.append('zip', zipFile);
      formData.append('thumbnail', thumbnailFile);
      if (featuredDesktopFile) formData.append('featured_desktop', featuredDesktopFile);
      if (featuredMobileFile) formData.append('featured_mobile', featuredMobileFile);
      if (newGameBothFile) formData.append('new_game_both', newGameBothFile);
      if (gamePageBothFile) formData.append('game_page_both', gamePageBothFile);
      formData.append('isFeatured', isFeatured.toString());
      formData.append('isPopular', isPopular.toString());
      formData.append('isNew', isNew.toString());
      formData.append('metaTitle', metaTitle);
      formData.append('metaDescription', metaDescription);
      formData.append('metaTags', metaTags);
      formData.append('createdAt', createdAt);
      formData.append('likesCount', likesCount.toString());
      formData.append('playCount', playCount.toString());

      const res = await fetch(`${backendUrl}/api/games`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (res.ok) {
        setMessage({ text: 'Game uploaded and published successfully!', type: 'success' });
        fetchGamesData();
        setUploadModalOpen(false);
        // Reset form
        setTitle('');
        setSlug('');
        setDescription('');
        setHowToPlay('');
        setStatus('published');
        setZipFile(null);
        setThumbnailFile(null);
        setFeaturedDesktopFile(null);
        setFeaturedMobileFile(null);
        setNewGameBothFile(null);
        setGamePageBothFile(null);
        setIsFeatured(false);
        setIsPopular(false);
        setIsNew(false);
        setMetaTitle('');
        setMetaDescription('');
        setMetaTags('');
        setCreatedAt(new Date().toISOString().slice(0, 16));
        showToast('Game uploaded and published successfully!', 'success', 'Success');
      } else {
        const err = await res.json();
        const errorMsg = err.error || 'Failed to upload game';
        showToast(errorMsg, 'error', 'Upload Failed');
        setMessage({ text: errorMsg, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading game. Connection to backend failed.', 'error', 'Upload Error');
      setMessage({ text: 'Error uploading game. Check server logs.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = async (game: Game) => {
    setEditingGame(game);
    setEditGameId(game.id);
    setEditTitle(game.title);
    setEditSlug(game.slug);
    setEditCategory(game.category);
    setEditDescription(game.description || '');
    setEditHowToPlay(game.howToPlay || game.how_to_play || '');
    setEditStatus(game.status || 'published');
    setEditZipFile(null);
    setEditThumbnailFile(null);
    setEditFeaturedDesktopFile(null);
    setEditFeaturedMobileFile(null);
    setEditNewGameBothFile(null);
    setEditGamePageBothFile(null);
    setClearFeaturedDesktop(false);
    setClearFeaturedMobile(false);
    setClearNewGameBoth(false);
    setClearGamePageBoth(false);
    setEditIsFeatured(game.isFeatured || false);
    setEditIsPopular(game.isPopular || false);
    setEditIsNew(game.isNew || false);
    setEditMetaTitle(game.metaTitle || '');
    setEditMetaDescription(game.metaDescription || '');
    setEditMetaTags(game.metaTags || '');
    setEditCreatedAt(game.createdAt ? new Date(game.createdAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
    setEditUpdatedAt(game.updatedAt ? new Date(game.updatedAt).toLocaleString() : 'N/A');
    setEditLikesCount(game.likesCount || 0);
    setEditPlayCount(game.playCount || 0);
    setEditMessage({ text: '', type: '' });
    setEditModalOpen(true);

    // Fetch freshest single game details directly from DB to guarantee How to Play is pre-filled
    try {
      const res = await fetch(`${backendUrl}/api/games/${game.id}?t=${Date.now()}`);
      if (res.ok) {
        const freshGame = await res.json();
        setEditHowToPlay(freshGame.how_to_play || freshGame.howToPlay || '');
        if (freshGame.description) setEditDescription(freshGame.description);
        if (freshGame.meta_title) setEditMetaTitle(freshGame.meta_title);
        if (freshGame.meta_description) setEditMetaDescription(freshGame.meta_description);
        if (freshGame.meta_tags) setEditMetaTags(freshGame.meta_tags);
      }
    } catch (err) {
      console.error('Failed to fetch fresh game details for edit modal:', err);
    }
  };

  const handleSaveLikes = async (gameId: string, newLikes: number) => {
    try {
      const formData = new FormData();
      formData.append('likesCount', newLikes.toString());
      const res = await fetch(`${backendUrl}/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to update likes count');
      const updated = await res.json();
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, likesCount: updated.likes_count ?? updated.likesCount ?? newLikes } : g));
      setEditingLikesId(null);
      showToast('Likes count updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating likes count', 'error');
    }
  };

  const handleSavePlays = async (gameId: string, newPlays: number) => {
    try {
      const formData = new FormData();
      formData.append('playCount', newPlays.toString());
      const res = await fetch(`${backendUrl}/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to update play count');
      const updated = await res.json();
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, playCount: updated.play_count ?? updated.playCount ?? newPlays } : g));
      setEditingPlaysId(null);
      showToast('Play count updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating play count', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editSlug || !editCategory) {
      setEditMessage({ text: 'Title, Slug, and Category are required!', type: 'error' });
      return;
    }

    const hasDesktop = !!editFeaturedDesktopFile || (!!editingGame?.featuredDesktopUrl && !clearFeaturedDesktop);
    const hasMobile = !!editFeaturedMobileFile || (!!editingGame?.featuredMobileUrl && !clearFeaturedMobile);
    const missingMsg = getMissingFeaturedMessage(hasDesktop, hasMobile);
    if (editIsFeatured && missingMsg) {
      showToast(
        `Cannot mark as Featured Game!\n${missingMsg}`,
        'warning',
        'Featured Images Required'
      );
      return;
    }

    setEditSubmitting(true);
    setEditMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('slug', editSlug);
      formData.append('category', editCategory);
      formData.append('description', editDescription);
      formData.append('howToPlay', editHowToPlay);
      formData.append('status', editStatus);
      if (editZipFile) formData.append('zip', editZipFile);
      if (editThumbnailFile) formData.append('thumbnail', editThumbnailFile);
      if (editFeaturedDesktopFile) formData.append('featured_desktop', editFeaturedDesktopFile);
      if (editFeaturedMobileFile) formData.append('featured_mobile', editFeaturedMobileFile);
      if (editNewGameBothFile) formData.append('new_game_both', editNewGameBothFile);
      if (editGamePageBothFile) formData.append('game_page_both', editGamePageBothFile);
      if (clearFeaturedDesktop) formData.append('clear_featured_desktop', 'true');
      if (clearFeaturedMobile) formData.append('clear_featured_mobile', 'true');
      if (clearNewGameBoth) formData.append('clear_new_game_both', 'true');
      if (clearGamePageBoth) formData.append('clear_game_page_both', 'true');
      formData.append('isFeatured', editIsFeatured.toString());
      formData.append('isPopular', editIsPopular.toString());
      formData.append('isNew', editIsNew.toString());
      formData.append('metaTitle', editMetaTitle);
      formData.append('metaDescription', editMetaDescription);
      formData.append('metaTags', editMetaTags);
      formData.append('createdAt', editCreatedAt);
      formData.append('likesCount', editLikesCount.toString());
      formData.append('playCount', editPlayCount.toString());

      const res = await fetch(`${backendUrl}/api/games/${editGameId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (res.ok) {
        setEditMessage({ text: 'Game updated successfully!', type: 'success' });
        fetchGamesData();
        setEditModalOpen(false);
        showToast('Game updated successfully!', 'success');
      } else {
        const err = await res.json();
        setEditMessage({ text: err.error || 'Failed to update game', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setEditMessage({ text: 'Error updating game. Check server logs.', type: 'error' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSaveInlineDate = async (gameId: string) => {
    if (!inlineTempCreatedAt) {
      setInlineEditingGameId(null);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ createdAt: inlineTempCreatedAt }),
      });

      if (res.ok) {
        fetchGamesData();
        showToast('Game creation date updated successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update game creation date', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to backend.', 'error');
    } finally {
      setInlineEditingGameId(null);
    }
  };

  const handleToggleStatus = async (gameId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    if (newStatus === 'published') {
      const targetGame = games.find(g => g.id === gameId);
      try {
        const checkRes = await fetch(`${backendUrl}/api/games/${gameId}/files`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (checkRes.ok) {
          const filesData = await checkRes.json();
          const hasIndex = filesData.filesInfo?.hasIndexHtml || filesData.hasIndex;
          if (!hasIndex) {
            showToast(
              `Cannot activate "${targetGame?.title || 'this game'}"!\nThe build files or index.html are missing from server storage. Please edit the game and upload a valid ZIP build first.`,
              'warning',
              'Build Missing'
            );
            return;
          }
        }
      } catch (err) {
        console.error('Error verifying game files before activation:', err);
      }
    }

    try {
      const res = await fetch(`${backendUrl}/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchGamesData();
        showToast(`Game status changed to ${newStatus === 'published' ? 'Active' : 'Inactive'}!`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update game status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to backend.', 'error');
    }
  };

  const handleToggleFeatured = async (gameId: string, currentFeatured: boolean) => {
    const newFeatured = !currentFeatured;
    if (newFeatured) {
      const targetGame = games.find(g => g.id === gameId);
      const hasDesktop = !!targetGame?.featuredDesktopUrl;
      const hasMobile = !!targetGame?.featuredMobileUrl;
      const missingMsg = getMissingFeaturedMessage(hasDesktop, hasMobile);

      if (missingMsg) {
        showToast(
          `Cannot mark "${targetGame?.title || 'this game'}" as Featured!\n${missingMsg}`,
          'warning',
          'Featured Images Required'
        );
        return;
      }
    }

    try {
      const res = await fetch(`${backendUrl}/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFeatured: newFeatured }),
      });

      if (res.ok) {
        fetchGamesData();
      } else {
        const err = await res.json();
        showAlertDialog('Error Updating Featured Status', err.error || 'Failed to update game featured status', 'danger');
      }
    } catch (err) {
      console.error(err);
      showAlertDialog('Connection Error', 'Failed to connect to backend.', 'danger');
    }
  };

  const handleReconcile = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/cleanup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showAlertDialog('Storage Reconciled', 'File system reconciliation cleanup triggered successfully!', 'success');
      } else {
        showAlertDialog('Reconciliation Failed', 'Reconciliation process failed.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showAlertDialog('Connection Error', 'Connection to backend failed.', 'danger');
    }
  };

  const handleDeleteGame = (gameId: string, gameTitle: string) => {
    showConfirmDialog(
      'Delete Game',
      `Are you sure you want to permanently delete "${gameTitle}"?\n\nThis will remove all build files, statistics, and likes from server storage.`,
      async () => {
        try {
          const res = await fetch(`${backendUrl}/api/games/${gameId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            showAlertDialog('Game Deleted', `Game "${gameTitle}" has been permanently deleted.`, 'success');
            fetchGamesData();
          } else {
            const err = await res.json();
            showAlertDialog('Delete Failed', err.error || 'Failed to delete game', 'danger');
          }
        } catch (err) {
          console.error(err);
          showAlertDialog('Connection Error', 'Failed to connect to backend.', 'danger');
        }
      },
      'danger',
      'Permanently Delete',
      'Cancel'
    );
  };

  if (loading && games.length === 0) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>Loading Game Catalogue...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--color-danger)' }}>
        <AlertCircle size={40} />
        <h2 style={{ color: 'white' }}>Error loading games</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  // Calculate dynamic stats for metrics cards
  const totalGames = games.length;
  const totalPlays = games.reduce((sum, g) => sum + g.playCount, 0);

  const formatPlays = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const mostPlayedGame = games.length > 0 
    ? [...games].sort((a, b) => b.playCount - a.playCount)[0]
    : null;
  const mostPlayedTitle = mostPlayedGame ? mostPlayedGame.title : 'None';
  const totalCategories = new Set(games.map(g => g.category)).size;

  // Sort and filter games based on search term and selected columns
  const sortedGames = [...games].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal === undefined || aVal === null) aVal = typeof bVal === 'number' ? 0 : '';
    if (bVal === undefined || bVal === null) bVal = typeof aVal === 'number' ? 0 : '';

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredGames = sortedGames.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                          g.category.toLowerCase().includes(globalSearchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'published' 
        ? g.status === 'published' 
        : g.status !== 'published';
    const matchesCategory = categoryFilter === 'all'
      ? true
      : g.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesFeatured = featuredFilter === 'all'
      ? true
      : featuredFilter === 'on'
        ? g.isFeatured
        : !g.isFeatured;

    return matchesSearch && matchesStatus && matchesCategory && matchesFeatured;
  });

  const itemsPerPage = 10;
  const totalItems = filteredGames.length;
  const totalPages = paginationEnabled ? Math.ceil(totalItems / itemsPerPage) : 1;
  const paginatedGames = paginationEnabled 
    ? filteredGames.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredGames;

  // Helper to generate visible page numbers with ellipsis matching User Management
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const getPlacementBadge = (game: Game) => {
    if (game.isFeatured) {
      return (
        <span className={`${styles.badge} ${styles.placementFeatured}`}>
          Featured
        </span>
      );
    }
    return null;
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>
            Game Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage the platform's game catalog, categories, and placement.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className={styles.reconcileBtn} onClick={handleReconcile} title="Cleanup orphaned directories in gb-games">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FolderSync size={16} /> Reconcile Storage
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.metricsRow}>
        {/* Card 1: TOTAL GAMES */}
        <div className={styles.metricCard}>
          <div className={`${styles.accentLine} ${styles.accentPurple}`} />
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>TOTAL GAMES</span>
            <span className={styles.metricValue}>{totalGames}</span>
            <span className={styles.metricSublabel}>across all categories</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.purpleIcon}`}>
            <Gamepad2 size={24} color="#a855f7" />
          </div>
        </div>

        {/* Card 2: TOTAL PLAYS */}
        <div className={styles.metricCard}>
          <div className={`${styles.accentLine} ${styles.accentCyan}`} />
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>TOTAL PLAYS</span>
            <span className={styles.metricValue}>{formatPlays(totalPlays)}</span>
            <span className={styles.metricSublabel}>all time</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.cyanIcon}`}>
            <Play size={22} color="#22d3ee" style={{ transform: 'translateX(1px)' }} />
          </div>
        </div>

        {/* Card 3: MOST PLAYED */}
        <div 
          className={`${styles.metricCard} ${styles.clickableCard}`}
          onClick={() => {
            if (mostPlayedGame) {
              window.open(`/games/${mostPlayedGame.slug}`, '_blank');
            }
          }}
          title="Click to play game in new tab"
        >
          <div className={`${styles.accentLine} ${styles.accentAmber}`} />
          <div className={styles.metricContent} style={{ overflow: 'hidden', flex: 1, paddingRight: '6px' }}>
            <span className={styles.metricLabel}>MOST PLAYED</span>
            {mostPlayedTitle.length > 12 ? (
              <div className={styles.marqueeContainer}>
                <div className={styles.marqueeText}>
                  {mostPlayedTitle} &nbsp;&nbsp;&bull;&nbsp;&nbsp; {mostPlayedTitle} &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                </div>
              </div>
            ) : (
              <span className={styles.metricValue} style={{ fontSize: '18px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {mostPlayedTitle}
              </span>
            )}
            <span className={styles.metricSublabel}>
              {formatPlays(mostPlayedGame?.playCount || 0)} plays
            </span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.amberIcon}`}>
            <Crown size={24} color="#f59e0b" />
          </div>

          {/* Hover popup tooltip */}
          {mostPlayedGame && (
            <div className={styles.tooltipPopup} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <img 
                  src={mostPlayedGame.thumbnailUrl ? (mostPlayedGame.thumbnailUrl.startsWith('http') ? mostPlayedGame.thumbnailUrl : `${backendUrl}${mostPlayedGame.thumbnailUrl}`) : `${backendUrl}/games/${mostPlayedGame.slug}/thumbnail.jpg`} 
                  alt="" 
                  style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--adm-border, rgba(255,255,255,0.1))' }} 
                />
                <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--adm-text-primary, #ffffff)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '130px' }}>
                    {mostPlayedGame.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--adm-text-secondary, #94a3b8)', textTransform: 'capitalize' }}>
                    {mostPlayedGame.category}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary, #cbd5e1)', borderTop: '1px solid var(--adm-border, rgba(255,255,255,0.1))', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--adm-text-secondary, #94a3b8)' }}>Plays:</span>
                  <span style={{ fontWeight: 600, color: 'var(--adm-text-primary, #ffffff)' }}>{mostPlayedGame.playCount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--adm-text-secondary, #94a3b8)' }}>Likes:</span>
                  <span style={{ fontWeight: 600, color: 'var(--adm-text-primary, #ffffff)' }}>{mostPlayedGame.likesCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--adm-text-secondary, #94a3b8)' }}>Avg Duration:</span>
                  <span style={{ fontWeight: 600, color: 'var(--adm-text-primary, #ffffff)' }}>{formatDuration(mostPlayedGame.avgDuration)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 4: CATEGORIES */}
        <div className={styles.metricCard}>
          <div className={`${styles.accentLine} ${styles.accentGreen}`} />
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>CATEGORIES</span>
            <span className={styles.metricValue}>{totalCategories}</span>
            <span className={styles.metricSublabel}>active game types</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.greenIcon}`}>
            <Layers size={24} color="#34d399" />
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        {/* Table Panel Header */}
        <div className={styles.tableHeaderRow}>
          <h3 className={styles.chartTitle} style={{ border: 'none', padding: 0, margin: 0 }}>Games Library</h3>
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
                    accentColor: '#0086ec'
                  }}
                />
                Paginate
              </label>
            </div>

            {/* Status Filter Pills (All / Active / Inactive) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              background: 'var(--adm-input-bg, #0f172a)',
              border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.1))',
              borderRadius: '8px',
              padding: '2px',
              marginRight: '6px',
              position: 'relative',
              isolation: 'isolate',
              minWidth: '240px'
            }}>
              {/* Sliding Active Pill Background */}
              <div style={{
                position: 'absolute',
                top: '2px',
                bottom: '2px',
                left: '2px',
                width: 'calc((100% - 4px) / 3)',
                borderRadius: '6px',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                transform: statusFilter === 'all' 
                  ? 'translateX(0%)' 
                  : statusFilter === 'published' 
                    ? 'translateX(100%)' 
                    : 'translateX(200%)',
                background: statusFilter === 'all'
                  ? 'rgba(56, 189, 248, 0.2)'
                  : statusFilter === 'published'
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                border: statusFilter === 'all'
                  ? '1px solid rgba(56, 189, 248, 0.5)'
                  : statusFilter === 'published'
                    ? '1px solid rgba(34, 197, 94, 0.5)'
                    : '1px solid rgba(239, 68, 68, 0.5)',
                boxShadow: statusFilter === 'all'
                  ? '0 0 10px rgba(56, 189, 248, 0.2)'
                  : statusFilter === 'published'
                    ? '0 0 10px rgba(34, 197, 94, 0.2)'
                    : '0 0 10px rgba(239, 68, 68, 0.2)',
                zIndex: 1,
                pointerEvents: 'none'
              }} />

              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                style={{
                  background: 'transparent',
                  color: statusFilter === 'all' ? '#38bdf8' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  zIndex: 2,
                  position: 'relative',
                  transition: 'color 0.2s ease',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
                title="Show all games"
              >
                All ({games.length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('published'); setCurrentPage(1); }}
                style={{
                  background: 'transparent',
                  color: statusFilter === 'published' ? '#22c55e' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  zIndex: 2,
                  position: 'relative',
                  transition: 'color 0.2s ease',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
                title="Show active published games only"
              >
                Active ({games.filter(g => g.status === 'published').length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('draft'); setCurrentPage(1); }}
                style={{
                  background: 'transparent',
                  color: statusFilter === 'draft' ? '#ef4444' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  zIndex: 2,
                  position: 'relative',
                  transition: 'color 0.2s ease',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
                title="Show inactive draft games only"
              >
                Inactive ({games.filter(g => g.status !== 'published').length})
              </button>
            </div>

            <div className={styles.tableSearchWrapper}>
              <Search size={15} className={styles.tableSearchIcon} />
              <input 
                type="text" 
                placeholder="Search game name..." 
                className={styles.tableSearchInput}
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
              />
            </div>
            <button className={styles.addGameBtn} onClick={() => { resetUploadForm(); setUploadModalOpen(true); }}>
              <Plus size={16} /> <span>Add Game</span>
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '250px', cursor: 'pointer', userSelect: 'none', paddingLeft: '34px' }} onClick={() => handleSort('title')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>GAME NAME</span>
                    {sortField === 'title' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                <th ref={categoryDropdownRef} style={{ width: '130px', userSelect: 'none', textAlign: 'center' }}>
                  <div 
                    onClick={() => setCategoryDropdownOpen(prev => !prev)}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      margin: '0 auto',
                      gap: '5px', 
                      cursor: 'pointer',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: categoryFilter !== 'all' ? 'rgba(0, 134, 236, 0.2)' : 'transparent',
                      border: categoryFilter !== 'all' ? '1px solid rgba(0, 134, 236, 0.45)' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    title="Click to filter by category"
                  >
                    <span style={{ color: categoryFilter !== 'all' ? '#38bdf8' : 'inherit', fontWeight: categoryFilter !== 'all' ? 700 : 'inherit' }}>
                      CATEGORY {categoryFilter !== 'all' ? `(${categoryFilter})` : ''}
                    </span>
                    <Filter size={13} style={{ color: categoryFilter !== 'all' ? '#38bdf8' : 'var(--text-secondary)' }} />
                  </div>

                  {/* Dropdown Menu attached directly to Category Column Header */}
                  {categoryDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--adm-modal-bg, var(--adm-card-bg, #161b22))',
                      border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.15))',
                      borderRadius: '10px',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                      padding: '6px',
                      minWidth: '175px',
                      zIndex: 1000,
                      textAlign: 'left',
                      fontWeight: 'normal',
                      textTransform: 'none'
                    }}>
                      <div 
                        onClick={() => { setCategoryFilter('all'); setCategoryDropdownOpen(false); setCurrentPage(1); }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: categoryFilter === 'all' ? 700 : 500,
                          background: categoryFilter === 'all' ? 'rgba(0, 134, 236, 0.2)' : 'transparent',
                          color: categoryFilter === 'all' ? '#38bdf8' : '#e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}
                      >
                        <span>All Categories</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({games.length})</span>
                      </div>

                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {Array.from(new Set([...dbCategories, ...games.map(g => g.category)]))
                          .filter(Boolean)
                          .map((cat) => {
                            const count = games.filter(g => g.category.toLowerCase() === cat.toLowerCase()).length;
                            const isSelected = categoryFilter.toLowerCase() === cat.toLowerCase();
                            return (
                              <div
                                key={cat}
                                onClick={() => { setCategoryFilter(cat); setCategoryDropdownOpen(false); setCurrentPage(1); }}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? 700 : 400,
                                  background: isSelected ? 'rgba(0, 134, 236, 0.2)' : 'transparent',
                                  color: isSelected ? '#38bdf8' : '#cbd5e1',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                <span>{cat}</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({count})</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </th>
                <th style={{ width: '65px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('likesCount')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>LIKES</span>
                    {sortField === 'likesCount' ? (
                      sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                <th style={{ width: '65px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('playCount')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>PLAYS</span>
                    {sortField === 'playCount' ? (
                      sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                {/* Featured Column with Filter Dropdown */}
                <th ref={featuredDropdownRef} style={{ width: '95px', textAlign: 'center', userSelect: 'none' }}>
                  <div 
                    onClick={() => setFeaturedDropdownOpen(prev => !prev)}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      cursor: 'pointer',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: featuredFilter !== 'all' ? 'rgba(0, 134, 236, 0.2)' : 'transparent',
                      border: featuredFilter !== 'all' ? '1px solid rgba(0, 134, 236, 0.45)' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    title="Click to filter by Featured status"
                  >
                    <span style={{ color: featuredFilter !== 'all' ? '#38bdf8' : 'inherit', fontWeight: featuredFilter !== 'all' ? 700 : 'inherit' }}>
                      FEATURED {featuredFilter !== 'all' ? `(${featuredFilter.toUpperCase()})` : ''}
                    </span>
                    <Filter size={13} style={{ color: featuredFilter !== 'all' ? '#38bdf8' : 'var(--text-secondary)' }} />
                  </div>

                  {/* Dropdown Menu attached directly to Featured Column Header */}
                  {featuredDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--adm-modal-bg, var(--adm-card-bg, #161b22))',
                      border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.15))',
                      borderRadius: '10px',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                      padding: '6px',
                      minWidth: '165px',
                      zIndex: 1000,
                      textAlign: 'left',
                      fontWeight: 'normal',
                      textTransform: 'none'
                    }}>
                      <div 
                        onClick={() => { setFeaturedFilter('all'); setFeaturedDropdownOpen(false); setCurrentPage(1); }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: featuredFilter === 'all' ? 700 : 500,
                          background: featuredFilter === 'all' ? 'rgba(0, 134, 236, 0.2)' : 'transparent',
                          color: featuredFilter === 'all' ? '#38bdf8' : '#e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}
                      >
                        <span>All Games</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({games.length})</span>
                      </div>

                      <div 
                        onClick={() => { setFeaturedFilter('on'); setFeaturedDropdownOpen(false); setCurrentPage(1); }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: featuredFilter === 'on' ? 700 : 400,
                          background: featuredFilter === 'on' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                          color: featuredFilter === 'on' ? '#22c55e' : '#cbd5e1',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <span>Featured (ON)</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({games.filter(g => g.isFeatured).length})</span>
                      </div>

                      <div 
                        onClick={() => { setFeaturedFilter('off'); setFeaturedDropdownOpen(false); setCurrentPage(1); }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: featuredFilter === 'off' ? 700 : 400,
                          background: featuredFilter === 'off' ? 'rgba(148, 163, 184, 0.2)' : 'transparent',
                          color: featuredFilter === 'off' ? '#94a3b8' : '#cbd5e1',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <span>Not Featured (OFF)</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({games.filter(g => !g.isFeatured).length})</span>
                      </div>
                    </div>
                  )}
                </th>
                <th style={{ width: '95px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('createdAt')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>CREATED</span>
                    {sortField === 'createdAt' ? (
                      sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                <th style={{ width: '95px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('updatedAt')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>UPDATED</span>
                    {sortField === 'updatedAt' ? (
                      sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                <th style={{ width: '130px', textAlign: 'right', paddingRight: '12px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGames.length > 0 ? (
                paginatedGames.map((game, index) => (
                  <tr 
                    key={game.id}
                    style={game.status !== 'published' ? { background: 'rgba(239, 68, 68, 0.07)' } : undefined}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, minWidth: '20px', textAlign: 'center', display: 'inline-block' }}>
                          {paginationEnabled ? (currentPage - 1) * itemsPerPage + index + 1 : index + 1}
                        </span>
                        <a href={`/games/${game.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', flexShrink: 0 }}>
                          <img src={game.thumbnailUrl ? (game.thumbnailUrl.startsWith('http') ? game.thumbnailUrl : `${backendUrl}${game.thumbnailUrl}`) : `${backendUrl}/games/${game.slug}/thumbnail.jpg`} alt="" className={styles.gameThumbnail} />
                        </a>
                        <div>
                          <a href={`/games/${game.slug}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <div style={{ fontWeight: 700, color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.95rem' }} className={styles.gameTitleLink}>{game.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary, var(--text-secondary))' }}>/{game.slug}</div>
                          </a>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={styles.categoryBadge} style={{ margin: '0 auto' }}>
                        {game.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--adm-text-primary, #ffffff)' }}>
                        {game.likesCount.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--adm-text-primary, #ffffff)' }}>
                        {game.playCount.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: game.isFeatured ? '#22c55e' : '#64748b', fontWeight: 600, width: '28px', textAlign: 'right' }}>
                          {game.isFeatured ? 'ON' : 'OFF'}
                        </span>
                        <button 
                          type="button"
                          className={`${styles.toggleSwitch} ${game.isFeatured ? styles.toggleSwitchActive : ''}`}
                          onClick={() => handleToggleFeatured(game.id, game.isFeatured)}
                          style={{ cursor: 'pointer', padding: 0, borderStyle: 'solid', display: 'inline-block' }}
                          title={game.isFeatured ? 'Turn OFF Featured Status' : 'Turn ON Featured Status'}
                        >
                          <div className={styles.toggleKnob} />
                        </button>
                      </div>
                    </td>
                    <td style={{ color: 'var(--adm-text-primary, #cbd5e1)', fontSize: '0.85rem', minWidth: '150px', textAlign: 'center' }}>
                      {inlineEditingGameId === game.id ? (
                        <input
                          type="date"
                          value={inlineTempCreatedAt}
                          onChange={(e) => setInlineTempCreatedAt(e.target.value)}
                          onBlur={() => handleSaveInlineDate(game.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveInlineDate(game.id);
                            } else if (e.key === 'Escape') {
                              setInlineEditingGameId(null);
                            }
                          }}
                          ref={(input) => {
                            if (input) {
                              input.focus();
                              try {
                                if (typeof input.showPicker === 'function') {
                                  input.showPicker();
                                }
                              } catch (err) {
                                console.error('Error showing date picker:', err);
                              }
                            }
                          }}
                          style={{
                            background: 'var(--adm-input-bg, #161b22)',
                            border: '1px solid var(--adm-border, #334155)',
                            borderRadius: '4px',
                            color: 'var(--adm-text-primary, #ffffff)',
                            padding: '3px 6px',
                            fontFamily: 'inherit',
                            fontSize: '0.8rem',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => {
                            setInlineEditingGameId(game.id);
                            setInlineTempCreatedAt(game.createdAt ? new Date(game.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                          }}
                          className={styles.editableDateCell}
                          style={{ margin: '0 auto' }}
                          title="Click to edit creation date"
                        >
                          <span>{game.createdAt ? new Date(game.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                          <Calendar size={13} className={styles.editDateIcon} />
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--adm-text-primary, #cbd5e1)', fontSize: '0.85rem', textAlign: 'center' }}>
                      {game.updatedAt ? new Date(game.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionCell} style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          className={styles.actionBtn}
                          onClick={() => handleOpenFilesModal(game)}
                          title="Inspect Game Files & Storage Size"
                        >
                          <HardDrive size={15} />
                        </button>
                        <button 
                          className={styles.actionBtn}
                          onClick={() => handleOpenEditModal(game)}
                          title="Edit Game"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteGame(game.id, game.title)}
                          title="Delete Game"
                        >
                          <Trash2 size={15} />
                        </button>
                        <button 
                          className={styles.actionBtn}
                          onClick={() => handleToggleStatus(game.id, game.status)}
                          title={game.status === 'published' ? 'Active Game (Click to Deactivate)' : 'Inactive Game (Click to Activate)'}
                        >
                          {game.status === 'published' ? (
                            <ToggleRight size={18} style={{ color: '#0086ec' }} />
                          ) : (
                            <ToggleLeft size={18} style={{ color: '#64748b' }} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    {globalSearchQuery ? 'No games matching search term.' : 'No games uploaded yet. Click "Add Game" to add your first game.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
            </div>
            <div className={styles.paginationPages}>
              <button
                type="button"
                className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((pageNum, idx) => (
                typeof pageNum === 'number' ? (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.paginationBtn} ${currentPage === pageNum ? styles.paginationBtnActive : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ) : (
                  <span key={idx} style={{ padding: '0 6px', color: 'var(--text-secondary)', alignSelf: 'center', fontSize: '0.85rem', userSelect: 'none' }}>
                    {pageNum}
                  </span>
                )
              ))}
              <button
                type="button"
                className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Game Modal */}
      {uploadModalOpen && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Add New Game</h3>
                <p className={styles.modalSubtitle}>Fill in the details to publish a game to the library.</p>
              </div>
              <button 
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => { resetUploadForm(); setUploadModalOpen(false); }}
              >
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            {message.text && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--border-radius-md)', 
                fontSize: '0.85rem', 
                marginBottom: '1rem',
                border: '1px solid',
                backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'
              }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className={styles.form}>
              <div className={styles.figmaFormGrid}>
                {/* Game Title */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Game Name</label>
                  <input 
                    type="text" 
                    className={styles.figmaInput} 
                    placeholder="e.g. Sweet Candy"
                    value={title} 
                    onChange={handleTitleChange} 
                    required 
                  />
                </div>

                {/* Category */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Category</label>
                  <CustomCategorySelect
                    value={category}
                    onChange={(val) => setCategory(val)}
                    categories={dbCategories}
                    onCreateClick={() => {
                      setInlineCategoryTrigger('upload');
                      setInlineCatName('');
                      setInlineCatSlug('');
                      setInlineCatIconFile(null);
                      setInlineCategoryModalOpen(true);
                    }}
                  />
                </div>

                {/* Description */}
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Description</label>
                  <textarea 
                    className={styles.figmaTextarea} 
                    rows={3}
                    placeholder="Short description of the game"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Slug */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Slug</label>
                  <input 
                    type="text" 
                    className={styles.figmaInput} 
                    placeholder="sweet-candy"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    required 
                  />
                </div>

                {/* Featured Game Toggle */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Featured Game</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '42px' }}>
                    <span style={{ fontSize: '0.85rem', color: isFeatured ? '#22c55e' : '#94a3b8', fontWeight: 600, width: '32px' }}>
                      {isFeatured ? 'ON' : 'OFF'}
                    </span>
                    <button 
                      type="button"
                      className={`${styles.toggleSwitch} ${isFeatured ? styles.toggleSwitchActive : ''}`}
                      onClick={() => {
                        if (!isFeatured) {
                          const hasDesktop = !!featuredDesktopFile;
                          const hasMobile = !!featuredMobileFile;
                          const missingMsg = getMissingFeaturedMessage(hasDesktop, hasMobile);
                          if (missingMsg) {
                            showToast(
                              `Cannot mark as Featured Game!\n${missingMsg}`,
                              'warning',
                              'Featured Images Required'
                            );
                            return;
                          }
                        }
                        setIsFeatured(!isFeatured);
                      }}
                      style={{ cursor: 'pointer', padding: 0, borderStyle: 'solid', display: 'inline-block' }}
                    >
                      <div className={styles.toggleKnob} />
                    </button>
                  </div>
                </div>

                {/* Meta Title */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Meta Title</label>
                  <input 
                    type="text" 
                    className={styles.figmaInput} 
                    placeholder="SEO title for game page"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                  />
                </div>

                {/* Meta Tags */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Meta Tags</label>
                  <input 
                    type="text" 
                    className={styles.figmaInput} 
                    placeholder="SEO tags for game page"
                    value={metaTags}
                    onChange={(e) => setMetaTags(e.target.value)}
                  />
                </div>

                {/* Meta Description */}
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Meta Description</label>
                  <textarea 
                    className={styles.figmaTextarea} 
                    rows={2}
                    placeholder="SEO description for game page"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                  />
                </div>

                {/* How to Play */}
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>How to Play (Bullet Points)</label>
                  <textarea 
                    className={styles.figmaTextarea} 
                    rows={4}
                    placeholder={`Take control of your character\nServe dishes quickly to maintain satisfaction levels\nComplete goals to unlock new recipes`}
                    value={howToPlay}
                    onChange={(e) => setHowToPlay(e.target.value)}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    Enter each instruction point on a new line.
                  </span>
                </div>

                {/* Initial Status */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Initial Status</label>
                  <div 
                    className={styles.toggleWrapper} 
                    onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
                  >
                    <div className={`${styles.toggleSwitch} ${status === 'published' ? styles.toggleSwitchActive : ''}`}>
                      <span className={styles.toggleKnob} />
                    </div>
                    <span className={styles.toggleLabel}>
                      {status === 'published' ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Empty block to align grid */}
                <div className={styles.figmaFormGroup}></div>

                {/* Files Grid (Full width) */}
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Game Files & Images</label>
                  <div className={styles.fileUploadsGrid}>
                    {/* Game ZIP Build */}
                    <DragAndDropUpload
                      id="zip-input"
                      accept=".zip"
                      label="Game ZIP File"
                      sublabel="Upload .zip build"
                      required
                      selectedFile={zipFile}
                      onFileSelect={setZipFile}
                    />

                    {/* Cover Thumbnail */}
                    <DragAndDropUpload
                      id="thumb-input"
                      accept="image/*"
                      label="Cover Thumbnail (1:1)"
                      sublabel="Square thumbnail"
                      required
                      selectedFile={thumbnailFile}
                      onFileSelect={setThumbnailFile}
                    />

                    {/* Featured Desktop */}
                    <DragAndDropUpload
                      id="desktop-featured-input"
                      accept="image/*"
                      label="Featured Desktop (21:9)"
                      sublabel="Carousel desktop banner"
                      selectedFile={featuredDesktopFile}
                      onFileSelect={(file) => {
                        setFeaturedDesktopFile(file);
                        if (!file) setIsFeatured(false);
                      }}
                    />

                    {/* Featured Mobile */}
                    <DragAndDropUpload
                      id="mobile-featured-input"
                      accept="image/*"
                      label="Featured Mobile (16:9)"
                      sublabel="Carousel mobile banner"
                      selectedFile={featuredMobileFile}
                      onFileSelect={(file) => {
                        setFeaturedMobileFile(file);
                        if (!file) setIsFeatured(false);
                      }}
                    />

                    {/* New Game Banner */}
                    <DragAndDropUpload
                      id="new-game-both-input"
                      accept="image/*"
                      label="New Game Vertical Image (1:1.4)"
                      sublabel="Vertical banner (1:1.4)"
                      selectedFile={newGameBothFile}
                      onFileSelect={setNewGameBothFile}
                    />

                    {/* Game Page Cover */}
                    <DragAndDropUpload
                      id="game-page-cover-input"
                      accept="image/*"
                      label="Game Page Cover Image (4:3)"
                      sublabel="Play page header background (4:3)"
                      selectedFile={gamePageBothFile}
                      onFileSelect={setGamePageBothFile}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.modalActionsRow}>
                <button 
                  type="button" 
                  className={styles.modalCancelBtn} 
                  onClick={() => { resetUploadForm(); setUploadModalOpen(false); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.gradientSubmitBtn}
                  disabled={submitting}
                >
                  {submitting ? 'Publishing Game...' : 'Publish Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Game Modal */}
      {/* Game Files & Storage Inspection Modal */}
      {filesModalOpen && inspectingGame && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '680px', width: '90%' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Files & Storage — {inspectingGame.title}</h3>
                <p className={styles.modalSubtitle}>Inspect build folder size, files list, and index.html health status.</p>
              </div>
              <button 
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setFilesModalOpen(false)}
              >
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            {loadingFilesInfo ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                Loading game files info...
              </div>
            ) : filesInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                {/* Metrics Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ background: 'var(--adm-input-bg, rgba(15, 23, 42, 0.6))', border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.08))', borderRadius: '10px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary, #94a3b8)', display: 'block' }}>Total Size</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--adm-accent, #0086ec)' }}>{filesInfo.totalSizeFormatted}</strong>
                  </div>

                  <div style={{ background: 'var(--adm-input-bg, rgba(15, 23, 42, 0.6))', border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.08))', borderRadius: '10px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary, #94a3b8)', display: 'block' }}>Total Files</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--adm-text-primary, #ffffff)' }}>{filesInfo.fileCount} files</strong>
                  </div>

                  <div style={{ background: 'var(--adm-input-bg, rgba(15, 23, 42, 0.6))', border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.08))', borderRadius: '10px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary, #94a3b8)', display: 'block' }}>Build Health</span>
                    {filesInfo.hasIndexHtml ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <CheckCircle2 size={14} /> Healthy
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--adm-red-text, #ef4444)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <XCircle size={14} /> Missing index.html
                      </span>
                    )}
                  </div>
                </div>

                {/* Search / Filter & View Mode Toggle Bar */}
                {filesInfo.files.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--adm-input-bg, #0f172a)', border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.1))', borderRadius: '8px', padding: '6px 12px', flex: 1 }}>
                      <Search size={14} style={{ color: 'var(--adm-text-muted, #64748b)' }} />
                      <input 
                        type="text" 
                        placeholder="Filter files or folders..." 
                        style={{ background: 'transparent', border: 'none', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                        value={filesSearchQuery}
                        onChange={(e) => setFilesSearchQuery(e.target.value)}
                      />
                    </div>
                    <div style={{
                      position: 'relative',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      alignItems: 'center',
                      background: 'var(--adm-input-bg, #0f172a)',
                      border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.1))',
                      borderRadius: '8px',
                      padding: '3px',
                      userSelect: 'none'
                    }}>
                      {/* Sliding active pill indicator */}
                      <div style={{
                        position: 'absolute',
                        top: '3px',
                        bottom: '3px',
                        left: '3px',
                        width: 'calc(50% - 3px)',
                        background: 'linear-gradient(135deg, #0086ec 0%, #2c00fc 100%)',
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0, 134, 236, 0.35)',
                        transform: filesViewMode === 'list' ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 1
                      }} />

                      <button
                        type="button"
                        onClick={() => setFilesViewMode('list')}
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          background: 'transparent',
                          color: filesViewMode === 'list' ? '#ffffff' : 'var(--adm-text-secondary, #64748b)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'color 0.25s ease'
                        }}
                        title="Flat List View"
                      >
                        <List size={13} style={{ color: filesViewMode === 'list' ? '#ffffff' : 'var(--adm-text-secondary, #64748b)', transition: 'color 0.25s ease', flexShrink: 0 }} />
                        <span style={{ color: filesViewMode === 'list' ? '#ffffff' : 'var(--adm-text-primary, #475569)', transition: 'color 0.25s ease', whiteSpace: 'nowrap' }}>Flat List</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilesViewMode('tree')}
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          background: 'transparent',
                          color: filesViewMode === 'tree' ? '#ffffff' : 'var(--adm-text-secondary, #64748b)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'color 0.25s ease'
                        }}
                        title="Mac Finder Folder Tree View"
                      >
                        <Folder size={13} style={{ color: filesViewMode === 'tree' ? '#ffffff' : 'var(--adm-text-secondary, #64748b)', transition: 'color 0.25s ease', flexShrink: 0 }} />
                        <span style={{ color: filesViewMode === 'tree' ? '#ffffff' : 'var(--adm-text-primary, #475569)', transition: 'color 0.25s ease', whiteSpace: 'nowrap' }}>Folder Tree</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Scrollable Files Container */}
                <div style={{ maxHeight: '250px', overflowY: 'auto', background: 'var(--adm-input-bg, rgba(10, 16, 32, 0.8))', border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.06))', borderRadius: '10px', padding: '8px 12px' }}>
                  {!filesInfo.folderExists || filesInfo.files.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--adm-text-secondary, #64748b)', fontSize: '0.85rem' }}>
                      No build files found on disk for this game.
                    </div>
                  ) : filesViewMode === 'tree' ? (
                    /* Mac Finder Folder Tree View */
                    buildFileTree(filesInfo.files).map((node, idx) => (
                      <FileTreeNodeItem key={idx} node={node} depth={0} searchQuery={filesSearchQuery} />
                    ))
                  ) : (
                    /* Flat List View */
                    filesInfo.files
                      .filter(f => f.relativePath.toLowerCase().includes(filesSearchQuery.toLowerCase()))
                      .map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: idx < filesInfo.files.length - 1 ? '1px solid var(--adm-border, rgba(255, 255, 255, 0.04))' : 'none', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, paddingRight: '12px' }}>
                            <FileText size={14} style={{ color: file.name.toLowerCase() === 'index.html' ? '#22c55e' : 'var(--adm-accent, #0086ec)', flexShrink: 0 }} />
                            <span style={{ color: file.name.toLowerCase() === 'index.html' ? '#22c55e' : 'var(--adm-text-primary, #e2e8f0)', fontWeight: file.name.toLowerCase() === 'index.html' ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.relativePath}>
                              {file.relativePath}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--adm-table-header-bg, rgba(255, 255, 255, 0.06))', color: 'var(--adm-text-secondary, #94a3b8)', fontWeight: 600 }}>
                              {file.type}
                            </span>
                            <span style={{ color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.75rem', width: '65px', textAlign: 'right' }}>
                              {file.sizeFormatted}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Warning message if index.html is missing */}
                {!filesInfo.hasIndexHtml && filesInfo.folderExists && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '0.8rem' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span>Warning: index.html was not found in this game's build folder. Game is kept inactive until a valid ZIP build is uploaded.</span>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleClearBuildFiles}
                    disabled={clearingFiles || !filesInfo.folderExists}
                  >
                    <Trash2 size={14} />
                    <span>{clearingFiles ? 'Clearing Files...' : 'Clear Build Files & Deactivate'}</span>
                  </button>

                  <button
                    type="button"
                    className={styles.modalCancelBtn}
                    onClick={() => setFilesModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {editModalOpen && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Edit Game details</h3>
                <p className={styles.modalSubtitle}>Modify the details of this game.</p>
              </div>
              <button 
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => { setEditModalOpen(false); setEditMessage({ text: '', type: '' }); }}
              >
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            {editMessage.text && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--border-radius-md)', 
                fontSize: '0.85rem', 
                marginBottom: '1rem',
                border: '1px solid',
                borderColor: editMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                backgroundColor: editMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                color: editMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'
              }}>
                {editMessage.text}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className={styles.form}>
              <div className={styles.figmaFormGrid}>
                {/* Game Title */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Game Name</label>
                  <input 
                    type="text" 
                    className={styles.figmaInput} 
                    placeholder="e.g. Sweet Candy"
                    value={editTitle} 
                    onChange={handleEditTitleChange} 
                    required 
                  />
                </div>

                {/* Category */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Category</label>
                  <CustomCategorySelect
                    value={editCategory}
                    onChange={(val) => setEditCategory(val)}
                    categories={dbCategories}
                    onCreateClick={() => {
                      setInlineCategoryTrigger('edit');
                      setInlineCatName('');
                      setInlineCatSlug('');
                      setInlineCatIconFile(null);
                      setInlineCategoryModalOpen(true);
                    }}
                  />
                </div>

                {/* Description */}
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Description</label>
                  <textarea 
                    className={styles.figmaTextarea} 
                    rows={3}
                    placeholder="Short description of the game"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                {/* Slug */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Slug</label>
                  <input 
                    type="text" 
                    className={styles.figmaInput} 
                    placeholder="sweet-candy"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    required 
                  />
                </div>

                {/* Featured Game Toggle */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Featured Game</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '42px' }}>
                    <span style={{ fontSize: '0.85rem', color: editIsFeatured ? '#22c55e' : '#94a3b8', fontWeight: 600, width: '32px' }}>
                      {editIsFeatured ? 'ON' : 'OFF'}
                    </span>
                    <button 
                      type="button"
                      className={`${styles.toggleSwitch} ${editIsFeatured ? styles.toggleSwitchActive : ''}`}
                      onClick={() => {
                        if (!editIsFeatured) {
                          const hasDesktop = !!editFeaturedDesktopFile || (!!editingGame?.featuredDesktopUrl && !clearFeaturedDesktop);
                          const hasMobile = !!editFeaturedMobileFile || (!!editingGame?.featuredMobileUrl && !clearFeaturedMobile);
                          const missingMsg = getMissingFeaturedMessage(hasDesktop, hasMobile);
                          if (missingMsg) {
                            showToast(
                              `Cannot mark as Featured Game!\n${missingMsg}`,
                              'warning',
                              'Featured Images Required'
                            );
                            return;
                          }
                        }
                        setEditIsFeatured(!editIsFeatured);
                      }}
                      style={{ cursor: 'pointer', padding: 0, borderStyle: 'solid', display: 'inline-block' }}
                    >
                      <div className={styles.toggleKnob} />
                    </button>
                  </div>
                </div>

                {/* Meta Title */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Meta Title</label>
                  <input 
                    type="text" 
                    className={styles.figmaInput} 
                    placeholder="SEO title for game page"
                    value={editMetaTitle}
                    onChange={(e) => setEditMetaTitle(e.target.value)}
                  />
                </div>

                {/* Meta Tags */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Meta Tags</label>
                  <input 
                    type="text" 
                    className={styles.figmaInput} 
                    placeholder="SEO tags for game page"
                    value={editMetaTags}
                    onChange={(e) => setEditMetaTags(e.target.value)}
                  />
                </div>

                {/* Meta Description */}
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Meta Description</label>
                  <textarea 
                    className={styles.figmaTextarea} 
                    rows={2}
                    placeholder="SEO description for game page"
                    value={editMetaDescription}
                    onChange={(e) => setEditMetaDescription(e.target.value)}
                  />
                </div>

                {/* How to Play */}
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>How to Play (Bullet Points)</label>
                  <textarea 
                    className={styles.figmaTextarea} 
                    rows={4}
                    placeholder={`Take control of your character\nServe dishes quickly to maintain satisfaction levels\nComplete goals to unlock new recipes`}
                    value={editHowToPlay}
                    onChange={(e) => setEditHowToPlay(e.target.value)}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    Enter each instruction point on a new line.
                  </span>
                </div>

                {/* Initial Status */}
                <div className={styles.figmaFormGroup}>
                  <label className={styles.figmaLabel}>Status</label>
                  <div 
                    className={styles.toggleWrapper} 
                    onClick={() => setEditStatus(editStatus === 'published' ? 'draft' : 'published')}
                  >
                    <div className={`${styles.toggleSwitch} ${editStatus === 'published' ? styles.toggleSwitchActive : ''}`}>
                      <span className={styles.toggleKnob} />
                    </div>
                    <span className={styles.toggleLabel}>
                      {editStatus === 'published' ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Empty block to align grid */}
                <div className={styles.figmaFormGroup}></div>

                {/* Files Grid (Full width) */}
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Update Game Files & Images (Optional)</label>
                  <div className={styles.fileUploadsGrid}>
                    {/* Game ZIP Build */}
                    <DragAndDropUpload
                      id="edit-zip-input"
                      accept=".zip"
                      label="Update Game ZIP File"
                      sublabel="Upload new build .zip"
                      selectedFile={editZipFile}
                      onFileSelect={setEditZipFile}
                    />

                    {/* Cover Thumbnail */}
                    <DragAndDropUpload
                      id="edit-thumb-input"
                      accept="image/*"
                      label="Update Cover Thumbnail (1:1)"
                      sublabel="Replace 1:1 thumbnail"
                      selectedFile={editThumbnailFile}
                      currentPreviewUrl={editingGame?.thumbnailUrl}
                      onFileSelect={setEditThumbnailFile}
                    />

                    {/* Featured Desktop */}
                    <DragAndDropUpload
                      id="edit-desktop-featured-input"
                      accept="image/*"
                      label="Update Featured Desktop Image (21:9)"
                      sublabel="Replace desktop banner"
                      selectedFile={editFeaturedDesktopFile}
                      currentPreviewUrl={clearFeaturedDesktop ? null : editingGame?.featuredDesktopUrl}
                      onFileSelect={(file) => {
                        setEditFeaturedDesktopFile(file);
                        if (file) {
                          setClearFeaturedDesktop(false);
                        } else {
                          const hasSavedDesktop = editingGame?.featuredDesktopUrl && !clearFeaturedDesktop;
                          if (!hasSavedDesktop) {
                            setEditIsFeatured(false);
                          }
                        }
                      }}
                      onClearCurrent={() => {
                        setClearFeaturedDesktop(true);
                        setEditIsFeatured(false);
                      }}
                    />

                    {/* Featured Mobile */}
                    <DragAndDropUpload
                      id="edit-mobile-featured-input"
                      accept="image/*"
                      label="Update Featured Mobile Image (16:9)"
                      sublabel="Replace mobile banner"
                      selectedFile={editFeaturedMobileFile}
                      currentPreviewUrl={clearFeaturedMobile ? null : editingGame?.featuredMobileUrl}
                      onFileSelect={(file) => {
                        setEditFeaturedMobileFile(file);
                        if (file) {
                          setClearFeaturedMobile(false);
                        } else {
                          const hasSavedMobile = editingGame?.featuredMobileUrl && !clearFeaturedMobile;
                          if (!hasSavedMobile) {
                            setEditIsFeatured(false);
                          }
                        }
                      }}
                      onClearCurrent={() => {
                        setClearFeaturedMobile(true);
                        setEditIsFeatured(false);
                      }}
                    />

                    {/* New Game Banner */}
                    <DragAndDropUpload
                      id="edit-new-game-both-input"
                      accept="image/*"
                      label="Update New Game Vertical Image (1:1.4)"
                      sublabel="Replace vertical image (1:1.4)"
                      selectedFile={editNewGameBothFile}
                      currentPreviewUrl={clearNewGameBoth ? null : editingGame?.newGameBothUrl}
                      onFileSelect={(file) => {
                        setEditNewGameBothFile(file);
                        if (file) setClearNewGameBoth(false);
                      }}
                      onClearCurrent={() => setClearNewGameBoth(true)}
                    />

                    {/* Game Page Cover */}
                    <DragAndDropUpload
                      id="edit-game-page-cover-input"
                      accept="image/*"
                      label="Update Game Page Cover Image (4:3)"
                      sublabel="Replace cover image (4:3)"
                      selectedFile={editGamePageBothFile}
                      currentPreviewUrl={clearGamePageBoth ? null : editingGame?.gamePageBothUrl}
                      onFileSelect={(file) => {
                        setEditGamePageBothFile(file);
                        if (file) setClearGamePageBoth(false);
                      }}
                      onClearCurrent={() => setClearGamePageBoth(true)}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.modalActionsRow}>
                <button 
                  type="button" 
                  className={styles.modalCancelBtn} 
                  onClick={() => { setEditModalOpen(false); setEditMessage({ text: '', type: '' }); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.gradientSubmitBtn}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Category Creation Modal */}
      {inlineCategoryModalOpen && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '450px' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Create New Category</h3>
                <p className={styles.modalSubtitle}>Add a new category to group your HTML5 games.</p>
              </div>
              <button 
                type="button"
                className={styles.modalCloseBtn} 
                onClick={() => setInlineCategoryModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCategoryInline} className={styles.form}>
              <div className={styles.figmaFormGrid}>
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Category Name</label>
                  <input 
                    type="text" 
                    value={inlineCatName} 
                    onChange={(e) => handleInlineNameChange(e.target.value)}
                    className={styles.figmaInput} 
                    placeholder="e.g. Strategy, RPG" 
                    required
                  />
                </div>

                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Slug (URL identifier)</label>
                  <input 
                    type="text" 
                    value={inlineCatSlug} 
                    onChange={(e) => setInlineCatSlug(e.target.value)}
                    className={styles.figmaInput} 
                    placeholder="e.g. strategy, rpg" 
                    required
                  />
                </div>

                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Category Icon (Image - Optional)</label>
                  <div className={styles.fileInputWrapper}>
                    <input 
                      type="file" 
                      id="inline-cat-icon-input"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => setInlineCatIconFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="inline-cat-icon-input" 
                      className={`${styles.figmaFileLabel} ${inlineCatIconFile ? styles.figmaFileSelected : ''}`}
                    >
                      <Upload size={14} /> <span>{inlineCatIconFile ? inlineCatIconFile.name.substring(0, 20) : 'Choose Icon File'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.gradientSubmitBtn}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Theme Dialog Modal */}
      <CustomDialogModal 
        {...dialogState} 
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* Floating Notification Toast Popup */}
      {toast && (
        <div className={styles.toastContainer}>
          <div className={`${styles.toastItem} ${toast.type === 'warning' ? styles.toastWarning : toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
            <div className={styles.toastIconWrapper}>
              {toast.type === 'warning' && <AlertTriangle size={20} className={styles.toastIconWarning} />}
              {toast.type === 'error' && <AlertCircle size={20} className={styles.toastIconError} />}
              {toast.type === 'success' && <CheckCircle2 size={20} className={styles.toastIconSuccess} />}
            </div>
            <div className={styles.toastContent}>
              <div className={styles.toastTitle}>{toast.title}</div>
              <div className={styles.toastMessage}>{toast.message}</div>
            </div>
            <button
              type="button"
              className={styles.toastCloseBtn}
              onClick={() => setToast(null)}
              title="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
