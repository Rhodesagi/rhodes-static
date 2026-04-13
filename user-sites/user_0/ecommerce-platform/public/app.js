// Multi-Store E-Commerce Platform - Frontend Application
// Built with React and Tailwind CSS

const { useState, useEffect, useCallback, createContext, useContext } = React;
const { BrowserRouter, Routes, Route, Link, useParams, useNavigate, Navigate } = window.ReactRouterDOM;

// API Base URL
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

// ==================== CONTEXTS ====================

const AuthContext = createContext(null);
const CartContext = createContext(null);

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async (token) => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                localStorage.removeItem('token');
            }
        } catch (err) {
            console.error('Auth error:', err);
            localStorage.removeItem('token');
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            setUser(data.user);
            return { success: true };
        }
        return { success: false, error: data.error };
    };

    const register = async (email, password, fullName, role) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName, role })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            setUser(data.user);
            return { success: true };
        }
        return { success: false, error: data.error };
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

function CartProvider({ children }) {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [guestCart, setGuestCart] = useState([]);

    // Load guest cart from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('guestCart');
        if (saved) {
            setGuestCart(JSON.parse(saved));
        }
    }, []);

    // Save guest cart to localStorage
    useEffect(() => {
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
    }, [guestCart]);

    // Merge guest cart on login
    useEffect(() => {
        if (user && guestCart.length > 0) {
            mergeGuestCart();
        }
    }, [user]);

    const mergeGuestCart = async () => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/cart/merge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items: guestCart })
            });
            setGuestCart([]);
            fetchCart();
        } catch (err) {
            console.error('Merge cart error:', err);
        }
    };

    const fetchCart = async () => {
        if (!user) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCart(data);
            }
        } catch (err) {
            console.error('Fetch cart error:', err);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [user]);

    const addToCart = async (product, store, quantity = 1) => {
        if (!user) {
            // Add to guest cart
            const existing = guestCart.find(item => item.productId === product.id);
            if (existing) {
                existing.quantity += quantity;
                setGuestCart([...guestCart]);
            } else {
                setGuestCart([...guestCart, {
                    productId: product.id,
                    quantity,
                    storeId: store.id
                }]);
            }
            return { success: true };
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: product.id,
                quantity,
                storeId: store.id
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            setCart(data);
            return { success: true };
        }
        const error = await res.json();
        return { success: false, error: error.error };
    };

    const removeFromCart = async (itemId) => {
        if (!user) {
            setGuestCart(guestCart.filter(item => item.cartItemId !== itemId));
            return;
        }
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/cart/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchCart();
    };

    const updateQuantity = async (itemId, quantity) => {
        if (!user) return;
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/cart/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity })
        });
        fetchCart();
    };

    const cartCount = user ? cart.items.length : guestCart.length;

    return (
        <CartContext.Provider value={{ 
            cart, 
            guestCart, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            cartCount,
            fetchCart 
        }}>
            {children}
        </CartContext.Provider>
    );
}

// ==================== COMPONENTS ====================

