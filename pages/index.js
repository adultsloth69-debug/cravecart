import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { 
  ShoppingBag, MapPin, Search, Star, Clock, Plus, Minus, User, 
  CheckCircle, Utensils, ArrowLeft, X, CreditCard, Bike, 
  Package, Home, Navigation, DollarSign, Activity, BarChart3,
  Briefcase, ChevronRight, LogOut, ShieldCheck, Globe, Menu,
  ChefHat, Smartphone, TrendingUp, Users, Lock, Key, Phone, MessageSquare, QrCode, Banknote
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  updateProfile, signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, 
  orderBy, doc, updateDoc, serverTimestamp, where, getDocs, deleteDoc 
} from 'firebase/firestore';

// --- SAFE INITIALIZATION & DEBUGGING ---
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
    // Check if keys exist
    if (!firebaseConfig.apiKey) {
        throw new Error("Missing Firebase Configuration. Please check Vercel Environment Variables.");
    }
    // Initialize Firebase
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    initError = e.message;
}

// --- STATIC DATA (INR) ---
const MOCK_RESTAURANTS = [
  {
    id: 1, name: "Burger King", cuisine: "American • Burgers", rating: 4.2, time: "25-30 min", price: "₹200 for one",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80",
    menu: [
      { id: 101, name: "Whopper Meal", price: 349, desc: "Flame-grilled beef patty, sesame bun, fries, drink.", isVeg: false },
      { id: 102, name: "Chicken Royale", price: 229, desc: "Crispy chicken breast with lettuce and mayo.", isVeg: false },
      { id: 103, name: "Veggie Bean Burger", price: 169, desc: "Spicy bean patty with fresh veggies.", isVeg: true },
    ]
  },
  {
    id: 2, name: "Pizza Hut", cuisine: "Italian • Pizza", rating: 4.5, time: "35-40 min", price: "₹300 for one",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    menu: [
      { id: 201, name: "Pepperoni Feast", price: 499, desc: "Double pepperoni and extra mozzarella.", isVeg: false },
      { id: 202, name: "Veggie Supreme", price: 399, desc: "Onions, peppers, mushrooms, sweetcorn.", isVeg: true },
      { id: 203, name: "Garlic Bread", price: 149, desc: "Classic crunchy garlic bread.", isVeg: true },
    ]
  },
  {
    id: 3, name: "Sushi Master", cuisine: "Japanese • Sushi", rating: 4.8, time: "40-50 min", price: "₹800 for one",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    menu: [
      { id: 301, name: "Salmon Platter", price: 899, desc: "12 pcs fresh salmon nigiri and maki.", isVeg: false },
      { id: 302, name: "Avocado Maki", price: 349, desc: "6 pcs fresh avocado roll.", isVeg: true },
    ]
  }
];

