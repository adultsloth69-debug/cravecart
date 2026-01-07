import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { 
  ShoppingBag, MapPin, Search, Star, Clock, Plus, Minus, User, 
  CheckCircle, Utensils, ArrowLeft, X, CreditCard, Bike, 
  Package, Home, Navigation, DollarSign, Activity, BarChart3,
  Briefcase, ChevronRight, LogOut, ShieldCheck, Globe, Menu,
  ChefHat, Smartphone, TrendingUp, Users, Lock, Key, Phone, MessageSquare, QrCode, Banknote, Mail
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, updateProfile, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, 
  orderBy, doc, updateDoc, serverTimestamp, where, getDocs, deleteDoc 
} from 'firebase/firestore';

// --- 1. FIREBASE CONFIGURATION ---
let app, auth, db;
let initError = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

try {
    if (!firebaseConfig.apiKey) throw new Error("Missing Config");
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    initError = e.message;
}

// --- 2. CSS STYLES (BLUE THEME) ---
const cssStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { background-color: #f0f4f8; color: #333; padding-bottom: 80px; }
  
  .container { max-width: 1000px; margin: 0 auto; padding: 16px; }
  .text-center { text-align: center; }
  .flex { display: flex; align-items: center; }
  .flex-between { display: flex; justify-content: space-between; align-items: center; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  
  /* --- BLUE COLORS HERE --- */
  .text-primary { color: #2563eb; } /* Blue */
  .text-green { color: #2e7d32; }
  .text-gray { color: #666; font-size: 0.9rem; }
  .font-bold { font-weight: 700; }
  
  .btn { padding: 12px 20px; border-radius: 12px; border: none; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; justify-content: center; width: 100%; transition: 0.2s; font-size: 1rem; }
  .btn:active { transform: scale(0.98); }
  
  .btn-primary { background: #2563eb; color: white; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3); } /* Blue Button */
  .btn-google { background: #fff; color: #333; border: 1px solid #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 16px; }
  .btn-secondary { background: #fff; border: 1px solid #ddd; color: #333; }
  .btn-danger { color: #d32f2f; background: transparent; }
  .btn-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 0; }
  
  .input { width: 100%; padding: 14px; border: 1px solid #ddd; border-radius: 12px; font-size: 1rem; outline: none; margin-bottom: 12px; background: #fff; }
  .input:focus { border-color: #2563eb; ring: 2px solid #bfdbfe; }
  
  .card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 16px; border: 1px solid #eee; }
  .card-img { width: 100%; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 12px; }
  
  .header { position: sticky; top: 0; background: white; padding: 16px; box-shadow: 0 1px 5px rgba(0,0,0,0.05); z-index: 100; }
  .logo { font-size: 1.5rem; font-weight: 800; color: #1e3a8a; display: flex; align-items: center; gap: 8px; }
  
  .badge { padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-green { background: #e8f5e9; color: #2e7d32; }
  
  .portal-card { cursor: pointer; transition: 0.2s; text-align: left; }
  .portal-card:hover { border-color: #2563eb; transform: translateY(-2px); }
  
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { background: white; width: 100%; max-width: 400px; border-radius: 24px; padding: 24px; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
  
  @media (min-width: 768px) {
    .grid { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  }
`;

// --- STATIC DATA ---
const MOCK_RESTAURANTS = [
  { id: 1, name: "Burger King", cuisine: "American • Burgers", rating: 4.2, time: "25-30 min", price: "₹200 for one", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80", menu: [{ id: 101, name: "Whopper Meal", price: 349, desc: "Burger, fries, drink.", isVeg: false }] },
  { id: 2, name: "Pizza Hut", cuisine: "Italian • Pizza", rating: 4.5, time: "35-40 min", price: "₹300 for one", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80", menu: [{ id: 201, name: "Pepperoni Feast", price: 499, desc: "Double pepperoni pizza.", isVeg: false }] }
];

// --- APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeApp, setActiveApp] = useState('landing'); 
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initError) { setLoading(false); return; }
    const initAuth = async () => {
        // No anonymous login for users, wait for Google
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => { 
      setCart([]); 
      await signOut(auth);
      setActiveApp('landing'); 
  }, []);
  
  const goBackToHome = useCallback(() => { setActiveApp('landing'); }, []);
  const cartCount = useMemo(() => cart.reduce((a,b)=>a+b.qty,0), [cart]);

  if (initError) return <div className="container" style={{color:'red'}}><h1>Error</h1><p>{initError}</p></div>;
  if (loading) return <div className="container text-center" style={{marginTop: 100}}>Loading Platform...</div>;

  return (
    <>
      <Head><style>{cssStyles}</style></Head>
      
      {activeApp === 'landing' ? (
          <LandingPage setApp={setActiveApp} />
      ) : (
          <div>
              <PortalHeader activeApp={activeApp} user={user} onLogout={handleLogout} cartCount={cartCount} />
              <main className="container">
                  {activeApp === 'customer' && <CustomerPortal user={user} cart={cart} setCart={setCart} onBack={goBackToHome} />}
                  {activeApp === 'restaurant' && <RestaurantPortal user={user} onBack={goBackToHome} />}
                  {activeApp === 'driver' && <DriverPortal user={user} onBack={goBackToHome} />}
                  {activeApp === 'admin' && <AdminPortal user={user} onBack={goBackToHome} />}
              </main>
          </div>
      )}
    </>
  );
}

// --- COMPONENTS ---

function LandingPage({ setApp }) {
    return (
        <div style={{ background: 'white', minHeight: '100vh' }}>
            <div className="header flex-between">
                <div className="logo"><Utensils color="#2563eb"/> CraveCart <span style={{fontSize:'0.8rem', color:'#ccc', marginLeft:5}}>v3.0</span></div>
                <div className="flex" style={{gap:10}}>
                    <button onClick={() => setApp('admin')} className="btn btn-secondary" style={{width: 'auto'}}>Admin</button>
                    <button onClick={() => setApp('customer')} className="btn btn-primary" style={{width: 'auto'}}>Order Food</button>
                </div>
            </div>
            <div className="container text-center" style={{paddingTop: 60, paddingBottom: 100}}>
                <h1 style={{fontSize: '3rem', marginBottom: 16}}>Delicious Food,<br/><span className="text-primary">Delivered.</span></h1>
                <p className="text-gray" style={{fontSize: '1.2rem', marginBottom: 40}}>The complete ecosystem for Customers, Restaurants, Drivers, and Owners.</p>
                <div className="grid grid-3">
                    <button onClick={() => setApp('restaurant')} className="portal-card card">
                        <div className="badge-blue" style={{width: 50, height: 50, display:'flex', alignItems:'center', justifyContent:'center', borderRadius: 12, marginBottom: 16}}><ChefHat size={24}/></div>
                        <h3>Restaurant Partner</h3>
                        <p className="text-gray">Manage orders & menu</p>
                    </button>
                    <button onClick={() => setApp('driver')} className="portal-card card">
                        <div className="badge-green" style={{width: 50, height: 50, display:'flex', alignItems:'center', justifyContent:'center', borderRadius: 12, marginBottom: 16}}><Bike size={24}/></div>
                        <h3>Delivery Fleet</h3>
                        <p className="text-gray">Accept jobs nearby</p>
                    </button>
                    <button onClick={() => setApp('admin')} className="portal-card card">
                        <div style={{background: '#f3e5f5', color:'#7b1fa2', width: 50, height: 50, display:'flex', alignItems:'center', justifyContent:'center', borderRadius: 12, marginBottom: 16}}><ShieldCheck size={24}/></div>
                        <h3>Admin Console</h3>
                        <p className="text-gray">Business revenue stats</p>
                    </button>
                </div>
            </div>
        </div>
    )
}

function PortalHeader({ activeApp, user, onLogout, cartCount }) {
    return (
        <div className="header flex-between">
            <div className="logo" style={{fontSize: '1.2rem'}}>
                {activeApp === 'customer' ? <ShoppingBag color="#2563eb"/> : activeApp === 'restaurant' ? <ChefHat color="#2e7d32"/> : activeApp === 'driver' ? <Bike color="#1565c0"/> : <ShieldCheck/>}
                <span style={{textTransform:'capitalize'}}>{activeApp} Portal</span>
            </div>
            <div className="flex" style={{gap: 16}}>
                {activeApp === 'customer' && (
                    <div style={{position:'relative'}}>
                        <ShoppingBag size={24}/>
                        {cartCount > 0 && <span style={{position:'absolute', top:-5, right:-5, background:'red', color:'white', borderRadius:'50%', width:18, height:18, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center'}}>{cartCount}</span>}
                    </div>
                )}
                <button onClick={onLogout} className="btn-danger flex" style={{gap: 4}}><LogOut size={16}/> Exit</button>
            </div>
        </div>
    )
}

// --- SECURE AUTH COMPONENT (GOOGLE LOGIN) ---
function SecureAuth({ type, onSuccess, onBack }) {
    const [identifier, setIdentifier] = useState(''); 
    const [secret, setSecret] = useState(''); 
    const [error, setError] = useState(''); 
    const [loading, setLoading] = useState(false);
    const db = getFirestore(); 
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            onSuccess({ name: user.displayName, uid: user.uid });
        } catch (error) {
            console.error(error);
            setError("Google Login Failed. Ensure 'Authorized Domains' is set in Firebase. " + error.message);
            setLoading(false);
        }
    };

    const handlePartnerLogin = async (e) => { 
        e.preventDefault(); setError(''); setLoading(true); 
        try { 
            if (type === 'admin') { 
                if (identifier === 'admin' && secret === 'admin123') { onSuccess({ name: 'Super Admin', role: 'admin' }); return; } 
                else { throw new Error("Invalid Admin Credentials. Try admin/admin123"); } 
            } 
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'partners'), where('username', '==', identifier), where('password', '==', secret)); 
            const snapshot = await getDocs(q); 
            if (snapshot.empty) throw new Error("Invalid credentials."); 
            const partnerData = snapshot.docs[0].data(); 
            if (type === 'restaurant' && partnerData.role !== 'restaurant') throw new Error("Unauthorized"); 
            if (type === 'driver' && partnerData.role !== 'driver') throw new Error("Unauthorized"); 
            const auth = getAuth(); 
            if(!auth.currentUser) await signInAnonymously(auth); 
            onSuccess(partnerData); 
        } catch (err) { setError(err.message); setLoading(false); } 
    };

    return (
        <div className="modal-overlay">
             <div className="modal">
                 <button onClick={onBack} style={{position:'absolute', top:16, right:16, border:'none', background:'none', cursor:'pointer'}}><X size={24} color="#999"/></button>
                 
                 <div className="text-center" style={{marginBottom: 24}}>
                     <h2>{type === 'customer' ? 'Sign In' : 'Secure Login'}</h2>
                     <p className="text-gray">{type === 'customer' ? 'Secure login to place orders' : 'Enter Partner Credentials'}</p>
                 </div>

                 {type === 'customer' ? ( 
                    <div className="text-center">
                        {error && <p style={{color:'red', marginBottom:10, fontSize:'0.9rem'}}>{error}</p>}
                        
                        <button onClick={handleGoogleLogin} className="btn btn-google" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:10, width:'100%'}}>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style={{width:20}}/>
                            {loading ? 'Connecting...' : 'Continue with Google'}
                        </button>
                        
                        <div style={{marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16}}>
                            <p className="text-gray" style={{fontSize: '0.8rem'}}>
                                No password required.<br/>Instant access with your Google Account.
                            </p>
                        </div>
                    </div>
                 ) : ( 
                    <form onSubmit={handlePartnerLogin}>
                        <input value={identifier} onChange={e=>setIdentifier(e.target.value)} className="input" placeholder="Username" required />
                        <input type="password" value={secret} onChange={e=>setSecret(e.target.value)} className="input" placeholder="Password" required />
                        {error && <p style={{color:'red', marginBottom:10}}>{error}</p>}
                        <button className="btn btn-primary">{loading?'Auth...':'Login'}</button>
                    </form> 
                 )}
             </div>
        </div>
    );
}

// --- PORTALS ---
function CustomerPortal({ user, cart, setCart, onBack }) {
    const [view, setView] = useState('home'); const [selectedRestaurant, setSelectedRestaurant] = useState(null); const [activeOrder, setActiveOrder] = useState(null); const [deliveryAddress, setDeliveryAddress] = useState(''); const [paymentMethod, setPaymentMethod] = useState('upi'); 
    const db = getFirestore(); const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const { itemTotal, deliveryFee, tax, grandTotal } = useMemo(() => { const itemTotal = cart.reduce((s, i) => s + (i.price * i.qty), 0); const deliveryFee = itemTotal > 500 ? 0 : 40; const tax = itemTotal * 0.05; return { itemTotal, deliveryFee, tax, grandTotal: itemTotal + deliveryFee + tax }; }, [cart]);
    const upiId = "pritamanime-1@okhdfcbank"; const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&pn=CraveCart&am=${grandTotal}&cu=INR`;

    // Only show login screen if user is NOT signed in or is Anonymous
    if (!user || user.isAnonymous) return <SecureAuth type="customer" onSuccess={(u) => {}} onBack={onBack} />;

    useEffect(() => { if (!activeOrder?.id) return; const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'orders', activeOrder.id), (doc) => { if(doc.exists()) setActiveOrder(prev => ({...prev, ...doc.data()})); }); return () => unsub(); }, [activeOrder?.id]);
    const placeOrder = async () => { if (!deliveryAddress) { alert("Address required"); return; } const order = { items: cart, total: grandTotal, restaurantId: selectedRestaurant.id, restaurantName: selectedRestaurant.name, userId: user.uid, status: 'placed', createdAt: serverTimestamp(), customerName: user.displayName || 'Customer', address: deliveryAddress, driverId: null, paymentMethod: paymentMethod }; const res = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), order); setCart([]); setActiveOrder({id: res.id, ...order}); setView('tracking'); };
    const addToCart = useCallback((item, rId) => { setCart(p => { if (p.length > 0 && p[0].restaurantId !== rId) { if(!confirm("Start a new basket?")) return p; return [{...item,qty:1,restaurantId:rId}]; } const ex = p.find(i=>i.id===item.id); return ex ? p.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i) : [...p,{...item,qty:1,restaurantId:rId}]; }); }, []);

    return (
        <div>
            {view === 'home' && (
                <>
                    {activeOrder && (<div onClick={() => setView('tracking')} className="card" style={{background:'#1e40af', color:'white', display:'flex', justifyContent:'space-between', cursor:'pointer'}}><div><b>Order in Progress</b><br/><small>Tap to track</small></div><ChevronRight/></div>)}
                    <h2 style={{marginBottom: 16}}>Restaurants</h2>
                    <div className="grid">
                        {MOCK_RESTAURANTS.map(r => (
                            <div key={r.id} onClick={()=>{setSelectedRestaurant(r);setView('restaurant')}} className="card" style={{padding:0, overflow:'hidden', cursor:'pointer'}}>
                                <img src={r.image} className="card-img" style={{borderRadius:0, height: 150}} />
                                <div style={{padding: 16}}>
                                    <div className="flex-between"><h3>{r.name}</h3><span className="badge badge-green">{r.rating} ★</span></div>
                                    <p className="text-gray">{r.cuisine} • {r.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {view === 'restaurant' && selectedRestaurant && (
                <div>
                    <button onClick={() => setView('home')} className="btn btn-secondary" style={{marginBottom: 16, width: 'auto'}}><ArrowLeft size={16}/> Back</button>
                    <div className="card">
                        <h1>{selectedRestaurant.name}</h1>
                        <p className="text-gray">{selectedRestaurant.cuisine}</p>
                    </div>
                    <h3>Menu</h3>
                    <div className="grid" style={{marginTop: 16}}>
                        {selectedRestaurant.menu.map(item => (
                            <div key={item.id} className="card flex-between" style={{marginBottom:0}}>
                                <div><b>{item.name}</b><br/><span className="text-gray">₹{item.price}</span></div>
                                <button onClick={()=>addToCart(item, selectedRestaurant.id)} className="btn-icon btn-primary"><Plus size={16}/></button>
                            </div>
                        ))}
                    </div>
                    {cart.length > 0 && <button onClick={()=>setView('cart')} className="btn btn-primary" style={{position:'fixed', bottom: 20, left: '5%', width: '90%', boxShadow: '0 5px 20px rgba(0,0,0,0.3)'}}>View Cart • ₹{grandTotal.toFixed(2)}</button>}
                </div>
            )}
            {view === 'cart' && (
                <div className="card">
                    <button onClick={() => setView('restaurant')} style={{background:'none', border:'none', marginBottom: 16, cursor:'pointer'}}><ArrowLeft/></button>
                    <h2>Checkout</h2>
                    <div style={{margin: '20px 0'}}>
                        {cart.map(i => (<div key={i.id} className="flex-between" style={{marginBottom: 10}}><span>{i.qty}x {i.name}</span><span>₹{i.price*i.qty}</span></div>))}
                        <hr style={{margin: '16px 0', border:'none', borderTop:'1px dashed #ddd'}}/>
                        <div className="flex-between"><b>Total</b><b>₹{grandTotal.toFixed(2)}</b></div>
                    </div>
                    <textarea value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} placeholder="Delivery Address..." className="input" rows="2" />
                    <div style={{marginBottom: 20}}>
                        <label className="card flex" style={{padding: 10, cursor:'pointer'}}><input type="radio" checked={paymentMethod==='upi'} onChange={()=>setPaymentMethod('upi')} style={{marginRight: 10}}/> UPI (Scan QR)</label>
                        <label className="card flex" style={{padding: 10, cursor:'pointer'}}><input type="radio" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} style={{marginRight: 10}}/> Cash on Delivery</label>
                    </div>
                    {paymentMethod==='upi' && <div className="text-center" style={{marginBottom: 20}}><img src={qrCodeUrl} style={{width: 150}}/><p style={{fontSize: 12}}>UPI: {upiId}</p></div>}
                    <button onClick={placeOrder} className="btn btn-primary">Place Order</button>
                </div>
            )}
            {view === 'tracking' && activeOrder && (
                <div className="card text-center" style={{padding: 40}}>
                    <h2>Order Status</h2>
                    <div style={{fontSize: '2rem', margin: '20px 0', textTransform:'capitalize', color:'#2563eb'}}>{activeOrder.status.replace(/_/g, ' ')}</div>
                    <p className="text-gray">Tracking ID: #{activeOrder.id.slice(0,6)}</p>
                    <button onClick={()=>{setActiveOrder(null);setView('home')}} className="btn btn-secondary" style={{marginTop: 20}}>Place New Order</button>
                </div>
            )}
        </div>
    );
}

function RestaurantPortal({ user, onBack }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false); const [orders, setOrders] = useState([]); const db = getFirestore(); const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    useEffect(() => { const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snapshot) => setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))); return () => unsub(); }, []);
    const update = async (id, s) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', id), { status: s });
    if (!isLoggedIn) return <SecureAuth type="restaurant" onSuccess={(u) => setIsLoggedIn(true)} onBack={onBack} />;
    return (
        <div className="grid">
            <h2>Incoming Orders</h2>
            {orders.map(o => (
                <div key={o.id} className="card">
                    <div className="flex-between">
                        <div><b>#{o.id.slice(0,5)}</b> • {o.customerName}</div>
                        <span className="badge badge-blue">{o.status}</span>
                    </div>
                    <div style={{margin: '10px 0', fontSize: '0.9rem', color: '#666'}}>{o.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '✅ Paid Online'}</div>
                    {o.status==='placed' && <button onClick={()=>update(o.id,'cooking')} className="btn btn-primary" style={{marginTop: 10}}>Accept Order</button>}
                </div>
            ))}
        </div>
    )
}

function DriverPortal({ user, onBack }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false); const [available, setAvailable] = useState([]); const db = getFirestore(); const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    useEffect(() => { const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => setAvailable(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(o => o.status === 'cooking' && !o.driverId))); return () => unsub(); }, []);
    const accept = async (id) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', id), { driverId: user.uid, driverName: user.displayName });
    if (!isLoggedIn) return <SecureAuth type="driver" onSuccess={(u) => setIsLoggedIn(true)} onBack={onBack} />;
    return (
        <div>
            <h2>Available Jobs</h2>
            <div className="grid">
                {available.map(o=>(
                    <div key={o.id} className="card">
                        <div className="flex-between"><b>{o.restaurantName}</b><b className="text-green">₹{o.total}</b></div>
                        <p className="text-gray" style={{margin:'10px 0'}}>{o.address}</p>
                        <button onClick={()=>accept(o.id)} className="btn btn-primary">Accept Job</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AdminPortal({ user, onBack }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false); const [orders, setOrders] = useState([]); const [partners, setPartners] = useState([]); const [form, setForm] = useState({name:'', user:'', pass:'', role:'restaurant'});
    const db = getFirestore(); const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    useEffect(() => { const q1 = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders')); const u1 = onSnapshot(q1, s=>setOrders(s.docs.map(d=>d.data()))); const q2 = query(collection(db, 'artifacts', appId, 'public', 'data', 'partners')); const u2 = onSnapshot(q2, s=>setPartners(s.docs.map(d=>({id:d.id,...d.data()})))); return ()=>{u1();u2();} }, []);
    const create = async (e) => { e.preventDefault(); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'partners'), { name:form.name, username:form.user, password:form.pass, role:form.role }); alert("Created"); };
    if (!isLoggedIn) return <SecureAuth type="admin" onSuccess={(u) => setIsLoggedIn(true)} onBack={onBack} />;
    return (
        <div>
            <h2>Admin Dashboard</h2>
            <div className="grid grid-3" style={{margin: '20px 0'}}>
                <div className="card text-center"><h3>Revenue</h3><div className="text-green" style={{fontSize: '1.5rem'}}>₹{orders.reduce((s,o)=>s+(o.total||0),0).toFixed(2)}</div></div>
                <div className="card text-center"><h3>Orders</h3><div style={{fontSize: '1.5rem'}}>{orders.length}</div></div>
            </div>
            
            <div className="card">
                <h3>Add New Partner</h3>
                <form onSubmit={create} style={{display:'grid', gap: 10, marginTop: 10}}>
                    <input className="input" placeholder="Business/Driver Name" onChange={e=>setForm({...form,name:e.target.value})}/>
                    <input className="input" placeholder="Username" onChange={e=>setForm({...form,user:e.target.value})}/>
                    <input className="input" placeholder="Password" onChange={e=>setForm({...form,pass:e.target.value})}/>
                    <select className="input" onChange={e=>setForm({...form,role:e.target.value})}><option value="restaurant">Restaurant</option><option value="driver">Driver</option></select>
                    <button className="btn btn-primary">Create Account</button>
                </form>
            </div>
        </div>
    )
}


