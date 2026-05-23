import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import { CATEGORIES, SUBCATEGORY_MAP, GOLD_CARATS, DIAMOND_PURITIES } from '../lib/config';
import styles from './ProductModal.module.css';

const EMPTY_FORM = {
  sku_code: '', item_name: '', category: '', sub_category: '',
  carat: '', diamond_purity: '', material: '', occasion: '',
  weight_grams: '', price: '', stock_qty: 1,
  description: '', status: 'In Stock',
};

export default function ProductModal({ product, allProducts, onSave, onClose, checkSKU }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [slotFiles, setSlotFiles]   = useState([null,null,null,null,null]);
  const [existingUrls, setExisting] = useState([null,null,null,null,null]);
  const [skuError, setSkuError] = useState('');
  const [saving, setSaving] = useState(false);
  const [regenAI, setRegenAI] = useState(false);
  const [subcats, setSubcats] = useState([]);
  const fileRefs = useRef([null,null,null,null,null]);
  const isEdit = !!product;

  useEffect(() => {
    if (product) {
      setForm({
        sku_code: product.sku_code || '',
        item_name: product.item_name || '',
        category: product.category || '',
        sub_category: product.sub_category || '',
        carat: product.carat || '',
        diamond_purity: product.diamond_purity || '',
        material: product.material || '',
        occasion: product.occasion || '',
        weight_grams: product.weight_grams || '',
        price: product.price || '',
        stock_qty: product.stock_qty ?? 1,
        description: product.description || '',
        status: product.status || 'In Stock',
      });
      // Populate existing image slots
      const urls = Array.isArray(product.image_urls) ? product.image_urls : [];
      const slots = [null,null,null,null,null];
      const existing = [null,null,null,null,null];
      urls.forEach((u, i) => { if (i < 5) existing[i] = u; });
      setExisting(existing);
      setSlotFiles(slots);
      // Set subcategories
      if (product.category) {
        setSubcats(SUBCATEGORY_MAP[product.category] || []);
      }
    } else {
      setForm(EMPTY_FORM);
      setSlotFiles([null,null,null,null,null]);
      setExisting([null,null,null,null,null]);
    }
    setSkuError('');
    setRegenAI(false);
  }, [product]);

  const set = useCallback((key, val) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  const handleCategory = (cat) => {
    set('category', cat);
    set('sub_category', '');
    setSubcats(SUBCATEGORY_MAP[cat] || []);
  };

  const handleSKUBlur = async (val) => {
    if (!val) return;
    const unique = await checkSKU(val, isEdit ? product.id : null);
    setSkuError(unique ? '' : 'SKU already exists — please use a different one');
  };

  const handleFile = (i, file) => {
    if (!file) return;
    const newFiles = [...slotFiles];
    newFiles[i] = file;
    setSlotFiles(newFiles);
    const newExisting = [...existingUrls];
    newExisting[i] = null; // replaced
    setExisting(newExisting);
  };

  const removeSlot = (i) => {
    const nf = [...slotFiles]; nf[i] = null; setSlotFiles(nf);
    const ne = [...existingUrls]; ne[i] = null; setExisting(ne);
  };

  const handleSubmit = async () => {
    if (!form.sku_code.trim())   return alert('SKU is required');
    if (!form.item_name.trim())  return alert('Item name is required');
    if (!form.category)          return alert('Category is required');
    if (!form.carat)             return alert('Gold carat is required');
    if (!form.weight_grams)      return alert('Weight is required');
    if (!form.price)             return alert('Price is required');
    if (skuError)                return alert('Fix SKU error first');
    setSaving(true);
    try {
      await onSave(
        { ...form, weight_grams: Number(form.weight_grams), price: Number(form.price), stock_qty: Number(form.stock_qty) || 1 },
        slotFiles,
        existingUrls,
        isEdit,
        regenAI
      );
    } catch(err) {
      alert('Save failed: ' + (err.message || 'Unknown'));
    } finally {
      setSaving(false);
    }
  };

  const previewSrc = (i) => {
    if (slotFiles[i]) return URL.createObjectURL(slotFiles[i]);
    return existingUrls[i] || null;
  };

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ animation: 'slideUp .2s ease' }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.body}>
          {/* ① Item Details */}
          <div className="sec-label">① Item Details</div>
          <div className="fg fg2">
            <div className="fld">
              <label className="lbl">SKU / Item Code <span className="req">*</span></label>
              <input
                className="inp"
                value={form.sku_code}
                onChange={e => set('sku_code', e.target.value.toUpperCase())}
                onBlur={e => handleSKUBlur(e.target.value)}
                placeholder="e.g. RNG001"
              />
              {skuError && <div className={styles.fieldError}>{skuError}</div>}
            </div>
            <div className="fld">
              <label className="lbl">Item Name <span className="req">*</span></label>
              <input className="inp" value={form.item_name} onChange={e => set('item_name', e.target.value)} placeholder="e.g. Floral Kundan Ring" />
            </div>
          </div>

          <div className="fg fg3" style={{ marginTop: 14 }}>
            <div className="fld">
              <label className="lbl">Category <span className="req">*</span></label>
              <select className="inp" value={form.category} onChange={e => handleCategory(e.target.value)}>
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="fld">
              <label className="lbl">Sub-category</label>
              <select className="inp" value={form.sub_category} onChange={e => set('sub_category', e.target.value)}>
                <option value="">{subcats.length ? 'Select…' : 'Select category first'}</option>
                {subcats.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="fld">
              <label className="lbl">Gold Carat <span className="req">*</span></label>
              <select className="inp" value={form.carat} onChange={e => set('carat', e.target.value)}>
                <option value="">Select…</option>
                {GOLD_CARATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="fg fg3" style={{ marginTop: 14 }}>
            <div className="fld">
              <label className="lbl">Diamond Purity</label>
              <select className="inp" value={form.diamond_purity} onChange={e => set('diamond_purity', e.target.value)}>
                <option value="">None / N/A</option>
                {DIAMOND_PURITIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="fld">
              <label className="lbl">Stone / Material</label>
              <input className="inp" value={form.material} onChange={e => set('material', e.target.value)} placeholder="e.g. Kundan, Polki, Ruby" />
            </div>
            <div className="fld">
              <label className="lbl">Occasion</label>
              <input className="inp" value={form.occasion} onChange={e => set('occasion', e.target.value)} placeholder="e.g. Wedding, Festival" />
            </div>
          </div>

          <div className="fg fg3" style={{ marginTop: 14 }}>
            <div className="fld">
              <label className="lbl">Weight (grams) <span className="req">*</span></label>
              <input className="inp" type="number" step="0.01" value={form.weight_grams} onChange={e => set('weight_grams', e.target.value)} placeholder="e.g. 5.20" />
            </div>
            <div className="fld">
              <label className="lbl">Price (₹ INR) <span className="req">*</span></label>
              <input className="inp" type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 45000" />
            </div>
            <div className="fld">
              <label className="lbl">Stock Quantity</label>
              <input className="inp" type="number" min="0" value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="fld">
              <label className="lbl">Description / Notes for AI</label>
              <textarea className="inp" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Special details, craftsmanship notes, or context for the AI…" />
            </div>
          </div>

          {/* ② Images */}
          <div className="sec-label" style={{ marginTop: 20 }}>② Product Images (up to 5)</div>
          <div className={styles.imgGrid}>
            {[0,1,2,3,4].map(i => {
              const src = previewSrc(i);
              return (
                <div key={i} className={styles.imgSlot}>
                  {src ? (
                    <>
                      <img src={src} alt="" className={styles.imgPreview} />
                      <button className={styles.imgRemove} onClick={() => removeSlot(i)} title="Remove">
                        <Trash2 size={12} />
                      </button>
                      {i === 0 && <span className={styles.imgPrimary}>Primary</span>}
                    </>
                  ) : (
                    <button className={styles.imgAdd} onClick={() => fileRefs.current[i]?.click()}>
                      <Upload size={16} strokeWidth={1.5} />
                      <span>{i === 0 ? 'Add cover' : 'Add photo'}</span>
                    </button>
                  )}
                  <input
                    ref={el => fileRefs.current[i] = el}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(i, e.target.files?.[0])}
                  />
                </div>
              );
            })}
          </div>
          <p className={styles.imgNote}>
            First image is the primary photo sent to WhatsApp customers. Supported: JPG, PNG, WebP · Max 5 MB each.
          </p>

          {/* Stock toggle */}
          <label className={styles.stockToggle}>
            <input
              type="checkbox"
              checked={form.status === 'In Stock'}
              onChange={e => set('status', e.target.checked ? 'In Stock' : 'Sold Out')}
              style={{ width: 16, height: 16, accentColor: 'var(--navy)' }}
            />
            Mark as currently in stock
          </label>

          {/* Re-gen AI (edit only) */}
          {isEdit && (
            <div className={styles.regenRow}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={regenAI}
                  onChange={e => setRegenAI(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--navy)', marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={13} color="#C9A84C" /> Regenerate AI title &amp; description
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 3 }}>
                    By default, existing AI content is kept. Check this to generate fresh AI content using the updated details.
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-gold" onClick={handleSubmit} disabled={saving || !!skuError}>
            {saving ? (
              <><div className="spinner spinner-sm" /> Saving…</>
            ) : (
              isEdit ? 'Update Product' : 'Add Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
