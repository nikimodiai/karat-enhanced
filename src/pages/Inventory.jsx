import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, SlidersHorizontal, Plus, Package, TrendingUp, TrendingDown,
  ChevronDown, X, Grid, List, ArrowUpDown, Tag, Gem
} from 'lucide-react';
import { db, CLOUDINARY_CLOUD, CLOUDINARY_PRESET, N8N_UPLOAD_URL, N8N_DELETE_URL, CATEGORIES, SUBCATEGORY_MAP, GOLD_CARATS, DIAMOND_PURITIES } from '../lib/config';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import ProductModal from '../components/ProductModal';
import ProductCard from '../components/ProductCard';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './Inventory.module.css';

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest First' },
  { value: 'oldest',    label: 'Oldest First' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc',label: 'Price: High → Low' },
  { value: 'name-asc',  label: 'Name A → Z' },
  { value: 'name-desc', label: 'Name Z → A' },
  { value: 'weight-asc',label: 'Weight: Light → Heavy' },
];

function matchesSearch(p, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  const fields = [
    p.sku_code, p.item_name, p.category, p.sub_category,
    p.material, p.carat, p.occasion, p.diamond_purity,
    p.ai_description, p.description,
  ];
  return fields.some(f => f && f.toLowerCase().includes(lower));
}

