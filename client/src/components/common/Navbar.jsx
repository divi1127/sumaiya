import { useState, useEffect } from 'react';
import logoImg from '../../assets/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Tag,
  LayoutDashboard,
  History,
} from 'lucide-react';
import { logoutUser } from '../../redux/slices/authSlice';
import { setFilters } from '../../redux/slices/productSlice';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { darkTheme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilters({ keyword: searchVal }));
    
    // Redirect to listings if not there
    if (location.pathname !== '/products') {
      navigate('/products');
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setDropdownOpen(false);
    navigate('/login');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setDropdownOpen(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-black/10 dark:border-white/10 bg-white/60 dark:bg-slate-950/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-yellow-500/8 blur-3xl rounded-full gold-glow"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-400/8 blur-3xl rounded-full gold-glow"></div>
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="relative w-14 h-14 rounded-full overflow-hidden">
                <img src={logoImg} alt="SUMAIYA 99" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="hidden sm:block">
              <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                SUMAIYA 99
              </h1>
              <p className="text-[11px] uppercase tracking-[4px] text-slate-500 dark:text-slate-400">
                Premium Fashion Store
              </p>
            </div>
          </Link>

          <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-2xl mx-10">
            <div className="relative w-full group">
              <div className="absolute inset-0 bg-linear-to-r from-amber-500/20 to-brand-gold/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative flex justify-center items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full p-4 pl-12 pr-28 rounded-2xl border border-black/20 dark:border-white/20 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4">
              <Link
                to="/products"
                className="px-4 py-2 rounded-xl text-md font-medium text-slate-700 dark:text-slate-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-300"
              >
                Shop
              </Link>
              <Link
                to="/offers"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-md font-medium text-slate-700 dark:text-slate-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-300"
              >
                <Tag className="w-4 h-4" />
                Offers
              </Link>
            </div>

            <button
              onClick={toggleTheme}
              className="group relative p-3 rounded-2xl border border-black/20 dark:border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-amber-400/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition"></div>
              {darkTheme ? (
                <Sun className="relative w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="relative w-5 h-5 text-slate-700 dark:text-slate-200" />
              )}
            </button>

            <Link
              to="/wishlist"
              className="group relative p-3 rounded-2xl border border-black/20 dark:border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:scale-105 transition-all duration-300"
            >
              <Heart className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:text-rose-500 transition" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1 rounded-full bg-linear-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="group relative p-3 rounded-2xl border border-black/20 dark:border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:scale-105 transition-all duration-300"
            >
              <ShoppingBag className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:text-yellow-500 transition" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-bold flex items-center justify-center shadow-lg">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="relative">
              {user ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(!dropdownOpen);
                    }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 blur-lg opacity-70 group-hover:opacity-100 transition"></div>
                    <div className="relative w-8 h-8 rounded-2xl bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 flex items-center justify-center text-black font-bold shadow-2xl border border-yellow-300/30">
                      {user.name[0]}
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-4 w-72 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.25)] overflow-hidden">
                      <div className="relative p-5 border-b border-slate-200/50 dark:border-slate-800">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-amber-500/10"></div>
                        <div className="relative flex items-center gap-4">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-500 flex items-center justify-center text-black font-bold text-lg">
                            {user.name[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">{user.name}</h3>
                            <p className="text-xs text-slate-500 truncate max-w-42.5">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all duration-300"
                          >
                            <LayoutDashboard className="w-5 h-5 text-yellow-500" />
                            <span className="font-medium">Admin Dashboard</span>
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all duration-300"
                        >
                          <User className="w-5 h-5 text-amber-500" />
                          <span className="font-medium">My Profile</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all duration-300"
                        >
                          <History className="w-5 h-5 text-emerald-500" />
                          <span className="font-medium">Order History</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition-all duration-300"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="relative overflow-hidden px-6 py-3 rounded-2xl text-black dark:text-white font-semibold shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Login
                  </span>
                  <div className="absolute inset-0 bg-black/10 dark:bg-white/10 opacity-0 hover:opacity-100 transition"></div>
                </Link>
              )}
            </div>
          </div>

          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10"
            >
              {darkTheme ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-black/10 dark:border-white/10"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden glass-panel border-b border-black/10 dark:border-white/10 dark:border-white/5 bg-white dark:bg-slate-950 shadow-xl px-4 pt-2 pb-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search premium products..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-gold backdrop-blur-sm"
              />
              <Search className="absolute left-3.5 top-2.5 w-5 h-5 text-slate-400" />
            </form>

            <div className="flex flex-col space-y-2.5 pt-2">
              <Link
                to="/products"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              >
                Shop Products
              </Link>
              <Link
                to="/offers"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-2"
              >
                <Tag className="w-4 h-4 text-yellow-500" />
                <span>Special Offers</span>
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex justify-between items-center"
              >
                <span>My Wishlist</span>
                {wishlistItems.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex justify-between items-center"
              >
                <span>My Shopping Cart</span>
                {cartCount > 0 && (
                  <span className="bg-yellow-500 text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
              {user ? (
                <>
                  <div className="h-px bg-slate-150 dark:bg-slate-800 my-1"></div>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-yellow-600 dark:text-yellow-400 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center space-x-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  >
                    Order History
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 text-left text-sm font-medium text-rose-500 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="mx-4 mt-2 py-2 text-center text-sm font-semibold rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
