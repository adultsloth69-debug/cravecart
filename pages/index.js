import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { 
  ShoppingBag, MapPin, Search, Star, Clock, Plus, Minus, User, 
  CheckCircle, Utensils, ArrowLeft, X, CreditCard, Bike, 
  Package, Home, Navigation, DollarSign, Activity, BarChart3,
  Briefcase, ChevronRight, LogOut, ShieldCheck, Globe, Menu,
  ChefHat, Smartphone, TrendingUp, Users, Lock, Key, Mail, Banknote
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, updateProfile, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, 
  orderBy, doc, updateDoc, serverTimestamp, where, getDocs, deleteDoc, getDoc, setDoc 
} from 'firebase/firestore';

// --- 1. GLOBAL FIREBASE INIT (DO NOT TOUCH) ---
let app, auth, db;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

try {
    if (firebaseConfig.apiKey) {
        // Singleton Pattern: Only initialize if not already running
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    }
} catch (e) {
    console.error("Firebase Init Failed", e);
}

// --- 2. STYLES ---
const cssStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; }
  body { background-color: #f0fdf4; color: #333; padding-bottom: 80px; }
  .container { max-width: 600px; margin: 0 auto; padding: 16px; }
  .flex-between { display: flex; justify-content: space-between; align-items: center; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .text-primary { color: #15803d; } 
  .font-bold { font-weight: 700; }
  .btn { padding: 12px; border-radius: 12px; border: none; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 100%; font-size: 1rem; margin-top: 10px; }
  .btn-primary { background: #15803d; color: white; } 
  .btn-secondary { background: #fff; border: 1px solid #ddd; color: #333; margin-top: 0; }
  .btn-danger { color: #d32f2f; background: transparent; padding: 0; width: auto; margin:0; }
  .btn-link { background: none; border: none; color: #15803d; font-weight: bold; cursor: pointer; text-decoration: underline; margin-top: 15px; display: block; width: 100%; }
  .input { width: 100%; padding: 14px; border: 1px solid #ddd; border-radius: 12px; font-size: 1rem; margin-bottom: 12px; display: block; }
  .card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
  .header { position: sticky; top: 0; background: white; padding: 16px; box-shadow: 0 1px 5px rgba(0,0,0,0.05); z-index: 100; }
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { background: white; width: 100%; max-width: 400px; border-radius: 24px; padding: 24px; position: relative; }
  @media (min-width: 768px) { .grid { grid-template-columns: 1fr 1fr; } }
`;

// --- DATA ---
const MOCK_RESTAURANTS = [
  { id: 1, name: "Burger King", cuisine: "Burgers", rating: 4.2, time: "30 min", price: "₹200", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500", menu: [{ id: 101, name: "Whopper", price: 349 }] },
  { id: 2, name: "Pizza Hut", cuisine: "Pizza", rating: 4.5, time: "40 min", price: "₹300", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500", menu: [{ id: 201, name: "Pepperoni", price: 499 }] }
];

// --- APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeApp, setActiveApp] = useState('landing'); 
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => { setCart([]); if(auth) await signOut(auth); setActiveApp('landing'); }, []);
  const goBack = useCallback(() => { setActiveApp('landing'); }, []);
  const cartCount = useMemo(() => cart.reduce((a,b)=>a+b.qty,0), [cart]);

  if (!db) return <div className="container" style={{color:'red'}}><h1>Error</h1><p>Database not connected. Check Vercel Keys.</p></div>;
  if (loading) return <div className="container text-center" style={{marginTop: 100}}>Loading...</div>;

  return (
    <>
      <Head><style>{cssStyles}</style></Head>
      {activeApp === 'landing' ? <LandingPage setApp={setActiveApp} /> : 
        <div>
            <PortalHeader activeApp={activeApp} user={user} onLogout={handleLogout} cartCount={cartCount} />
            <main className="container">
                {activeApp === 'customer' && <CustomerPortal user={user} cart={cart} setCart={setCart} onBack={goBack} />}
                {activeApp === 'restaurant' && <RestaurantPortal user={user} onBack={goBack} />}
                {activeApp === 'driver' && <DriverPortal user={user} onBack={goBack} />}
                {activeApp === 'admin' && <AdminPortal user={user} onBack={goBack} />}
            </main>
        </div>
      }
    </>
  );
}

function LandingPage({ setApp }) {
    return (
        <div style={{ background: 'white', minHeight: '100vh' }}>
            <div className="header flex-between">
                <div style={{fontWeight:'bold', color:'#15803d', fontSize:'1.2rem'}}>CraveCart</div>
                <div className="flex" style={{gap:10}}>
                    <button onClick={() => setApp('admin')} className="btn btn-secondary" style={{width: 'auto'}}>Admin</button>
                    <button onClick={() => setApp('customer')} className="btn btn-primary" style={{width: 'auto'}}>Order</button>
                </div>
            </div>
            <div className="container text-center" style={{paddingTop: 60}}>
                <h1 style={{fontSize: '2.5rem', marginBottom: 16}}>Food Delivery <span className="text-primary">Ecosystem</span></h1>
                <div className="grid">
                    <button onClick={() => setApp('restaurant')} className="card"><h3>Restaurant Login</h3></button>
                    <button onClick={() => setApp('driver')} className="card"><h3>Driver Login</h3></button>
                </div>
            </div>
        </div>
    )
}

function PortalHeader({ activeApp, user, onLogout, cartCount }) {
    return (
        <div className="header flex-between">
            <div style={{fontWeight:'bold', textTransform:'capitalize'}}>{activeApp} Portal</div>
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
                {activeApp === 'customer' && <div><ShoppingBag size={20}/> {cartCount>0 && <b>({cartCount})</b>}</div>}
                <button onClick={onLogout} className="btn-danger">Exit</button>
            </div>
        </div>
    )
}

function SecureAuth({ type, onSuccess, onBack }) {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [name, setName] = useState(''); 
    const [error, setError] = useState(''); 
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault(); setLoading(true); setError("");
        try {
            if (type === 'customer') {
                let user;
                if (isSignup) {
                    if (!name) throw new Error("Name required");
                    const res = await createUserWithEmailAndPassword(auth, email, password);
                    user = res.user;
                    await updateProfile(user, { displayName: name });
                } else {
                    const res = await signInWithEmailAndPassword(auth, email, password);
                    user = res.user;
                }
                onSuccess({ name: user.displayName || name, uid: user.uid });
            } else {
                if (type === 'admin' && email === 'admin' && password === 'admin123') { onSuccess({name:'Admin', role:'admin'}); return; }
                const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'partners'), where('username', '==', email), where('password', '==', password));
                const snap = await getDocs(q);
                if (snap.empty) throw new Error("Invalid credentials");
                const data = snap.docs[0].data();
                if (type !== 'admin' && data.role !== type) throw new Error("Wrong Portal");
                onSuccess(data);
            }
        } catch (err) { setError(err.message); setLoading(false); }
    };

    return (
        <div className="modal-overlay">
             <div className="modal">
                 <button onClick={onBack} style={{float:'right', background:'none', border:'none'}}>✕</button>
                 <div className="text-center" style={{marginBottom: 20}}><h2>{type === 'customer' ? (isSignup ? 'Create Account' : 'Login') : 'Partner Login'}</h2></div>
                 <form onSubmit={handleAuth}>
                     {type === 'customer' && isSignup && <input className="input" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} required />}
                     <input className="input" placeholder={type==='customer'?"Email":"Username"} value={email} onChange={e=>setEmail(e.target.value)} required />
                     <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
                     {error && <p style={{color:'red', marginBottom:10}}>{error}</p>}
                     <button className="btn btn-primary">{loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}</button>
                 </form>
                 {type === 'customer' && <button className="btn-link" onClick={()=>setIsSignup(!isSignup)}>{isSignup ? "Have an account? Login" : "New? Create Account"}</button>}
             </div>
        </div>
    );
}

function ProfileSetup({ user, onComplete }) {
    const [phone, setPhone] = useState(''); const [city, setCity] = useState(''); const [address, setAddress] = useState(''); const [loading, setLoading] = useState(false);
    const save = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try {
            if (!user?.uid || !db) throw new Error("System error. Try reloading.");
            await setDoc(doc(db, 'users', user.uid), { name: user.displayName, email: user.email, phone, city, address }); 
            onComplete({ name: user.displayName, phone, city, address }); 
        } catch(e) {
            alert("Error: " + e.message); setLoading(false);
        }
    };
    return (
        <div className="modal-overlay"><div className="modal">
            <h2>Complete Profile</h2>
            <form onSubmit={save} style={{marginTop:10}}>
                <input className="input" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} required />
                <input className="input" placeholder="City" value={city} onChange={e=>setCity(e.target.value)} required />
                <input className="input" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} required />
                <button className="btn btn-primary">{loading?'Saving...':'Save'}</button>
            </form>
        </div></div>
    )
}

function CustomerPortal({ user, cart, setCart, onBack }) {
    const [view, setView] = useState('home'); const [profile, setProfile] = useState(null); const [selRest, setSelRest] = useState(null); const [order, setOrder] = useState(null); 
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    if (!user) return <SecureAuth type="customer" onSuccess={()=>{}} onBack={onBack}/>;
    
    // SAFE PROFILE CHECK
    useEffect(() => { 
        if(!user?.uid || !db) return;
        getDoc(doc(db, 'users', user.uid)).then(s => { 
            if(s.exists()) setProfile(s.data()); else setProfile('new'); 
        }).catch(e => console.log("Profile check failed", e));
    }, [user]);

    useEffect(() => { if (order?.id) onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'orders', order.id), s => { if(s.exists()) setOrder(prev => ({...prev, ...s.data()})); }); }, [order?.id]);

    if (profile === 'new') return <ProfileSetup user={user} onComplete={setProfile} />;
    if (!profile) return <div className="container text-center" style={{marginTop:50}}>Loading...</div>;

    const placeOrder = async () => {
        const total = cart.reduce((s,i)=>s+(i.price*i.qty),0) + 40;
        const newOrder = { items: cart, total, restaurantId: selRest.id, restaurantName: selRest.name, userId: user.uid, status: 'placed', createdAt: serverTimestamp(), customerName: profile.name, customerPhone: profile.phone, address: profile.address, driverId: null, paymentMethod: 'cod' };
        const res = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), newOrder);
        setCart([]); setOrder({id: res.id, ...newOrder}); setView('tracking');
    };

    return (
        <div>
            {view === 'home' && (<div>
                <div style={{marginBottom:20}}><h2>Hi {profile.name}</h2><small>{profile.address}</small></div>
                {order && <div className="card" onClick={()=>setView('tracking')} style={{background:'#15803d', color:'white'}}>Active Order: {order.status}</div>}
                <div className="grid">{MOCK_RESTAURANTS.map(r=><div key={r.id} className="card" onClick={()=>{setSelRest(r);setView('rest')}}><img src={r.image} className="card-img"/><b>{r.name}</b></div>)}</div>
            </div>)}
            {view === 'rest' && selRest && (<div><button onClick={()=>setView('home')} className="btn-secondary" style={{width:'auto', marginBottom:10}}>Back</button><h1>{selRest.name}</h1>
                <div className="grid">{selRest.menu.map(i=><div key={i.id} className="card flex-between"><div><b>{i.name}</b><br/>₹{i.price}</div><button className="btn-primary" style={{width:'auto', padding:'5px 10px'}} onClick={()=>setCart([...cart, {...i, qty:1}])}>Add</button></div>)}</div>
                {cart.length>0 && <button className="btn-primary" style={{position:'fixed', bottom:10, left:10, width:'95%'}} onClick={()=>setView('cart')}>Cart ({cart.length})</button>}
            </div>)}
            {view === 'cart' && (<div><button onClick={()=>setView('rest')} className="btn-secondary" style={{width:'auto', marginBottom:10}}>Back</button><h2>Checkout</h2>
                {cart.map((i,x)=><div key={x} className="flex-between" style={{marginBottom:10}}><span>{i.name}</span><b>₹{i.price}</b></div>)}
                <hr/><div className="flex-between"><b>Total (+Del)</b><b>₹{cart.reduce((s,i)=>s+(i.price*i.qty),0)+40}</b></div>
                <button onClick={placeOrder} className="btn-primary" style={{marginTop:20}}>Place Order (COD)</button>
            </div>)}
            {view === 'tracking' && order && (<div><h2>Order #{order.id.slice(0,4)}</h2><h1 style={{color:'#15803d', textTransform:'capitalize'}}>{order.status}</h1><p>Driver: {order.driverName || "Finding..."}</p><button onClick={()=>{setOrder(null);setView('home')}} className="btn-secondary">Close</button></div>)}
        </div>
    )
}

function RestaurantPortal({ user, onBack }) {
    const [auth, setAuth] = useState(false); const [orders, setOrders] = useState([]); const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    useEffect(() => { const q=query(collection(db,'artifacts',appId,'public','data','orders'),orderBy('createdAt','desc')); return onSnapshot(q,s=>setOrders(s.docs.map(d=>({id:d.id,...d.data()})))); }, []);
    if(!auth) return <SecureAuth type="restaurant" onSuccess={()=>setAuth(true)} onBack={onBack}/>;
    return <div className="grid">{orders.map(o=><div key={o.id} className="card"><b>#{o.id.slice(0,4)}</b>: {o.status} {o.status==='placed'&&<button className="btn-primary" onClick={()=>updateDoc(doc(db,'artifacts',appId,'public','data','orders',o.id),{status:'cooking'})}>Accept</button>}</div>)}</div>;
}
function DriverPortal({ user, onBack }) {
    const [auth, setAuth] = useState(false); const [jobs, setJobs] = useState([]); const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    useEffect(() => { const q=query(collection(db,'artifacts',appId,'public','data','orders'),orderBy('createdAt','desc')); return onSnapshot(q,s=>setJobs(s.docs.map(d=>({id:d.id,...d.data()})).filter(o=>o.status==='cooking' && !o.driverId))); }, []);
    if(!auth) return <SecureAuth type="driver" onSuccess={()=>setAuth(true)} onBack={onBack}/>;
    return <div className="grid">{jobs.map(o=><div key={o.id} className="card"><b>{o.restaurantName}</b><br/>{o.address}<button className="btn-primary" onClick={()=>updateDoc(doc(db,'artifacts',appId,'public','data','orders',o.id),{driverId:'Me',driverName:'Driver X',status:'out_for_delivery'})}>Accept</button></div>)}</div>;
}
function AdminPortal({ user, onBack }) {
    const [auth, setAuth] = useState(false); const [form,setForm]=useState({}); const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const create = async (e) => { e.preventDefault(); await addDoc(collection(db,'artifacts',appId,'public','data','partners'), form); alert("Created"); };
    if(!auth) return <SecureAuth type="admin" onSuccess={()=>setAuth(true)} onBack={onBack}/>;
    return <div className="card"><h3>Create Partner</h3><input className="input" placeholder="User" onChange={e=>setForm({...form,username:e.target.value})}/><input className="input" placeholder="Pass" onChange={e=>setForm({...form,password:e.target.value})}/><select className="input" onChange={e=>setForm({...form,role:e.target.value})}><option>restaurant</option><option>driver</option></select><button className="btn-primary" onClick={create}>Add</button></div>;
}


