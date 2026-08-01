'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Pencil, Trash2, X, PlusCircle, MinusCircle, Search, ShieldAlert, Upload, Gamepad2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';
import styles from '../app/admin/page.module.css';
import DragAndDropUpload from './DragAndDropUpload';
import CustomDialogModal, { DialogState } from './CustomDialogModal';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  games_count: number;
}

interface Game {
  id: string;
  title: string;
  slug: string;
  category: string;
}

export default function AdminCategoriesManager() {
  const { token, globalSearchQuery, setGlobalSearchQuery } = useAdminStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals visibility
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isManageGamesOpen, setIsManageGamesOpen] = useState(false);
  
  // Reassign Category & Move Game Modals states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [targetCategoryIdForDelete, setTargetCategoryIdForDelete] = useState('');

  const [gameToMove, setGameToMove] = useState<Game | null>(null);
  const [targetCategoryForMoveGame, setTargetCategoryForMoveGame] = useState('');
  
  // Selected / Active Category
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form Fields
  const [nameField, setNameField] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [editIconFile, setEditIconFile] = useState<File | null>(null);
  const [slugField, setSlugField] = useState('');
  
  // Manage Games states
  const [searchQuery, setSearchQuery] = useState('');
  const [manageGamesList, setManageGamesList] = useState<Game[]>([]);
  const [selectedGamesToAdd, setSelectedGamesToAdd] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Toast State
  const [toast, setToast] = useState<{ id: number; type: 'warning' | 'error' | 'success' | 'info'; title: string; message: string } | null>(null);

  const showToast = (message: string, type: 'warning' | 'error' | 'success' | 'info' = 'info', title?: string) => {
    const toastTitle = title || (type === 'warning' ? 'Notice' : type === 'error' ? 'Action Failed' : type === 'success' ? 'Success' : 'Notification');
    setToast({ id: Date.now(), type, title: toastTitle, message });
  };
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Custom theme dialog modal state
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false
  });

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedCategories = (Array.isArray(categories) ? [...categories] : []).sort((a, b) => {
    let aVal: any = a[sortField as keyof Category];
    let bVal: any = b[sortField as keyof Category];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredCategories = sortedCategories.filter(cat => 
    cat.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const itemsPerPage = 10;
  const totalItems = filteredCategories.length;
  const totalPages = paginationEnabled ? Math.ceil(totalItems / itemsPerPage) : 1;
  const paginatedCategories = paginationEnabled
    ? filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredCategories;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch Categories
      const catRes = await fetch(`${backendUrl}/api/categories?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!catRes.ok) throw new Error('Failed to fetch categories');
      const catData = await catRes.json();
      setCategories(Array.isArray(catData) ? catData : (Array.isArray(catData?.categories) ? catData.categories : []));

      // Fetch All Games for assignment
      const gamesRes = await fetch(`${backendUrl}/api/games?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setAllGames(Array.isArray(gamesData) ? gamesData : (Array.isArray(gamesData?.games) ? gamesData.games : []));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete slug based on name
  const handleNameChange = (val: string) => {
    setNameField(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSlugField(autoSlug);
  };

  // Add Category Handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameField.trim()) return;

    const formData = new FormData();
    formData.append('name', nameField.trim());
    formData.append('slug', slugField.trim());
    if (iconFile) {
      formData.append('icon', iconFile);
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
        setIsAddOpen(false);
        setNameField('');
        setSlugField('');
        setIconFile(null);
        fetchData();
        showToast('Category created successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create category', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setNameField(cat.name);
    setSlugField(cat.slug);
    setEditIconFile(null);
    setIsEditOpen(true);
  };

  // Edit Category Handler
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !nameField.trim()) return;

    const formData = new FormData();
    formData.append('name', nameField.trim());
    formData.append('slug', slugField.trim());
    if (editIconFile) {
      formData.append('icon', editIconFile);
    }

    try {
      const res = await fetch(`${backendUrl}/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setIsEditOpen(false);
        setSelectedCategory(null);
        setNameField('');
        setSlugField('');
        setEditIconFile(null);
        fetchData();
        showToast('Category updated successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update category', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    const otherCategories = categories.filter(c => c.id !== id);

    // If this category has games AND no other category exists to receive them
    if (otherCategories.length === 0 && cat.games_count > 0) {
      showAlertDialog(
        'Cannot Delete Category',
        'This is the only category in the system and contains games. Games must always belong to a category. Please create another category first before deleting this one.',
        'danger'
      );
      return;
    }

    // If 0 games, delete directly with standard confirm
    if (cat.games_count === 0) {
      showConfirmDialog(
        'Delete Category',
        `Are you sure you want to delete category "${cat.name}"?`,
        async () => {
          try {
            const res = await fetch(`${backendUrl}/api/categories/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (res.ok) {
              showAlertDialog('Category Deleted', 'Category has been deleted successfully.', 'success');
              fetchData();
            } else {
              const err = await res.json();
              showAlertDialog('Delete Failed', err.error || 'Failed to delete category', 'danger');
            }
          } catch (err) {
            console.error(err);
            showAlertDialog('Connection Error', 'Network error while deleting category.', 'danger');
          }
        },
        'danger',
        'Delete Category',
        'Cancel'
      );
      return;
    }

    // If category has games and other categories exist, open Reassign Modal
    setCategoryToDelete(cat);
    setTargetCategoryIdForDelete(otherCategories[0]?.id || '');
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Category with Game Reassignment
  const confirmDeleteCategoryWithReassign = async () => {
    if (!categoryToDelete || !targetCategoryIdForDelete) return;

    try {
      const res = await fetch(`${backendUrl}/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetCategoryId: targetCategoryIdForDelete
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
        showAlertDialog('Category Deleted', data.message || 'Category deleted and games reassigned successfully.', 'success');
        fetchData();
      } else {
        const err = await res.json();
        showAlertDialog('Delete Failed', err.error || 'Failed to delete category', 'danger');
      }
    } catch (err) {
      console.error(err);
      showAlertDialog('Connection Error', 'Network error while deleting category.', 'danger');
    }
  };

  // Open Manage Games view
  const handleOpenManageGames = (cat: Category) => {
    setSelectedCategory(cat);
    // Find games currently in this category (case insensitive matching)
    const currentGames = allGames.filter(g => g.category.toLowerCase() === cat.name.toLowerCase());
    setManageGamesList(currentGames);
    setSelectedGamesToAdd([]);
    setSearchQuery('');
    setIsManageGamesOpen(true);
  };

  // Refresh manage games list
  const refreshManageGamesList = (catName: string, gamesList: Game[]) => {
    const currentGames = gamesList.filter(g => g.category.toLowerCase() === catName.toLowerCase());
    setManageGamesList(currentGames);
  };

  // Add selected games to category
  const handleAddGamesToCategory = async () => {
    if (!selectedCategory || selectedGamesToAdd.length === 0) return;

    try {
      const res = await fetch(`${backendUrl}/api/categories/${selectedCategory.id}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameIds: selectedGamesToAdd
        })
      });

      if (res.ok) {
        // Refetch games and update local states
        const gamesRes = await fetch(`${backendUrl}/api/games`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (gamesRes.ok) {
          const updatedGames = await gamesRes.json();
          setAllGames(updatedGames);
          refreshManageGamesList(selectedCategory.name, updatedGames);
        }
        setSelectedGamesToAdd([]);
        fetchData(); // Sync category counts
        showToast('Games added to category successfully!', 'success');
      } else {
        showToast('Failed to add games to category', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Initiate single game removal/move from category
  const handleInitiateRemoveGame = (game: Game) => {
    const otherCats = categories.filter(c => c.id !== selectedCategory?.id);
    if (otherCats.length === 0) {
      showAlertDialog(
        'Cannot Move Game',
        'This game must belong to a category, and no other categories exist in the system to move it to.',
        'danger'
      );
      return;
    }
    setGameToMove(game);
    setTargetCategoryForMoveGame(otherCats[0].id);
  };

  // Confirm single game move to another category
  const handleConfirmMoveGame = async () => {
    if (!selectedCategory || !gameToMove || !targetCategoryForMoveGame) return;

    try {
      const res = await fetch(`${backendUrl}/api/categories/${selectedCategory.id}/games`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameIds: [gameToMove.id],
          targetCategoryId: targetCategoryForMoveGame
        })
      });

      if (res.ok) {
        const data = await res.json();
        const gamesRes = await fetch(`${backendUrl}/api/games`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (gamesRes.ok) {
          const updatedGames = await gamesRes.json();
          setAllGames(updatedGames);
          refreshManageGamesList(selectedCategory.name, updatedGames);
        }
        fetchData(); // Sync category counts
        setGameToMove(null);
        showToast(data.message || 'Game moved to new category successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to move game', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter games available to add
  const availableGamesToAdd = (Array.isArray(allGames) ? allGames : []).filter(g => {
    // Game should NOT be in the current category
    const catName = selectedCategory?.name || '';
    const gameCat = g.category || '';
    const notInCat = gameCat.toLowerCase() !== catName.toLowerCase();
    // Match search query
    const matchesSearch = (g.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          gameCat.toLowerCase().includes(searchQuery.toLowerCase());
    return notInCat && matchesSearch;
  });

  const toggleSelectGameToAdd = (id: string) => {
    setSelectedGamesToAdd(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading && categories.length === 0) {
    return (
      <div className={styles.loadingContainer} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header Row */}
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>Category Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Create, edit, and assign H5 games to portal categories.
          </p>
        </div>
        

      </div>

      {error && (
        <div className={styles.errorAlert} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: 'var(--border-radius-md)', color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Categories Table View */}
      <div className={styles.tableCard}>
        {/* Table Panel Header */}
        <div className={styles.tableHeaderRow}>
          <h3 className={styles.chartTitle} style={{ border: 'none', padding: 0, margin: 0 }}>Categories Library</h3>
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
                placeholder="Search category name..." 
                className={styles.tableSearchInput}
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className={styles.addGameBtn} 
              onClick={() => {
                setNameField('');
                setSlugField('');
                setIconFile(null);
                setIsAddOpen(true);
              }}
            >
              <Plus size={16} /> <span>Add Category</span>
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '120px', paddingLeft: '34px' }}>Icon</th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Category Name</span>
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('slug')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Slug</span>
                    {sortField === 'slug' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                <th style={{ width: '150px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('games_count')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Total Games</span>
                    {sortField === 'games_count' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                <th style={{ width: '250px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    {globalSearchQuery ? 'No categories matching search query.' : 'No categories found. Click "Add Category" to create one.'}
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat, index) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, minWidth: '20px', textAlign: 'center', display: 'inline-block' }}>
                          {paginationEnabled ? (currentPage - 1) * itemsPerPage + index + 1 : index + 1}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: 'var(--adm-input-bg, rgba(255,255,255,0.03))', border: '1px solid var(--adm-border, rgba(255,255,255,0.05))', flexShrink: 0 }}>
                        <img 
                          src={cat.icon} 
                          alt="" 
                          style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                          onError={(e) => { e.currentTarget.src = '/arcade.svg'; }} 
                        />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--adm-text-primary, #ffffff)' }}>{cat.name}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.85rem' }}>{cat.slug}</span>
                    </td>
                    <td>
                      <span className={styles.badge} style={{ background: 'var(--adm-accent-light, rgba(20, 184, 166, 0.1))', color: 'var(--adm-accent, #14b8a6)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.2))', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        {cat.games_count} {cat.games_count === 1 ? 'game' : 'games'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className={styles.actionBtn} 
                          onClick={() => handleOpenManageGames(cat)}
                          title="Manage Games"
                          style={{ padding: '0.4rem' }}
                        >
                          <Gamepad2 size={14} />
                        </button>
                        
                        <button 
                          className={styles.actionBtn} 
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                          style={{ padding: '0.4rem' }}
                        >
                          <Pencil size={14} />
                        </button>
                        
                        <button 
                          className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                          onClick={() => handleDeleteCategory(cat.id)}
                          title="Delete Category"
                          style={{ padding: '0.4rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  className={`${styles.paginationBtn} ${currentPage === pg ? styles.paginationBtnActive : ''}`}
                  onClick={() => setCurrentPage(pg)}
                >
                  {pg}
                </button>
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

      {/* Add Category Modal */}
      {isAddOpen && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '450px' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Create New Category</h3>
                <p className={styles.modalSubtitle}>Create a new category to group your HTML5 games.</p>
              </div>
              <button 
                className={styles.modalCloseBtn} 
                onClick={() => setIsAddOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddCategory} className={styles.form}>
              <div className={styles.figmaFormGrid}>
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Category Name</label>
                  <input 
                    type="text" 
                    value={nameField} 
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={styles.figmaInput} 
                    placeholder="e.g. Action, Racing, Strategy" 
                    required
                  />
                </div>

                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Slug (URL identifier)</label>
                  <input 
                    type="text" 
                    value={slugField} 
                    onChange={(e) => setSlugField(e.target.value)}
                    className={styles.figmaInput} 
                    placeholder="e.g. action, racing, strategy" 
                    required
                  />
                </div>

                <div className={styles.figmaFormGroupFull}>
                  <DragAndDropUpload
                    id="add-cat-icon-input"
                    accept="image/*"
                    label="Category Icon (Image - Optional)"
                    sublabel="Upload 1:1 SVG or PNG icon"
                    selectedFile={iconFile}
                    onFileSelect={setIconFile}
                  />
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

      {/* Edit Category Modal */}
      {isEditOpen && selectedCategory && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '450px' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Edit Category details</h3>
                <p className={styles.modalSubtitle}>Modify details of this category.</p>
              </div>
              <button 
                className={styles.modalCloseBtn} 
                onClick={() => setIsEditOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditCategory} className={styles.form}>
              <div className={styles.figmaFormGrid}>
                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Category Name</label>
                  <input 
                    type="text" 
                    value={nameField} 
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={styles.figmaInput} 
                    required
                  />
                </div>

                <div className={styles.figmaFormGroupFull}>
                  <label className={styles.figmaLabel}>Slug (URL identifier)</label>
                  <input 
                    type="text" 
                    value={slugField} 
                    onChange={(e) => setSlugField(e.target.value)}
                    className={styles.figmaInput} 
                    required
                  />
                </div>

                <div className={styles.figmaFormGroupFull}>
                  <DragAndDropUpload
                    id="edit-cat-icon-input"
                    accept="image/*"
                    label="Category Icon (Image - Optional)"
                    sublabel="Replace icon file"
                    selectedFile={editIconFile}
                    currentPreviewUrl={selectedCategory?.icon}
                    onFileSelect={setEditIconFile}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.gradientSubmitBtn}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Games in Category Modal */}
      {isManageGamesOpen && selectedCategory && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '800px' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Manage Games: {selectedCategory.name}</h3>
                <p className={styles.modalSubtitle}>Add games from other categories, or remove games from this category.</p>
              </div>
              <button 
                className={styles.modalCloseBtn} 
                onClick={() => setIsManageGamesOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: '55vh', overflow: 'hidden', marginTop: '10px' }}>
              {/* Left Side: Games Currently in Category */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--adm-text-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Current Games ({manageGamesList.length})
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', background: 'var(--adm-input-bg)', border: '1px solid var(--adm-border)', borderRadius: '8px', padding: '0.5rem' }}>
                  {manageGamesList.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--adm-text-muted)', fontSize: '0.85rem' }}>
                      No games currently in this category.
                    </div>
                  ) : (
                    manageGamesList.map(game => (
                      <div key={game.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--adm-border)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--adm-text-primary)', fontWeight: 600 }}>{game.title}</span>
                        <button 
                          onClick={() => handleInitiateRemoveGame(game)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--adm-red-text, #ef4444)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}
                          title="Move Game to Another Category"
                        >
                          <MinusCircle size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Side: Add Games from other categories */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--adm-text-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Add Games from Other Categories
                </h3>
                
                {/* Search bar */}
                <div className={styles.searchBar} style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-text-secondary)' }} />
                  <input 
                    type="text" 
                    placeholder="Search available games..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 2.25rem', background: 'var(--adm-input-bg)', border: '1px solid var(--adm-border)', borderRadius: '8px', color: 'var(--adm-text-primary)', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', background: 'var(--adm-input-bg)', border: '1px solid var(--adm-border)', borderRadius: '8px', padding: '0.5rem', marginBottom: '0.75rem' }}>
                  {availableGamesToAdd.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--adm-text-muted)', fontSize: '0.85rem' }}>
                      No available games to add.
                    </div>
                  ) : (
                    availableGamesToAdd.map(game => (
                      <div 
                        key={game.id} 
                        onClick={() => toggleSelectGameToAdd(game.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: selectedGamesToAdd.includes(game.id) ? 'rgba(20, 184, 166,0.1)' : 'transparent' }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedGamesToAdd.includes(game.id)}
                          onChange={() => {}} // Controlled click via parent div
                          style={{ pointerEvents: 'none' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{game.title}</span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Current: {game.category}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button 
                  onClick={handleAddGamesToCategory}
                  disabled={selectedGamesToAdd.length === 0}
                  className={selectedGamesToAdd.length === 0 ? '' : styles.gradientSubmitBtn}
                  style={{ 
                    width: '100%', 
                    border: 'none', 
                    padding: '10px 24px', 
                    borderRadius: '8px', 
                    fontWeight: 600, 
                    cursor: selectedGamesToAdd.length === 0 ? 'not-allowed' : 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.3rem',
                    background: selectedGamesToAdd.length === 0 ? 'rgba(255,255,255,0.05)' : undefined,
                    color: selectedGamesToAdd.length === 0 ? '#94a3b8' : '#fff'
                  }}
                >
                  <PlusCircle size={16} />
                  <span>Add Selected Games ({selectedGamesToAdd.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Games & Delete Category Modal */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '480px' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={22} style={{ color: '#ef4444' }} />
                <h3 className={styles.modalTitle}>Reassign Games & Delete</h3>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px 0', fontSize: '0.92rem', color: 'var(--adm-text-primary, #ffffff)', lineHeight: '1.5' }}>
              <p style={{ marginBottom: '12px' }}>
                Category <strong>"{categoryToDelete.name}"</strong> currently contains <strong>{categoryToDelete.games_count}</strong> game(s).
              </p>
              <p style={{ marginBottom: '16px', color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.85rem' }}>
                Games must always be assigned to a category. Select a target category to move all affected games to before deleting:
              </p>
              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '8px', color: 'var(--adm-text-primary)' }}>Target Category *</label>
                <select
                  className={styles.inputField}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--adm-input-bg, #161b22)', border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.12))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.9rem', outline: 'none' }}
                  value={targetCategoryIdForDelete}
                  onChange={(e) => setTargetCategoryIdForDelete(e.target.value)}
                >
                  {categories
                    .filter(c => c.id !== categoryToDelete.id)
                    .map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#161b22', color: '#ffffff' }}>
                        {c.name} ({c.games_count} games)
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--adm-border, rgba(255,255,255,0.1))', background: 'transparent', color: 'var(--adm-text-secondary, #94a3b8)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                style={{ background: '#ef4444', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                onClick={confirmDeleteCategoryWithReassign}
              >
                Reassign & Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Single Game to Another Category Modal */}
      {gameToMove && selectedCategory && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '440px' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Gamepad2 size={20} style={{ color: '#14b8a6' }} />
                <h3 className={styles.modalTitle}>Move Game Category</h3>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setGameToMove(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px 0', fontSize: '0.9rem', color: 'var(--adm-text-primary, #ffffff)' }}>
              <p style={{ marginBottom: '12px' }}>
                Move <strong>"{gameToMove.title}"</strong> from category <strong>"{selectedCategory.name}"</strong> to:
              </p>
              <div className={styles.inputGroup}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Destination Category *</label>
                <select
                  className={styles.inputField}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--adm-input-bg, #161b22)', border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.12))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.9rem', outline: 'none' }}
                  value={targetCategoryForMoveGame}
                  onChange={(e) => setTargetCategoryForMoveGame(e.target.value)}
                >
                  {categories
                    .filter(c => c.id !== selectedCategory.id)
                    .map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#161b22', color: '#ffffff' }}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => setGameToMove(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--adm-border, rgba(255,255,255,0.1))', background: 'transparent', color: 'var(--adm-text-secondary, #94a3b8)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.gradientSubmitBtn}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                onClick={handleConfirmMoveGame}
              >
                Move Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Theme Dialog Modal */}
      <CustomDialogModal 
        {...dialogState} 
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
}
