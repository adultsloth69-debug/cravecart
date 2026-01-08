import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { 
  ShoppingBag, MapPin, Star, Plus, Minus, User, CheckCircle, Utensils, 
  ArrowLeft, X, CreditCard, Bike, Home, ShieldCheck, ChefHat, LogOut, Lock, Key 
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, updateProfile, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, where, getDocs, setDoc, getDoc 
} from 'firebase/firestore';

// --- SAFE FIREBASE INIT ---
let app, auth, db;
let configError = "";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

try {
    // 1. Check if keys exist
    if (!firebaseConfig.apiKey) {
        configError = "CRITICAL: Firebase API Key is missing in Vercel Environment Variables.";
    } else {
        // 2. Init Firebase safely
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    }
} catch (e) {
    configError = "Firebase Init Crash: " + e.message;
}

// --- CSS ---
const cssStyles = `
  body { background: #fff; color: #111; font-family: sans-serif; padding-bottom: 80px; margin: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .btn { width: 100%; padding: 15px; border-radius: 10px; border: none; background: #000; color: #fff; font-weight: bold; font-size: 1rem; margin-top: 10px; cursor: pointer; }
  .btn-secondary { background: #eee; color: #000; }
  .input { width: 100%; padding: 15px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px; box-sizing: border-box; font-size: 1rem; }
  .card { border: 1px solid #eee; border-radius: 15px; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
  .header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: #fff; z-index: 50; }
  .error-box { background: #fee2e2; color: #991b1b; padding: 20px; border-radius: 10px; text-align: center; margin: 20px; border: 1px solid #f87171; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
`;

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeApp, setActiveApp] = useState('landing');
  const [loading, setLoading] = useState(true);

  // If config failed, show error immediately (Don't crash)
  if (configError) {
      return (
          <div className="error-box">
              <h2>Setup Error</h2>
              <p>{configError}</p>
              <p style={{fontSize: '0.8rem', marginTop: 10}}>Go to Vercel -> Settings -> Environment Variables and add your Firebase Keys.</p>
          </div>
      );
  }

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  const handleLogout = async () => { await signOut(auth); setActiveApp('landing'); };

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Loading v7...</div>;

  return (
    <>
      <Head><style>{cssStyles}</style></Head>
      {activeApp === 'landing' ? <Landing setApp={setActiveApp} /> : (
          <div>
              <div className="header">
                  <div style={{fontWeight:'bold'}}>CraveCart v7</div>
                  <button onClick={handleLogout} style={{background:'none', border:'none', color:'red'}}>Exit</button>
              </div>
              <div className="container">
                  {activeApp === 'customer' && <CustomerPortal user={user} />}
                  {activeApp === 'restaurant' && <PartnerPortal user={user} role="restaurant" />}
                  {activeApp === 'driver' && <PartnerPortal user={user} role="driver" />}
                  {activeApp === 'admin' && <PartnerPortal user={user} role="admin" />}
              </div>
          </div>
      )}
    </>
  );
}

// --- LANDING ---
function Landing({ setApp }) {
    return (
        <div className="container" style={{textAlign:'center', paddingTop: 50}}>
            <h1 style={{fontSize:'3rem'}}>CraveCart</h1>
            <p style={{color:'#666', marginBottom: 40}}>Safe Mode v7.0</p>
            <div className="grid">
                <div className="card" onClick={()=>setApp('customer')}><h3>Order Food</h3></div>
                <div className="card" onClick={()=>setApp('restaurant')}><h3>Restaurant</h3></div>
                <div className="card" onClick={()=>setApp('driver')}><h3>Driver</h3></div>
                <div className="card" onClick={()=>setApp('admin')}><h3>Admin</h3></div>
            </div>
        </div>
    )
}

// --- AUTH & PORTALS ---
function CustomerPortal({ user }) {
    if (!user) return <AuthForm type="customer" />;
    
    // Simple Profile Check
    const [profile, setProfile] = useState(null);
    useEffect(() => {
        getDoc(doc(db, 'users', user.uid)).then(s => {
            if(s.exists()) setProfile(s.data());
            else setProfile('new');
        });
    }, [user]);

    if(profile === 'new') return <ProfileForm user={user} onDone={setProfile} />;
    if(!profile) return <div>Loading Profile...</div>;

    // Show Restaurants
    return (
        <div>
            <h2>Hi, {profile.name}</h2>
            <p style={{color:'#666', marginBottom: 20}}>Delivering to: {profile.address}</p>
            <div className="grid">
                <div className="card"><h3>Burger King</h3><p>Burgers • ₹200</p><button className="btn">View Menu</button></div>
                <div className="card"><h3>Pizza Hut</h3><p>Pizza • ₹300</p><button className="btn">View Menu</button></div>
            </div>
        </div>
    )
}

function PartnerPortal({ user, role }) {
    if (!user) return <AuthForm type="partner" role={role} />;
    return <div><h2>{role.toUpperCase()} Dashboard</h2><p>Welcome back.</p></div>
}

// --- FORMS ---
function AuthForm({ type, role }) {
    const [isSignup, setSignup] = useState(false);
    const [form, setForm] = useState({ name:'', email:'', pass:'' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            if (type === 'customer') {
                if (isSignup) {
                    const res = await createUserWithEmailAndPassword(auth, form.email, form.pass);
                    await updateProfile(res.user, { displayName: form.name });
                } else {
                    await signInWithEmailAndPassword(auth, form.email, form.pass);
                }
            } else {
                // Simplified Partner Login for Demo
                if(form.email === 'admin' && form.pass === 'admin123') { 
                    // Admin login hack for demo simplicity
                    alert("Admin Logged In (Demo)"); 
                } else {
                    // Real partner login would query DB here
                    setError("Partner login requires database lookup. Use Admin/Admin123 for test.");
                }
            }
        } catch(err) { setError(err.message); }
        setLoading(false);
    }

    return (
        <div className="card">
            <h2>{type==='customer' ? (isSignup?'Sign Up':'Login') : `${role} Login`}</h2>
            <form onSubmit={submit}>
                {isSignup && <input className="input" placeholder="Name" onChange={e=>setForm({...form,name:e.target.value})} required />}
                <input className="input" placeholder={type==='customer'?"Email":"Username"} onChange={e=>setForm({...form,email:e.target.value})} required />
                <input className="input" type="password" placeholder="Password" onChange={e=>setForm({...form,pass:e.target.value})} required />
                {error && <p style={{color:'red'}}>{error}</p>}
                <button className="btn" disabled={loading}>{loading?'...':'Submit'}</button>
            </form>
            {type==='customer' && <button className="btn btn-secondary" onClick={()=>setSignup(!isSignup)}>{isSignup?'Login instead':'Create Account'}</button>}
        </div>
    )
}

function ProfileForm({ user, onDone }) {
    const [form, setForm] = useState({ phone:'', city:'', address:'' });
    const save = async (e) => {
        e.preventDefault();
        await setDoc(doc(db, 'users', user.uid), { ...form, name: user.displayName, email: user.email });
        onDone(form);
    }
    return (
        <div className="card">
            <h2>Complete Profile</h2>
            <form onSubmit={save}>
                <input className="input" placeholder="Phone" onChange={e=>setForm({...form,phone:e.target.value})} required />
                <input className="input" placeholder="City" onChange={e=>setForm({...form,city:e.target.value})} required />
                <input className="input" placeholder="Address" onChange={e=>setForm({...form,address:e.target.value})} required />
                <button className="btn">Save Profile</button>
            </form>
        </div>
    )
}