function Layout({ children }) {
    const { user, logout } = useContext(AuthContext);
    const { cartCount } = useContext(CartContext);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="text-xl font-bold text-indigo-600">
                                MultiStore
                            </Link>
                            <Link to="/stores" className="ml-6 text-gray-600 hover:text-gray-900">
                                Browse Stores
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <Link to="/cart" className="relative text-gray-600 hover:text-gray-900">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {cartCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>
                                    {user.role === 'merchant' && (
                                        <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                                            Merchant Dashboard
                                        </Link>
                                    )}
                                    <span className="text-sm text-gray-600">{user.fullName}</span>
                                    <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                                    <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}

function Home() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/stores`)
            .then(res => res.json())
            .then(data => {
                setStores(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div>
            <div className="text-center py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to MultiStore
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Discover amazing products from independent merchants
                </p>
            </div>

            <h2 className="text-2xl font-semibold mb-6">Featured Stores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stores.map(store => (
                    <Link key={store.id} to={`/store/${store.slug}`} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-lg"></div>
                        <div className="p-6">
                            <h3 className="text-xl font-semibold">{store.name}</h3>
                            <p className="text-gray-600 mt-2 line-clamp-2">{store.description}</p>
                            <div className="mt-4 text-sm text-gray-500">
                                By {store.owner_name}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function StoreList() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/stores`)
            .then(res => res.json())
            .then(data => {
                setStores(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">All Stores</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stores.map(store => (
                    <Link key={store.id} to={`/store/${store.slug}`} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                        <div className="h-32 bg-gradient-to-r from-blue-500 to-teal-500 rounded-t-lg"></div>
                        <div className="p-6">
                            <h3 className="text-xl font-semibold">{store.name}</h3>
                            <p className="text-gray-600 mt-2">{store.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function StoreView() {
    const { storeSlug } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useContext(CartContext);
    const [addedId, setAddedId] = useState(null);

    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/stores/by-slug/${storeSlug}`).then(r => r.json()),
            fetch(`${API_URL}/products/store/${storeSlug}`).then(r => r.json())
        ]).then(([storeData, productsData]) => {
            setStore(storeData);
            setProducts(productsData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [storeSlug]);

    const handleAddToCart = async (product) => {
        const result = await addToCart(product, store);
        if (result.success) {
            setAddedId(product.id);
            setTimeout(() => setAddedId(null), 1500);
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (!store) return <div className="text-center py-8">Store not found</div>;

    return (
        <div>
            <div className="bg-white rounded-lg shadow p-8 mb-8">
                <h1 className="text-3xl font-bold">{store.name}</h1>
                <p className="text-gray-600 mt-2">{store.description}</p>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                        <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                            {product.images?.length > 0 ? (
                                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover rounded-t-lg" />
                            ) : (
                                <span className="text-gray-400">No image</span>
                            )}
                        </div>
                        <div className="p-4">
                            <Link to={`/product/${product.id}`} className="text-lg font-semibold hover:text-indigo-600">
                                {product.name}
                            </Link>
                            <p className="text-gray-600 text-sm line-clamp-2 mt-1">{product.description}</p>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xl font-bold">${product.price}</span>
                                <button 
                                    onClick={() => handleAddToCart(product)}
                                    disabled={product.stock === 0}
                                    className={`px-4 py-2 rounded ${
                                        product.stock === 0 
                                            ? 'bg-gray-300 cursor-not-allowed' 
                                            : addedId === product.id
                                                ? 'bg-green-500 text-white'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    {product.stock === 0 ? 'Out of Stock' : addedId === product.id ? 'Added!' : 'Add to Cart'}
                                </button>
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                                {product.stock} in stock
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Cart() {
    const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Please login to view your cart</p>
                <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                    Login
                </Link>
            </div>
        );
    }

    if (cart.items.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Your cart is empty</p>
                <Link to="/stores" className="text-indigo-600 hover:text-indigo-800">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    // Group items by store
    const byStore = cart.items.reduce((acc, item) => {
        const storeId = item.store.id;
        if (!acc[storeId]) acc[storeId] = { store: item.store, items: [], total: 0 };
        acc[storeId].items.push(item);
        acc[storeId].total += item.subtotal;
        return acc;
    }, {});

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
            
            {Object.values(byStore).map(({ store, items, total }) => (
                <div key={store.id} className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                        <Link to={`/store/${store.slug}`} className="font-semibold text-lg">
                            {store.name}
                        </Link>
                    </div>
                    <div className="divide-y">
                        {items.map(item => (
                            <div key={item.cartItemId} className="p-4 flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                                    {item.product.images?.length > 0 ? (
                                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded" />
                                    ) : (
                                        <span className="text-xs text-gray-400">No image</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold">{item.product.name}</h4>
                                    <p className="text-gray-600">${item.product.price.toFixed(2)} each</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                        className="w-8 h-8 border rounded hover:bg-gray-100"
                                    >-</button>
                                    <span className="w-12 text-center">{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                        className="w-8 h-8 border rounded hover:bg-gray-100"
                                    >+</button>
                                </div>
                                <div className="text-right min-w-[80px]">
                                    <div className="font-semibold">${item.subtotal.toFixed(2)}</div>
                                </div>
                                <button 
                                    onClick={() => removeFromCart(item.cartItemId)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-between items-center">
                        <span className="font-semibold">Store Total: ${total.toFixed(2)}</span>
                        <button 
                            onClick={() => navigate('/checkout', { state: { storeId: store.id, total } })}
                            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            ))}
            
            <div className="text-right">
                <div className="text-2xl font-bold mb-4">
                    Total: ${cart.total.toFixed(2)}
                </div>
            </div>
        </div>
    );
}

function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(form.email, form.password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
                <h1 className="text-2xl font-bold mb-6">Login</h1>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                            type="email"
                            value={form.email}
                            onChange={e => setForm({...form, email: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input 
                            type="password"
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                        Login
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Don't have an account? <Link to="/register" className="text-indigo-600">Register</Link>
                </p>
            </div>
        </div>
    );
}

function Register() {
    const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'customer' });
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await register(form.email, form.password, form.fullName, form.role);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
                <h1 className="text-2xl font-bold mb-6">Register</h1>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input 
                            type="text"
                            value={form.fullName}
                            onChange={e => setForm({...form, fullName: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                            type="email"
                            value={form.email}
                            onChange={e => setForm({...form, email: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input 
                            type="password"
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Account Type</label>
                        <select 
                            value={form.role}
                            onChange={e => setForm({...form, role: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="customer">Customer - Shop for products</option>
                            <option value="merchant">Merchant - Sell products</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                        Register
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-indigo-600">Login</Link>
                </p>
            </div>
        </div>
    );
}

function MerchantDashboard() {
    const { user } = useContext(AuthContext);
    const [stores, setStores] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/stores/my/stores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => setStores(data));
    }, [user]);

    if (!user || user.role !== 'merchant') {
        return <Navigate to="/" />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
                <Link to="/create-store" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Create New Store
                </Link>
            </div>

            {stores.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600 mb-4">You don't have any stores yet</p>
                    <Link to="/create-store" className="text-indigo-600 hover:text-indigo-800">
                        Create your first store
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stores.map(store => (
                        <div key={store.id} className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold">{store.name}</h3>
                            <p className="text-gray-600 mt-2">{store.description}</p>
                            <div className="mt-4 flex gap-2">
                                <Link 
                                    to={`/manage-products/${store.id}`}
                                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                                >
                                    Products
                                </Link>
                                <Link 
                                    to={`/manage-orders/${store.id}`}
                                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                                >
                                    Orders
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function CreateStore() {
    const [form, setForm] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/stores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(form)
        });
        
        if (res.ok) {
            navigate('/dashboard');
        } else {
            const data = await res.json();
            setError(data.error);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Store</h1>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Store Name</label>
                    <input 
                        type="text"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                        className="w-full border rounded px-3 py-2"
                        rows={4}
                    />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                    Create Store
                </button>
            </form>
        </div>
    );
}

function ManageProducts() {
    const { storeId } = useParams();
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', sku: '' });
    const navigate = useNavigate();

    const fetchProducts = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/products/store/${storeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setProducts(data);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [storeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ...form,
                storeId,
                price: parseFloat(form.price),
                stock: parseInt(form.stock)
            })
        });
        
        if (res.ok) {
            setShowForm(false);
            setForm({ name: '', description: '', price: '', stock: '', sku: '' });
            fetchProducts();
        }
    };

    const deleteProduct = async (productId) => {
        if (!confirm('Delete this product?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchProducts();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manage Products</h1>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    {showForm ? 'Cancel' : 'Add Product'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input 
                                type="text"
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">SKU</label>
                            <input 
                                type="text"
                                value={form.sku}
                                onChange={e => setForm({...form, sku: e.target.value})}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea 
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Price ($)</label>
                            <input 
                                type="number"
                                step="0.01"
                                value={form.price}
                                onChange={e => setForm({...form, price: e.target.value})}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Stock</label>
                            <input 
                                type="number"
                                value={form.stock}
                                onChange={e => setForm({...form, stock: e.target.value})}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                        Create Product
                    </button>
                </form>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Product</th>
                            <th className="px-4 py-3 text-left">SKU</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Stock</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.map(product => (
                            <tr key={product.id}>
                                <td className="px-4 py-3">
                                    <div className="font-semibold">{product.name}</div>
                                    <div className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</div>
                                </td>
                                <td className="px-4 py-3">{product.sku || '-'}</td>
                                <td className="px-4 py-3 text-right">${product.price}</td>
                                <td className="px-4 py-3 text-right">{product.stock}</td>
                                <td className="px-4 py-3 text-center">
                                    <button 
                                        onClick={() => deleteProduct(product.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ManageOrders() {
    const { storeId } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/orders/store/${storeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setOrders(data.orders);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [storeId]);

    const updateStatus = async (orderId, status) => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        fetchOrders();
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Order</th>
                            <th className="px-4 py-3 text-left">Customer</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Date</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td className="px-4 py-3 font-mono text-sm">{order.id.substring(0, 8)}...</td>
                                <td className="px-4 py-3">{order.customer_name}</td>
                                <td className="px-4 py-3 text-right">${order.total}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        order.status === 'paid' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <select 
                                        value={order.status}
                                        onChange={(e) => updateStatus(order.id, e.target.value)}
                                        className="text-sm border rounded px-2 py-1"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==================== MAIN APP ====================

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/stores" element={<StoreList />} />
                            <Route path="/store/:storeSlug" element={<StoreView />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={<MerchantDashboard />} />
                            <Route path="/create-store" element={<CreateStore />} />
                            <Route path="/manage-products/:storeId" element={<ManageProducts />} />
                            <Route path="/manage-orders/:storeId" element={<ManageOrders />} />
                        </Routes>
                    </Layout>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);