function sortProducts(arr, sort) {
  const copy = [...arr];
  switch (sort) {
    case 'oldest':     return copy.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    case 'price-asc':  return copy.sort((a,b) => (a.price||0) - (b.price||0));
    case 'price-desc': return copy.sort((a,b) => (b.price||0) - (a.price||0));
    case 'name-asc':   return copy.sort((a,b) => (a.item_name||'').localeCompare(b.item_name||''));
    case 'name-desc':  return copy.sort((a,b) => (b.item_name||'').localeCompare(a.item_name||''));
    case 'weight-asc': return copy.sort((a,b) => (a.weight_grams||0) - (b.weight_grams||0));
    default:           return copy.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export default function Inventory() {
  const { user, store } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [stockFilter, setStockFilter] = useState('All'); // All | In Stock | Sold Out
  const [caratFilter, setCaratFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load products
  const loadProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from('products')
      .select('*')
      .eq('is_current', true)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setProducts(data);
      window._products = data;
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtered & sorted products
  const filtered = useMemo(() => {
    let arr = products;
    if (activeCat !== 'All') arr = arr.filter(p => p.category === activeCat);
    if (stockFilter !== 'All') arr = arr.filter(p => p.status === stockFilter);
    if (caratFilter) arr = arr.filter(p => p.carat === caratFilter);
    arr = arr.filter(p => matchesSearch(p, search));
    return sortProducts(arr, sort);
  }, [products, activeCat, stockFilter, caratFilter, search, sort]);

  // Category counts
  const catCounts = useMemo(() => {
    const counts = { All: products.length };
    products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return counts;
  }, [products]);

  const totalIn  = useMemo(() => products.filter(p => p.status === 'In Stock').length, [products]);
  const totalOut = useMemo(() => products.filter(p => p.status === 'Sold Out').length, [products]);

  // Check SKU uniqueness
  const checkSKU = useCallback(async (sku, excludeId) => {
    const { data } = await db.from('products').select('id').eq('sku_code', sku).eq('is_current', true);
    if (!data) return true;
    return excludeId ? data.every(d => d.id === excludeId) : data.length === 0;
  }, []);

  const handleSave = useCallback(async (formData, slotFiles, existingUrls, isEdit, regenAI) => {
    // Upload images to Cloudinary
    const imageUrls = [...existingUrls];
    for (let i = 0; i < 5; i++) {
      if (slotFiles[i]) {
        const fd = new FormData();
        fd.append('file', slotFiles[i]);
        fd.append('upload_preset', CLOUDINARY_PRESET);
        try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
          const json = await res.json();
          imageUrls[i] = json.secure_url || null;
        } catch { imageUrls[i] = null; }
      }
    }

    const payload = {
      ...formData,
      owner_id: user.id,
      image_urls: imageUrls.filter(Boolean),
      is_current: true,
    };

    let result;
    if (isEdit && !regenAI) {
      // Direct update
      const { data, error } = await db.from('products').update(payload).eq('id', editProduct.id).select().single();
      if (error) throw error;
      result = data;
      setProducts(prev => prev.map(p => p.id === result.id ? result : p));
      window._products = products.map(p => p.id === result.id ? result : p);
      showToast('Product updated!', '#166534');
    } else {
      // New or re-gen via n8n
      const n8nPayload = { ...payload };
      if (isEdit) { n8nPayload.old_product_id = editProduct.id; }
      const res = await fetch(N8N_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload),
      });
      if (!res.ok) throw new Error('Upload failed');
      await loadProducts();
      showToast(isEdit ? 'Product updated with fresh AI content!' : 'Product added!', '#166534');
    }
    setModalOpen(false);
    setEditProduct(null);
  }, [user, editProduct, loadProducts, showToast, products]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setConfirmOpen(false);
    try {
      await fetch(N8N_DELETE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: deleteTarget, owner_id: user.id }),
      });
      setProducts(prev => prev.filter(p => p.id !== deleteTarget));
      window._products = (window._products || []).filter(p => p.id !== deleteTarget);
      showToast('Product deleted.', '#C0392B');
    } catch {
      // Fallback: mark as not current
      await db.from('products').update({ is_current: false }).eq('id', deleteTarget);
      setProducts(prev => prev.filter(p => p.id !== deleteTarget));
      showToast('Product deleted.', '#C0392B');
    }
    setDeleteTarget(null);
  }, [deleteTarget, user, showToast]);

  const handleToggleStock = useCallback(async (product) => {
    const newStatus = product.status === 'In Stock' ? 'Sold Out' : 'In Stock';
    const { error } = await db.from('products').update({ status: newStatus }).eq('id', product.id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
      window._products = (window._products || []).map(p => p.id === product.id ? { ...p, status: newStatus } : p);
      showToast(`Marked as ${newStatus}`, newStatus === 'In Stock' ? '#166534' : '#C0392B');
    }
  }, [showToast]);

  const openAdd = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setModalOpen(true); };
  const openDelete = (id) => { setDeleteTarget(id); setConfirmOpen(true); };

  const hasFilters = stockFilter !== 'All' || caratFilter;

  return (
    <div className={styles.page}>
      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(13,27,42,.06)' }}>
            <Package size={18} color="#0D1B2A" strokeWidth={1.5} />
          </div>
          <div>
            <div className={styles.statNum}>{products.length}</div>
            <div className={styles.statLbl}>Total SKUs</div>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(22,101,52,.08)' }}>
            <TrendingUp size={18} color="#16a34a" strokeWidth={1.5} />
          </div>
          <div>
            <div className={styles.statNum} style={{ color: '#16a34a' }}>{totalIn}</div>
            <div className={styles.statLbl}>In Stock</div>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(220,38,38,.07)' }}>
            <TrendingDown size={18} color="#dc2626" strokeWidth={1.5} />
          </div>
          <div>
            <div className={styles.statNum} style={{ color: '#dc2626' }}>{totalOut}</div>
            <div className={styles.statLbl}>Sold Out</div>
          </div>
        </div>
        {store?.product_limit && (
          <div className={styles.stat}>
            <div className={styles.statIconWrap} style={{ background: 'rgba(201,168,76,.1)' }}>
              <Gem size={18} color="#C9A84C" strokeWidth={1.5} />
            </div>
            <div>
              <div className={styles.statNum} style={{ color: '#8B6914' }}>
                {products.length}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(13,27,42,.38)' }}>/{store.product_limit}</span>
              </div>
              <div className={styles.statLbl}>Plan Usage</div>
            </div>
          </div>
        )}
      </div>

      {/* Category chips */}
      <div className={styles.catStrip}>
        <button
          className={`${styles.chip} ${activeCat === 'All' ? styles.chipActive : ''}`}
          onClick={() => setActiveCat('All')}
        >
          All <span className={styles.chipCount}>{catCounts.All || 0}</span>
        </button>
        {CATEGORIES.filter(c => catCounts[c.value]).map(c => (
          <button
            key={c.value}
            className={`${styles.chip} ${activeCat === c.value ? styles.chipActive : ''}`}
            onClick={() => setActiveCat(c.value)}
          >
            {c.label} <span className={styles.chipCount}>{catCounts[c.value] || 0}</span>
          </button>
        ))}
      </div>

      {/* Header with search and controls */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {activeCat === 'All' ? 'All Inventory' : activeCat + 's'}
          </h2>
          <p className={styles.sub}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        <div className={styles.controls}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search SKU, name, gold, diamond, earring…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            className={`${styles.iconBtn} ${(showFilters || hasFilters) ? styles.iconBtnActive : ''}`}
            onClick={() => setShowFilters(p => !p)}
            title="Filters"
          >
            <SlidersHorizontal size={15} />
            {hasFilters && <span className={styles.filterDot} />}
          </button>

          {/* Sort */}
          <div className={styles.sortWrap} ref={sortRef}>
            <button className={styles.iconBtn} onClick={() => setSortOpen(p => !p)} title="Sort">
              <ArrowUpDown size={15} />
            </button>
            {sortOpen && (
              <div className={styles.sortDropdown}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`${styles.sortOpt} ${sort === opt.value ? styles.sortOptActive : ''}`}
                    onClick={() => { setSort(opt.value); setSortOpen(false); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('grid')}>
              <Grid size={14} />
            </button>
            <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('list')}>
              <List size={14} />
            </button>
          </div>

          <button className="btn-gold" onClick={openAdd}>
            <Plus size={15} strokeWidth={2.5} />
            Add Product
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}><Tag size={12} /> Stock Status</span>
            <div className={styles.filterPills}>
              {['All','In Stock','Sold Out'].map(s => (
                <button
                  key={s}
                  className={`${styles.filterPill} ${stockFilter === s ? styles.filterPillActive : ''}`}
                  onClick={() => setStockFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}><Gem size={12} /> Gold Carat</span>
            <div className={styles.filterPills}>
              <button
                className={`${styles.filterPill} ${!caratFilter ? styles.filterPillActive : ''}`}
                onClick={() => setCaratFilter('')}
              >
                Any
              </button>
              {GOLD_CARATS.map(c => (
                <button
                  key={c}
                  className={`${styles.filterPill} ${caratFilter === c ? styles.filterPillActive : ''}`}
                  onClick={() => setCaratFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button
              className={styles.clearFiltersBtn}
              onClick={() => { setStockFilter('All'); setCaratFilter(''); }}
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Product grid/list */}
      <div className={styles.gridArea}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className="spinner" />
            <p>Loading inventory…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={48} strokeWidth={1} color="rgba(13,27,42,.2)" />
            <h3>{search ? 'No results found' : 'No products yet'}</h3>
            <p>{search ? `No items match "${search}"` : 'Click Add Product to get started.'}</p>
            {!search && (
              <button className="btn-gold" style={{ marginTop: 16 }} onClick={openAdd}>
                <Plus size={15} /> Add First Product
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? styles.grid : styles.listGrid}>
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                viewMode={viewMode}
                onEdit={() => openEdit(p)}
                onDelete={() => openDelete(p.id)}
                onToggleStock={() => handleToggleStock(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <ProductModal
          product={editProduct}
          allProducts={products}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditProduct(null); }}
          checkSKU={checkSKU}
        />
      )}
      {confirmOpen && (
        <ConfirmDialog
          message="Delete this product? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
