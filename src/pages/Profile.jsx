import React, { useState } from 'react';
import { Lock, Check, X, Crown, Store, Phone, Mail, MapPin, Wifi, Diamond, ShoppingBag, Users, Cpu, Shirt, BarChart2, Camera } from 'lucide-react';
import { db } from '../lib/config';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import styles from './Profile.module.css';

function FeatureRow({ icon: Icon, label, active, note }) {
  return (
    <div className={`${styles.featureRow} ${!active ? styles.featureRowOff : ''}`}>
      <div className={styles.featureName}>
        <Icon size={14} strokeWidth={1.5} color={active ? '#C9A84C' : 'rgba(13,27,42,.3)'} />
        <span>{label}</span>
        {note && <span className={styles.featureNote}>({note})</span>}
      </div>
      <span className={active ? styles.featureOn : styles.featureOff}>
        {active ? <><Check size={11} /> Active</> : <><X size={11} /> Upgrade</>}
      </span>
    </div>
  );
}

export default function Profile() {
  const { user, store, updateStore } = useAuth();
  const { showToast } = useToast();

  const [storeName, setStoreName] = useState(store?.store_name || '');
  const [phone, setPhone] = useState(store?.phone || '');
  const [address, setAddress] = useState(store?.address || '');
  const [saving, setSaving] = useState(false);

  const ownerName  = store?.owner_name || user?.user_metadata?.full_name || user?.email || 'Owner';
  const plan       = (store?.plan_name || 'trial');
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
  const expiry     = store?.plan_expires_at
    ? new Date(store.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const features = [
    { icon: Wifi,      label: 'WhatsApp AI Chatbot',     active: true },
    { icon: ShoppingBag,label:'Inventory Management',    active: true },
    { icon: Camera,    label: 'Voice Search',            active: !!store?.has_voice_search },
    { icon: Camera,    label: 'Image Search',            active: !!store?.has_image_search },
    { icon: Users,     label: 'Customer Tiers',          active: !!store?.customer_tiers },
    { icon: Cpu,       label: 'Advanced AI Models',      active: !!store?.ai_models },
    { icon: Shirt,     label: 'Virtual Try-On',          active: !!store?.virtual_tryon },
    { icon: BarChart2, label: 'Analytics',               active: store?.analytics && store.analytics !== 'BASIC', note: store?.analytics || 'BASIC' },
    { icon: ShoppingBag,label:`Product Limit: ${store?.product_limit || 500}`, active: true },
    { icon: Phone,     label: `Conversations/month: ${store?.conversation_limit || 50}`, active: true },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await db.from('stores')
        .update({ store_name: storeName, phone, address })
        .eq('owner_id', user.id);
      if (error) throw error;
      updateStore({ store_name: storeName, phone, address });
      showToast('Profile saved!', '#166534');
    } catch(err) {
      showToast('Error: ' + err.message, '#C0392B');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>My Profile & Plan</h2>
          <p className={styles.sub}>Manage your store details and view your plan features</p>
        </div>
      </div>

      <div className={styles.wrap}>
        {/* Plan hero */}
        <div className={styles.planHero}>
          <div>
            <div className={styles.planHeroLabel}>Current Plan</div>
            <div className={styles.planHeroName}>{planDisplay}</div>
            <div className={styles.planHeroSub}>
              Valid until: {expiry} · Status: {store?.subscription_status || 'active'}
            </div>
          </div>
          <div className={styles.planHeroBadge}>
            <Crown size={20} color="#C9A84C" />
            <span>{planDisplay}</span>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Left: Editable */}
          <div>
            <div className={styles.card}>
              <div className={styles.cardTitle}><Store size={16} color="#C9A84C" /> Store Details</div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>Owner Name</div>
                <input className="inp" value={ownerName} readOnly />
                <div className={styles.lockedNote}><Lock size={10} /> Set by admin on account approval</div>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  Store Name <span className={styles.editable}>✎ editable</span>
                </div>
                <input className="inp" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Your jewellery store name" />
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  Phone Number <span className={styles.editable}>✎ editable</span>
                </div>
                <input className="inp" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  Store Address <span className={styles.editable}>✎ editable</span>
                </div>
                <input className="inp" value={address} onChange={e => setAddress(e.target.value)} placeholder="Shop address" />
              </div>

              <button className="btn-gold" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                {saving ? <><div className="spinner spinner-sm" /> Saving…</> : <><Check size={14} /> Save Changes</>}
              </button>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Read-only contact */}
            <div className={styles.card}>
              <div className={styles.cardTitle}><Lock size={14} color="#C9A84C" /> Account & Contact <span style={{ fontSize: 11, color: 'rgba(201,168,76,.5)', fontFamily: 'DM Sans', fontWeight: 400, marginLeft: 8 }}>(managed by admin)</span></div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>Email ID</div>
                <input className="inp" value={store?.email || user?.email || '—'} readOnly />
                <div className={styles.lockedNote}><Lock size={10} /> Contact admin to change</div>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>WhatsApp Business Number</div>
                <input className="inp" value={store?.whatsapp_phone || '—'} readOnly />
                <div className={styles.lockedNote}><Lock size={10} /> Contact admin to change</div>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>Owner WhatsApp (for alerts)</div>
                <input className="inp" value={store?.owner_whatsapp || '—'} readOnly />
                <div className={styles.lockedNote}><Lock size={10} /> Contact admin to change</div>
              </div>
            </div>

            {/* Plan features */}
            <div className={styles.card}>
              <div className={styles.cardTitle}><Diamond size={14} color="#C9A84C" /> Plan Features</div>
              <div className={styles.featureList}>
                {features.map((f, i) => <FeatureRow key={i} {...f} />)}
              </div>
              {plan === 'trial' || plan === 'basic' ? (
                <button
                  className="btn-gold"
                  style={{ marginTop: 16, width: '100%', justifyContent: 'center', fontSize: 12 }}
                  onClick={() => alert('Contact nikimodi81@gmail.com to upgrade your plan')}
                >
                  <Crown size={13} /> Upgrade Plan
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
