import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginUser, clearError } from '../../redux/slices/authSlice';
import { useToast } from '../../components/common/ToastContext';
import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { user, loading } = useSelector((state) => state.auth);

  const redirectParam = new URLSearchParams(location.search).get('redirect');

  useEffect(() => {
    dispatch(clearError());
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('expired') === 'true') {
      toast('Your session has expired. Please login again.', 'info');
    }
  }, [dispatch, location.search, toast]);

  useEffect(() => {
    if (user) {
      toast(`Welcome back, ${user.name}!`, 'success');
      if (redirectParam) {
        navigate(`/${redirectParam}`);
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/');
      }
    }
  }, [user, navigate, redirectParam, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter both email and password.', 'error');
      return;
    }
    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (err) {
      toast(err || 'Invalid login credentials.', 'error');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-14">
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] rounded-[2.5rem] p-8 sm:p-10">

          {/* Logo */}
          <div className="text-center mb-10">
            <Link
              to="/"
              className="text-4xl font-black tracking-[0.25em] bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              SUMAIYA'99
            </Link>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-6 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Login to continue your premium shopping experience.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100 font-bold">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  placeholder="user@ecommerce.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 transition-all"
                />
                 <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-900 dark:text-slate-400 group-focus-within:text-yellow-400 transition-colors" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100 font-bold">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl pl-12 pr-12 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 transition-all"
                />
                <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-900 dark:text-slate-400 group-focus-within:text-yellow-400 transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-slate-900 dark:text-slate-400 hover:text-yellow-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 text-black font-black tracking-wide shadow-[0_10px_40px_rgba(212,175,55,0.35)] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <LogIn className="w-5 h-5" />
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?
            </p>
            <Link
              to={`/register${redirectParam ? `?redirect=${redirectParam}` : ''}`}
                className="mt-3 inline-flex items-center gap-2 text-yellow-500 font-bold hover:text-yellow-400 transition-colors"
            >
              Create Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
