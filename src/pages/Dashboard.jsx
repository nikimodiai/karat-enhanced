import React, { useMemo } from 'react';
import {
  Package, TrendingUp, TrendingDown, Users, MessageSquare,
  ArrowRight, Gem, Crown, Sparkles, BarChart2, AlertTriangle,
  Activity, ShoppingBag, Star, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import styles from './Dashboard.module.css';

const GOLD_PALETTE = ['#C9A84C','#E8CC7A','#8B6914','#F5E9C5','#d4a843','#a07830'];
const PLAN_LABELS = { trial:'Trial', starter:'Starter', professional:'Professional', enterprise:'Enterprise' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'#fff', border:'1px solid rgba(201,168,76,.2)',
      borderRadius:8, padding:'10px 14px',
      boxShadow:'0 4px 16px rgba(11,24,41,.1)', fontSize:12
    }}>
      {label && <div style={{fontWeight:600,color:'#0B1829',marginBottom:4}}>{label}</div>}
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color||'#C9A84C',fontWeight:500}}>
          {p.name}: {typeof p.value==='number'?p.value.toLocaleString():p.value}
        </div>
      ))}
    </div>
  );
};

function StatCard({ icon: Icon, label, value, sub, color='#C9A84C', bg='rgba(201,168,76,.08)', trend }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{background:bg}}>
        <Icon size={20} color={color} strokeWidth={1.5} />
      </div>
      <div className={styles.statBody}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={styles.statTrend} style={{color: trend >= 0 ? '#15803d' : '#be123c'}}>
          {trend >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { user, store } = useAuth();

  const prods = window._products || [];
  const custs = window._customers || [];

  const name = store?.owner_name || user?.user_metadata?.full_name || 'Owner';
  const plan = (store?.plan_name || 'trial').toLowerCase();
  const planLabel = PLAN_LABELS[plan] || 'Trial';
  const isPro = plan === 'professional' || plan === 'enterprise';

  const inStock = useMemo(() => prods.filter(p => p.status === 'In Stock').length, [prods.length]);
  const soldOut = useMemo(() => prods.filter(p => p.status === 'Sold Out').length, [prods.length]);
  const stockPct = prods.length > 0 ? Math.round(inStock / prods.length * 100) : 0;

  const catData = useMemo(() => {
    const m = {};
    prods.forEach(p => { const c = p.category || 'Other'; m[c] = (m[c]||0)+1; });
    return Object.entries(m)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,6)
      .map(([name,value])=>({name,value}));
  }, [prods.length]);

  const stockPieData = [
    { name:'In Stock', value: inStock },
    { name:'Sold Out', value: soldOut },
  ].filter(d=>d.value>0);

  const convUsed  = store?._conv_used  || 0;
  const convLimit = store?.conversation_limit || 50;
  const convPct   = convLimit ? Math.min(100, Math.round(convUsed/convLimit*100)) : 0;
  const prodLimit = store?.product_limit || 500;
  const prodPct   = prodLimit ? Math.min(100, Math.round(prods.length/prodLimit*100)) : 0;

  const alerts = [];
  if (convPct >= 90) alerts.push({ type:'warn', msg:`WhatsApp conversations at ${convPct}% of monthly limit` });
  if (prodPct >= 90) alerts.push({ type:'warn', msg:`Product count at ${prodPct}% of plan limit` });
  if (soldOut > inStock) alerts.push({ type:'info', msg:`${soldOut} items out of stock — consider restocking` });
  if (store?.plan_expires_at) {
    const daysLeft = Math.ceil((new Date(store.plan_expires_at)-Date.now())/(86400000));
    if (daysLeft <= 7 && daysLeft >= 0) alerts.push({ type:'warn', msg:`Plan expires in ${daysLeft} day${daysLeft!==1?'s':''}` });
  }

  // Mock monthly trend data (replace with real data once schema provides it)
  const trendData = [
    {month:'Jan',conversations:0,products:prods.length>5?prods.length-5:0},
    {month:'Feb',conversations:0,products:prods.length>4?prods.length-4:0},
    {month:'Mar',conversations:0,products:prods.length>3?prods.length-3:0},
    {month:'Apr',conversations:0,products:prods.length>2?prods.length-2:0},
    {month:'May',conversations:convUsed,products:prods.length},
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroGreet}>{greeting()},</div>
          <h1 className={styles.heroName}>{name.split(' ')[0]}</h1>
          <p className={styles.heroSub}>
            {store?.store_name ? `Welcome back to ${store.store_name}` : 'Welcome back to your jewellery dashboard'}
          </p>
          <div className={styles.heroBadge}>
            <Crown size={12} />
            <span>{planLabel} Plan</span>
          </div>
        </div>
        <div className={styles.heroOrb} aria-hidden>
          <svg viewBox="0 0 120 120" width="120" height="120" fill="none" opacity=".18">
            <polygon points="60,6 114,36 114,84 60,114 6,84 6,36" stroke="#C9A84C" strokeWidth="1.5"/>
            <polygon points="60,20 98,42 98,78 60,100 22,78 22,42" stroke="#C9A84C" strokeWidth="1"/>
            <circle cx="60" cy="60" r="14" stroke="#C9A84C" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      <div className={styles.body}>
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className={styles.alerts}>
            {alerts.map((a,i) => (
              <div key={i} className={`${styles.alertItem} ${a.type==='warn'?styles.alertWarn:styles.alertInfo}`}>
                <AlertTriangle size={14} />
                <span>{a.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* KPI cards */}
        <div className={styles.kpiGrid}>
          <StatCard icon={Package}     label="Total SKUs"      value={prods.length}  sub={`${prodPct}% of plan limit`} color="#C9A84C" bg="rgba(201,168,76,.09)" />
          <StatCard icon={CheckCircle} label="In Stock"        value={inStock}       sub={`${stockPct}% availability`} color="#15803d" bg="rgba(21,128,61,.09)" />
          <StatCard icon={ShoppingBag} label="Sold Out"        value={soldOut}       sub="items need restock"          color="#be123c" bg="rgba(190,18,60,.08)" />
          <StatCard icon={MessageSquare} label="Conversations" value={convUsed}      sub={`of ${convLimit === 'unlimited' ? '∞' : convLimit} this month`} color="#17305A" bg="rgba(23,48,90,.09)" />
          {isPro && <StatCard icon={Users} label="Customers"   value={custs.length}  sub="total registered"            color="#7c3aed" bg="rgba(124,58,237,.09)" />}
        </div>

        {/* Charts row */}
        <div className={styles.chartsRow}>
          {/* Category bar chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>Inventory by Category</div>
              <button className={styles.chartLink} onClick={() => onNavigate('inventory')}>
                View all <ArrowRight size={12}/>
              </button>
            </div>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} barSize={26} margin={{top:4,right:8,left:-24,bottom:0}}>
                  <XAxis dataKey="name" tick={{fontSize:11,fontFamily:'DM Sans',fill:'rgba(11,24,41,.5)'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:10,fontFamily:'DM Sans',fill:'rgba(11,24,41,.4)'}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip/>} cursor={{fill:'rgba(201,168,76,.06)'}} />
                  <Bar dataKey="value" name="Items" radius={[5,5,0,0]}>
                    {catData.map((_, i) => (
                      <Cell key={i} fill={GOLD_PALETTE[i % GOLD_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>
                <Package size={32} strokeWidth={1} color="rgba(11,24,41,.18)"/>
                <span>Add products to see category breakdown</span>
              </div>
            )}
          </div>

          {/* Stock pie */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>Stock Status</div>
            </div>
            {stockPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={stockPieData} cx="50%" cy="50%" innerRadius={52} outerRadius={76}
                      paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                      <Cell fill="#22c55e"/>
                      <Cell fill="#ef4444"/>
                    </Pie>
                    <Tooltip content={<CustomTooltip/>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.pieLegend}>
                  <span className={styles.pieDot} style={{background:'#22c55e'}}/>
                  <span>In Stock ({inStock})</span>
                  <span className={styles.pieDot} style={{background:'#ef4444', marginLeft:12}}/>
                  <span>Sold Out ({soldOut})</span>
                </div>
              </>
            ) : (
              <div className={styles.emptyChart}>
                <Gem size={32} strokeWidth={1} color="rgba(11,24,41,.18)"/>
                <span>No inventory data yet</span>
              </div>
            )}
          </div>

          {/* Usage gauges */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>Plan Usage</div>
              <button className={styles.chartLink} onClick={() => onNavigate('analytics')}>
                Details <ArrowRight size={12}/>
              </button>
            </div>
            <div className={styles.gaugeList}>
              <GaugeBar label="Products" used={prods.length} limit={prodLimit} color="#C9A84C"/>
              <GaugeBar label="Conversations" used={convUsed} limit={convLimit} color="#17305A"/>
              {isPro && store?.ai_models && <GaugeBar label="AI Calls" used={store._ai_used||0} limit={store.ai_models} color="#7c3aed"/>}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className={styles.bottomRow}>
          {/* Recent products */}
          <div className={styles.listCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>Recent Products</div>
              <button className={styles.chartLink} onClick={() => onNavigate('inventory')}>
                All inventory <ArrowRight size={12}/>
              </button>
            </div>
            {prods.length === 0 ? (
              <div className={styles.emptyChart}>
                <Package size={28} strokeWidth={1} color="rgba(11,24,41,.18)"/>
                <span>No products added yet</span>
              </div>
            ) : (
              <div className={styles.productList}>
                {prods.slice(0,5).map(p => (
                  <div key={p.id} className={styles.productRow}>
                    <div className={styles.productThumb}>
                      {p.image_urls?.[0]
                        ? <img src={p.image_urls[0]} alt={p.item_name} />
                        : <Gem size={16} color="rgba(201,168,76,.5)" />
                      }
                    </div>
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{p.item_name || 'Unnamed'}</div>
                      <div className={styles.productMeta}>{p.sku_code} · {p.category}</div>
                    </div>
                    <div className={`${styles.productStatus} ${p.status==='In Stock'?styles.inStock:styles.soldOut}`}>
                      {p.status === 'In Stock' ? 'In Stock' : 'Sold Out'}
                    </div>
                    {p.price && <div className={styles.productPrice}>₹{Number(p.price).toLocaleString('en-IN')}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className={styles.listCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>Quick Actions</div>
            </div>
            <div className={styles.quickActions}>
              <QuickAction icon={Package}    label="Add New Product"  sub="Upload SKU to inventory"  onClick={()=>onNavigate('inventory')} gold />
              <QuickAction icon={Users}      label="Manage Customers" sub="View & edit customer list" onClick={()=>onNavigate('customers')} />
              <QuickAction icon={BarChart2}  label="View Analytics"   sub="Charts & usage insights"  onClick={()=>onNavigate('analytics')} />
              <QuickAction icon={Star}       label="Profile & Plan"   sub="Manage store settings"    onClick={()=>onNavigate('profile')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GaugeBar({ label, used, limit, color }) {
  const isUnlimited = !limit || limit === 'unlimited';
  const pct = isUnlimited ? 0 : Math.min(100, Math.round(used/limit*100));
  const fill = pct>=90?'#ef4444':pct>=70?'#f59e0b':color;
  return (
    <div className={styles.gaugeBar}>
      <div className={styles.gaugeTop}>
        <span className={styles.gaugeLabel}>{label}</span>
        <span className={styles.gaugeNums}>{used}{!isUnlimited&&<>/{limit}</>}</span>
      </div>
      {!isUnlimited && (
        <div className={styles.gaugeTrack}>
          <div className={styles.gaugeFill} style={{width:`${pct}%`, background:fill}}/>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, label, sub, onClick, gold }) {
  return (
    <button className={`${styles.quickBtn} ${gold ? styles.quickBtnGold : ''}`} onClick={onClick}>
      <div className={styles.quickIcon}>
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div>
        <div className={styles.quickLabel}>{label}</div>
        <div className={styles.quickSub}>{sub}</div>
      </div>
      <ArrowRight size={14} className={styles.quickArrow} />
    </button>
  );
}