// --- APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeApp, setActiveApp] = useState('landing'); 
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Optimized Auth Init
  useEffect(() => {
    if (initError) { setLoading(false); return; }
    
    const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
      setCart([]);
      setActiveApp('landing'); 
  }, []);

  const goBackToHome = useCallback(() => {
      setActiveApp('landing');
  }, []);

  // Memoized Cart Count
  const cartCount = useMemo(() => cart.reduce((a,b)=>a+b.qty,0), [cart]);

  // If Firebase failed, show the error on screen
  if (initError) {
      return (
          <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>
              <h1>App Crashed</h1>
              <p>The app could not start because:</p>
              <pre style={{ background: '#eee', padding: 10, borderRadius: 5 }}>{initError}</pre>
              <br/>
              <h3>How to fix in Vercel:</h3>
              <ol>
                  <li>Go to your Vercel Dashboard</li>
                  <li>Click Settings - Environment Variables</li>
                  <li>Add NEXT_PUBLIC_FIREBASE_API_KEY etc.</li>
                  <li>Redeploy the app</li>
              </ol>
          </div>
      );
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-white text-orange-600 font-bold animate-pulse">Loading Platform...</div>;

  // --- 1. LANDING PAGE ---
  if (activeApp === 'landing') {
      return (
          <div className="min-h-screen bg-white font-sans text-gray-800 animate-fade-in will-change-transform">
              <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-all duration-300">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between items-center h-16">
                          <div className="flex items-center gap-2">
                              <div className="bg-orange-600 p-2 rounded-lg shadow-lg shadow-orange-200"><Utensils className="w-6 h-6 text-white" /></div>
                              <span className="text-2xl font-bold tracking-tighter text-gray-900">CraveCart</span>
                          </div>
                          <div className="flex items-center gap-4">
                              <button onClick={() => setActiveApp('admin')} className="text-sm font-medium text-gray-500 hover:text-gray-900 hidden sm:block transition-colors">Admin Login</button>
                              <button onClick={() => setActiveApp('customer')} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-full font-bold transition shadow-lg shadow-orange-200 hover:shadow-orange-300 transform hover:-translate-y-0.5">Order Food</button>
                          </div>
                      </div>
                  </div>
              </header>

              <div className="relative overflow-hidden pt-16 pb-32 bg-gray-50">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                      <div className="text-center max-w-3xl mx-auto">
                          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                              One Platform, <br/><span className="text-orange-600">Total Control.</span>
                          </h1>
                          <p className="text-xl text-gray-500 mb-8">
                              The complete ecosystem for Customers, Restaurants, Drivers, and Business Owners.
                          </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                          <PortalCard icon={ChefHat} title="Restaurant Portal" desc="Manage orders & menu" color="orange" onClick={() => setActiveApp('restaurant')} />
                          <PortalCard icon={Bike} title="Driver App" desc="Accept delivery jobs" color="blue" onClick={() => setActiveApp('driver')} />
                          <PortalCard icon={ShieldCheck} title="Admin Dashboard" desc="Manage partners & revenue" color="purple" onClick={() => setActiveApp('admin')} />
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- 2. RENDER ACTIVE APP ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20 md:pb-0 relative animate-fade-in will-change-transform">
      <PortalHeader activeApp={activeApp} user={user} onLogout={handleLogout} cartCount={cartCount} />
      
      <main className="max-w-6xl mx-auto p-4 md:p-8">
          {activeApp === 'customer' && <CustomerPortal user={user} cart={cart} setCart={setCart} onBack={goBackToHome} />}
          {activeApp === 'restaurant' && <RestaurantPortal user={user} onBack={goBackToHome} />}
          {activeApp === 'driver' && <DriverPortal user={user} onBack={goBackToHome} />}
          {activeApp === 'admin' && <AdminPortal user={user} onBack={goBackToHome} />}
      </main>
    </div>
  );
}

// Memoized Card Component
const PortalCard = React.memo(({ icon: Icon, title, desc, color, onClick }) => {
    const colors = {
        orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white',
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
        purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    };
    return (
        <button onClick={onClick} className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left w-full">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
        </button>
    )
});

// Memoized Header Component
const PortalHeader = React.memo(({ activeApp, user, onLogout, cartCount }) => {
    const config = useMemo(() => ({
        customer: { bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-200', icon: Utensils, label: 'CraveCart', accent: 'bg-orange-600' },
        restaurant: { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-800', icon: ChefHat, label: 'Partner Portal', accent: 'bg-green-500' },
        driver: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', icon: Bike, label: 'Driver App', accent: 'bg-white/20' },
        admin: { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-800', icon: ShieldCheck, label: 'Admin Console', accent: 'bg-purple-600' }
    }[activeApp]), [activeApp]);

    return (
        <nav className={`sticky top-0 z-50 shadow-sm border-b px-6 py-4 flex justify-between items-center transition-colors duration-300 ${config.bg} ${config.border} ${config.text}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.accent}`}><config.icon className="w-5 h-5 text-white" /></div>
                <span className="text-xl font-bold tracking-tight">{config.label}</span>
            </div>
            <div className="flex items-center gap-6">
                {activeApp === 'customer' && (
                    <div className="relative cursor-pointer hover:opacity-75 transition">
                        <ShoppingBag className="w-6 h-6" />
                        {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{cartCount}</span>}
                    </div>
                )}
                <button onClick={onLogout} className="text-sm opacity-70 hover:opacity-100 flex items-center gap-1 font-medium ml-2 transition-opacity"><LogOut className="w-4 h-4" /> Exit</button>
            </div>
        </nav>
    );
});

// --- SECURE AUTH COMPONENT ---
const SecureAuth = React.memo(({ type, onSuccess, onBack }) => {
    const [step, setStep] = useState(1);
    const [identifier, setIdentifier] = useState(''); 
    const [secret, setSecret] = useState(''); 
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const handleSendOTP = useCallback((e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => { setLoading(false); setStep(2); }, 800);
    }, []);

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (secret !== '1234') { setError('Invalid OTP. Use 1234'); return; }
        
        setLoading(true);
        const auth = getAuth();
        if(auth.currentUser) await updateProfile(auth.currentUser, { displayName: `User ${identifier.slice(-4)}` });
        onSuccess({ name: `User ${identifier}` });
    };

    const handlePartnerLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (type === 'admin') {
                if (identifier === 'admin' && secret === 'admin123') {
                    onSuccess({ name: 'Super Admin', role: 'admin' });
                    return;
                } else {
                    throw new Error("Invalid Admin Credentials. Try admin/admin123");
                }
            }

            const q = query(
                collection(db, 'artifacts', appId, 'public', 'data', 'partners'),
                where('username', '==', identifier),
                where('password', '==', secret)
            );
            
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) { throw new Error("Invalid credentials."); }

            const partnerData = snapshot.docs[0].data();

            if (type === 'restaurant' && partnerData.role !== 'restaurant') { throw new Error("This account is not authorized for Restaurant Portal."); }
            if (type === 'driver' && partnerData.role !== 'driver') { throw new Error("This account is not authorized for Driver App."); }
            
            const auth = getAuth();
            if(auth.currentUser) await updateProfile(auth.currentUser, { displayName: partnerData.name });
            
            onSuccess(partnerData);

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative overflow-hidden transform transition-all">
                 
                 <button onClick={onBack} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors" title="Back to Home"><X className="w-5 h-5"/></button>

                 <div className="text-center mb-8">
                     <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${type==='customer'?'bg-orange-100 text-orange-600':type==='partner'?'bg-blue-100 text-blue-600':'bg-purple-100 text-purple-600'}`}>
                         {type==='customer' ? <Smartphone className="w-8 h-8"/> : <Lock className="w-8 h-8"/>}
                     </div>
                     <h2 className="text-2xl font-bold text-gray-900">{type === 'customer' ? 'Login / Sign up' : 'Secure Login'}</h2>
                     <p className="text-gray-500 text-sm">{type === 'customer' ? 'Enter phone to receive OTP' : 'Enter your provided credentials'} </p>
                 </div>

                 {type === 'customer' && (
                     <>
                        {step === 1 ? (
                            <form onSubmit={handleSendOTP} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mobile Number</label>
                                    <div className="relative mt-1">
                                        <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"/>
                                        <input type="tel" value={identifier} onChange={e=>setIdentifier(e.target.value)} className="w-full pl-10 p-3 border rounded-xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" placeholder="+1 555 000 0000" required />
                                    </div>
                                </div>
                                <button disabled={loading} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition flex justify-center transform active:scale-95">
                                    {loading ? 'Sending...' : 'Get OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Enter OTP</label>
                                    <div className="relative mt-1">
                                        <MessageSquare className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"/>
                                        <input type="text" value={secret} onChange={e=>setSecret(e.target.value)} className="w-full pl-10 p-3 border rounded-xl font-bold text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" placeholder="1234" maxLength={4} required />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Use code <b>1234</b> for demo</p>
                                </div>
                                {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
                                <button disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 transition flex justify-center transform active:scale-95">
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                                <button type="button" onClick={()=>setStep(1)} className="w-full text-center text-gray-500 text-sm hover:underline">Change Number</button>
                            </form>
                        )}
                     </>
                 )}

                 {type !== 'customer' && (
                     <form onSubmit={handlePartnerLogin} className="space-y-4">
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Username</label>
                             <div className="relative mt-1">
                                 <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"/>
                                 <input type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all" placeholder="Username" required />
                             </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Password</label>
                             <div className="relative mt-1">
                                 <Key className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"/>
                                 <input type="password" value={secret} onChange={e=>setSecret(e.target.value)} className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all" placeholder="••••••••" required />
                             </div>
                         </div>
                         {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center border border-red-100">{error}</div>}
                         <button disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition flex justify-center transform active:scale-95">
                             {loading ? 'Authenticating...' : 'Secure Login'}
                         </button>
                         {type === 'admin' && <p className="text-xs text-gray-400 text-center">Default: admin / admin123</p>}
                     </form>
                 )}
             </div>
        </div>
    );
});

// --- PORTAL 1: CUSTOMER ---
function CustomerPortal({ user, cart, setCart, onBack }) {
    const [view, setView] = useState('home'); 
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'cod'
    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Memoize Cart Calculations
    const { itemTotal, deliveryFee, tax, grandTotal } = useMemo(() => {
        const itemTotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
        const deliveryFee = itemTotal > 500 ? 0 : 40; 
        const tax = itemTotal * 0.05; 
        return { itemTotal, deliveryFee, tax, grandTotal: itemTotal + deliveryFee + tax };
    }, [cart]);

    // QR Code URL (Generates real QR for UPI)
    const upiId = "pritamanime-1@okhdfcbank";
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&pn=CraveCart&am=${grandTotal}&cu=INR`;

    useEffect(() => {
        if (!activeOrder?.id) return;
        const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'orders', activeOrder.id), (doc) => {
             if(doc.exists()) setActiveOrder(prev => ({...prev, ...doc.data()}));
        });
        return () => unsub();
    }, [activeOrder?.id]);

    const placeOrder = async () => {
        if (!deliveryAddress) { alert("Please enter delivery address"); return; }
        
        const order = { 
            items: cart, total: grandTotal, 
            restaurantId: selectedRestaurant.id, restaurantName: selectedRestaurant.name, 
            userId: user.uid, status: 'placed', createdAt: serverTimestamp(), 
            customerName: user.displayName || 'Customer', address: deliveryAddress, driverId: null,
            paymentMethod: paymentMethod 
        };
        const res = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), order);
        setCart([]); setActiveOrder({id: res.id, ...order}); setView('tracking');
    };

    const addToCart = useCallback((item, rId) => {
        setCart(p => { 
            if (p.length > 0 && p[0].restaurantId !== rId) { if(!confirm("Start a new basket?")) return p; return [{...item,qty:1,restaurantId:rId}]; }
            const ex = p.find(i=>i.id===item.id); 
            return ex ? p.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i) : [...p,{...item,qty:1,restaurantId:rId}];
        });
    }, []);

    if (!isLoggedIn) return <SecureAuth type="customer" onSuccess={(u) => setIsLoggedIn(true)} onBack={onBack} />;

    return (
        <div className="animate-fade-in will-change-transform">
            {view === 'home' && (
                <>
                    {activeOrder && (
                        <div onClick={() => setView('tracking')} className="bg-blue-600 text-white p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center cursor-pointer hover:bg-blue-700 transition transform hover:scale-[1.01]">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg animate-pulse"><Clock className="w-5 h-5"/></div>
                                <div><div className="font-bold">Order in Progress</div><div className="text-sm opacity-90">{activeOrder.restaurantName} • {activeOrder.status.replace(/_/g, ' ')}</div></div>
                            </div>
                            <ChevronRight className="w-5 h-5"/>
                        </div>
                    )}
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Restaurants Near You</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {MOCK_RESTAURANTS.map(r => (
                        <div key={r.id} onClick={()=>{setSelectedRestaurant(r);setView('restaurant')}} className="bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl transition duration-300 overflow-hidden group hover:-translate-y-1">
                            <div className="relative h-48 overflow-hidden"><img src={r.image} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700"/><div className="absolute bottom-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">{r.time}</div></div>
                            <div className="p-5"><h3 className="font-bold text-xl text-gray-900">{r.name}</h3><p className="text-gray-500 text-sm">{r.cuisine}</p></div>
                        </div>
                        ))}
                    </div>
                </>
            )}

            {view === 'restaurant' && selectedRestaurant && (
                <div className="animate-slide-up will-change-transform">
                    <button onClick={() => setView('home')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-orange-600 font-medium transition-colors"><ArrowLeft className="w-4 h-4"/> Back</button>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 flex gap-8 items-start">
                        <img src={selectedRestaurant.image} loading="lazy" className="w-24 h-24 rounded-2xl object-cover" />
                        <div><h1 className="text-3xl font-bold mb-2 text-gray-900">{selectedRestaurant.name}</h1><p className="text-gray-500">{selectedRestaurant.cuisine}</p></div>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Menu</h2>
                    <div className="grid gap-4">{selectedRestaurant.menu.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center transition hover:border-orange-200">
                            <div><h3 className="font-bold text-lg">{item.name}</h3><div className="font-bold text-gray-900">₹{item.price}</div></div>
                            <button onClick={()=>addToCart(item, selectedRestaurant.id)} className="bg-orange-50 text-orange-600 w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-orange-600 hover:text-white"><Plus className="w-5 h-5"/></button>
                        </div>
                    ))}</div>
                    {cart.length > 0 && <button onClick={()=>setView('cart')} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md bg-gray-900 text-white p-4 rounded-2xl font-bold shadow-2xl flex justify-between transform transition hover:scale-105"><span>View Cart ({cart.reduce((a,b)=>a+b.qty,0)})</span><span>₹{grandTotal.toFixed(2)}</span></button>}
                </div>
            )}

            {view === 'cart' && (
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100 animate-slide-up grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <button onClick={() => setView('restaurant')} className="mb-6 flex items-center gap-2 text-gray-500"><ArrowLeft className="w-4 h-4"/> Back</button>
                        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
                        <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-2xl">
                            {cart.map(i => (<div key={i.id} className="flex justify-between font-bold text-gray-700"><span>{i.qty}x {i.name}</span><span>₹{(i.price*i.qty).toFixed(2)}</span></div>))}
                            <div className="border-t border-dashed border-gray-300 my-4 pt-4 space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between"><span>Item Total</span><span>₹{itemTotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
                                <div className="flex justify-between"><span>GST (5%)</span><span>₹{tax.toFixed(2)}</span></div>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-4"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
                        </div>
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Delivery Address</label>
                            <textarea value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} placeholder="Full address (House No, Area, City)..." className="w-full mt-2 p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5"/> Payment Method</h2>
                        
                        <div className="space-y-4 mb-8">
                            <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod==='upi'?'border-orange-500 bg-orange-50':'border-gray-200 bg-white'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="pay" checked={paymentMethod==='upi'} onChange={()=>setPaymentMethod('upi')} className="accent-orange-600 w-5 h-5" />
                                    <div>
                                        <div className="font-bold text-gray-900 flex items-center gap-2"><QrCode className="w-4 h-4"/> UPI / QR Code</div>
                                        <div className="text-xs text-gray-500">Scan to pay securely</div>
                                    </div>
                                </div>
                            </label>

                            <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod==='cod'?'border-green-500 bg-green-50':'border-gray-200 bg-white'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="pay" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} className="accent-green-600 w-5 h-5" />
                                    <div>
                                        <div className="font-bold text-gray-900 flex items-center gap-2"><Banknote className="w-4 h-4"/> Cash on Delivery</div>
                                        <div className="text-xs text-gray-500">Pay cash to driver</div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {paymentMethod === 'upi' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center mb-6">
                                <p className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">Scan with any UPI App</p>
                                <img src={qrCodeUrl} alt="UPI QR" className="w-48 h-48 mx-auto rounded-lg border-2 border-gray-100 mb-4"/>
                                <div className="bg-gray-100 py-2 px-4 rounded-lg inline-block">
                                    <p className="text-xs text-gray-500">UPI ID</p>
                                    <p className="font-mono font-bold text-gray-800 text-sm select-all">{upiId}</p>
                                </div>
                            </div>
                        )}

                        <button onClick={placeOrder} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-orange-700 transition transform active:scale-95 flex items-center justify-center gap-2">
                            {paymentMethod === 'upi' ? 'I have Paid' : 'Place Order'} <ChevronRight className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}

            {view === 'tracking' && activeOrder && (
                <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-slide-up">
                    <div className="bg-gray-900 text-white p-8 text-center">
                         <div className="text-5xl font-black mb-2">25 min</div>
                         <div className="font-bold text-lg capitalize">{activeOrder.status.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="p-8">
                         {activeOrder.driverName ? <div className="bg-green-50 p-4 rounded-2xl border border-green-100 mb-6 flex gap-3 text-green-700 font-bold"><Bike/> {activeOrder.driverName} is delivering</div> : <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 flex gap-3 text-gray-500">Matching Driver...</div>}
                         <button onClick={()=>{setActiveOrder(null);setView('home')}} className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition">New Order</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- PORTAL 2: RESTAURANT ---
function RestaurantPortal({ user, onBack }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [orders, setOrders] = useState([]);
    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    useEffect(() => {
       const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('createdAt', 'desc'));
       const unsub = onSnapshot(q, (snapshot) => setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
       return () => unsub();
    }, []);
    
    const update = async (id, s) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', id), { status: s });
    
    // Memoized filters for performance
    const newOrders = useMemo(() => orders.filter(o => o.status === 'placed'), [orders]);
    const activeOrders = useMemo(() => orders.filter(o=>['cooking','out_for_delivery'].includes(o.status)), [orders]);

    if (!isLoggedIn) return <SecureAuth type="restaurant" onSuccess={(u) => setIsLoggedIn(true)} onBack={onBack} />;

    return (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8 will-change-transform">
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Incoming Orders {newOrders.length > 0 && <span className="text-red-500">({newOrders.length})</span>}</h2>
                {newOrders.map(o => (
                    <div key={o.id} className="bg-white border-l-4 border-orange-500 shadow-sm p-6 rounded-r-xl flex justify-between items-center transition hover:shadow-md">
                        <div>
                            <h3 className="text-xl font-bold">#{o.id.slice(0,5)} • {o.customerName}</h3>
                            <div className="text-gray-500">{o.items.length} Items</div>
                            <div className="text-xs font-bold text-gray-600 mt-1 uppercase">{o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</div>
                        </div>
                        <button onClick={()=>update(o.id, 'cooking')} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition transform active:scale-95">Accept</button>
                    </div>
                ))}
                {newOrders.length === 0 && <div className="text-center py-10 text-gray-400">No new orders.</div>}
            </div>
            <div>
                 <h2 className="text-2xl font-bold mb-6">Kitchen Status</h2>
                 {activeOrders.map(o=>(
                     <div key={o.id} className="bg-white p-4 rounded-xl border mb-3 flex justify-between shadow-sm">
                         <span className="font-bold">#{o.id.slice(0,5)}</span>
                         <span className="px-2 py-1 bg-gray-100 rounded text-xs uppercase font-bold">{o.status}</span>
                     </div>
                 ))}
            </div>
        </div>
    );
}

// --- PORTAL 3: DRIVER ---
function DriverPortal({ user, onBack }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [available, setAvailable] = useState([]);
    const [active, setActive] = useState(null);
    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    useEffect(() => {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAvailable(all.filter(o => o.status === 'cooking' && !o.driverId));
            setActive(all.find(o => o.driverId === user?.uid && o.status !== 'delivered'));
        });
        return () => unsub();
    }, [user]);

    const accept = async (id) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', id), { driverId: user.uid, driverName: user.displayName });
    const update = async (id, s) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', id), { status: s });

    if (!isLoggedIn) return <SecureAuth type="driver" onSuccess={(u) => setIsLoggedIn(true)} onBack={onBack} />;

    return (
        <div className="animate-fade-in max-w-2xl mx-auto will-change-transform">
            {active ? (
                <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl transform transition-all duration-500">
                    <h2 className="text-2xl font-bold mb-4">Current Delivery</h2>
                    <div className="mb-6"><div className="font-bold opacity-70 uppercase text-xs">Pickup</div><div className="text-xl font-bold">{active.restaurantName}</div></div>
                    <div className="mb-8"><div className="font-bold opacity-70 uppercase text-xs">Dropoff</div><div className="text-xl font-bold">{active.address}</div></div>
                    
                    {active.paymentMethod === 'cod' && (
                        <div className="bg-white text-red-600 p-4 rounded-xl font-bold text-center mb-6 shadow-md">
                            Collect ₹{active.total.toFixed(2)} Cash
                        </div>
                    )}

                    {active.status==='cooking' && <button onClick={()=>update(active.id,'out_for_delivery')} className="w-full bg-white text-blue-600 py-4 rounded-xl font-bold hover:bg-gray-50 transition transform active:scale-95">Confirm Pickup</button>}
                    {active.status==='out_for_delivery' && <button onClick={()=>update(active.id,'delivered')} className="w-full bg-green-400 text-green-900 py-4 rounded-xl font-bold hover:bg-green-300 transition transform active:scale-95">Complete Delivery</button>}
                </div>
            ) : (
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-500 uppercase text-sm">Nearby Jobs ({available.length})</h3>
                    {available.map(o => (
                        <div key={o.id} className="bg-white p-6 rounded-2xl border hover:border-blue-500 shadow-sm transition duration-200">
                            <div className="flex justify-between font-bold text-lg mb-2"><span>{o.restaurantName}</span><span>₹{o.total}</span></div>
                            <div className="text-gray-500 text-sm mb-4">{o.address}</div>
                            <button onClick={()=>accept(o.id)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition transform active:scale-95">Accept Job</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- PORTAL 4: ADMIN (MANAGE ACCESS) ---
function AdminPortal({ user, onBack }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [tab, setTab] = useState('overview'); 
    const [orders, setOrders] = useState([]);
    const [partners, setPartners] = useState([]);
    const [newPartnerName, setNewPartnerName] = useState('');
    const [newPartnerUser, setNewPartnerUser] = useState('');
    const [newPartnerPass, setNewPartnerPass] = useState('');
    const [newPartnerRole, setNewPartnerRole] = useState('restaurant');

    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    useEffect(() => {
       const q1 = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('createdAt', 'desc'));
       const unsub1 = onSnapshot(q1, (snapshot) => setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
       
       const q2 = query(collection(db, 'artifacts', appId, 'public', 'data', 'partners'));
       const unsub2 = onSnapshot(q2, (snapshot) => setPartners(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
       
       return () => { unsub1(); unsub2(); };
    }, []);

    // Memoize Stats
    const stats = useMemo(() => ({
        revenue: orders.reduce((s,o)=>s+(o.total||0),0).toFixed(2),
        totalOrders: orders.length
    }), [orders]);

    const createPartner = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'partners'), {
                name: newPartnerName, username: newPartnerUser, password: newPartnerPass, role: newPartnerRole, createdAt: serverTimestamp()
            });
            setNewPartnerName(''); setNewPartnerUser(''); setNewPartnerPass('');
            alert("Partner Account Created Successfully!");
        } catch(e) { console.error(e); alert("Error creating partner"); }
    };

    const deletePartner = async (id) => {
        if(confirm("Revoke access for this partner?")) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'partners', id));
        }
    }

    if (!isLoggedIn) return <SecureAuth type="admin" onSuccess={(u) => setIsLoggedIn(true)} onBack={onBack} />;

    return (
        <div className="animate-fade-in will-change-transform">
            <div className="flex gap-4 mb-8">
                <button onClick={()=>setTab('overview')} className={`px-4 py-2 rounded-lg font-bold transition-all ${tab==='overview'?'bg-gray-900 text-white shadow-lg':'bg-white text-gray-500 hover:bg-gray-50'}`}>Overview</button>
                <button onClick={()=>setTab('partners')} className={`px-4 py-2 rounded-lg font-bold transition-all ${tab==='partners'?'bg-gray-900 text-white shadow-lg':'bg-white text-gray-500 hover:bg-gray-50'}`}>Manage Partners</button>
            </div>

            {tab === 'overview' && (
                <div>
                     <h1 className="text-3xl font-bold mb-8">Business Overview</h1>
                     <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border shadow-sm transform hover:-translate-y-1 transition"><div className="text-sm text-gray-500 uppercase font-bold">Revenue</div><div className="text-3xl font-bold text-gray-900">₹{stats.revenue}</div></div>
                        <div className="bg-white p-6 rounded-2xl border shadow-sm transform hover:-translate-y-1 transition"><div className="text-sm text-gray-500 uppercase font-bold">Total Orders</div><div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div></div>
                     </div>
                     <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 font-bold text-gray-500"><tr><th className="p-4">ID</th><th className="p-4">Status</th><th className="p-4 text-right">$$</th></tr></thead>
                            <tbody className="divide-y">{orders.map(o=>(<tr key={o.id} className="hover:bg-gray-50 transition"><td className="p-4">#{o.id.slice(0,4)}</td><td className="p-4">{o.status}</td><td className="p-4 text-right">₹{o.total.toFixed(2)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'partners' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit">
                        <h2 className="text-xl font-bold mb-4">Add New Partner</h2>
                        <form onSubmit={createPartner} className="space-y-4">
                            <div><label className="text-xs font-bold uppercase text-gray-500">Business Name / Driver Name</label><input className="w-full p-3 border rounded-xl" value={newPartnerName} onChange={e=>setNewPartnerName(e.target.value)} required /></div>
                            <div><label className="text-xs font-bold uppercase text-gray-500">Username</label><input className="w-full p-3 border rounded-xl" value={newPartnerUser} onChange={e=>setNewPartnerUser(e.target.value)} required /></div>
                            <div><label className="text-xs font-bold uppercase text-gray-500">Password</label><input className="w-full p-3 border rounded-xl" value={newPartnerPass} onChange={e=>setNewPartnerPass(e.target.value)} required /></div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">Role</label>
                                <select className="w-full p-3 border rounded-xl" value={newPartnerRole} onChange={e=>setNewPartnerRole(e.target.value)}>
                                    <option value="restaurant">Restaurant Partner</option>
                                    <option value="driver">Delivery Driver</option>
                                </select>
                            </div>
                            <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition transform active:scale-95">Create Account</button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Authorized Partners</h2>
                        {partners.length === 0 && <p className="text-gray-400">No partners created yet.</p>}
                        {partners.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                                <div>
                                    <div className="font-bold text-lg">{p.name}</div>
                                    <div className="text-xs text-gray-500 uppercase font-bold flex gap-2">
                                        <span className={p.role==='restaurant'?'text-orange-600':'text-blue-600'}>{p.role}</span>
                                        <span>• User: {p.username}</span>
                                    </div>
                                </div>
                                <button onClick={()=>deletePartner(p.id)} className="text-red-500 text-sm font-bold hover:underline">Revoke</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


