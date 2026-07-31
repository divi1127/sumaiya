import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { registerUser, clearError } from '../../redux/slices/authSlice';
import { useToast } from '../../components/common/ToastContext';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  UserPlus,
  Phone,
  MapPin,
  Eye,
  EyeOff,
} from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phno, setPhno] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('India');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { user, loading } = useSelector((state) => state.auth);
  const redirectParam = new URLSearchParams(location.search).get('redirect');

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      toast(`Registration successful! Welcome ${user.name}`, 'success');
      if (redirectParam) {
        navigate(`/${redirectParam}`);
      } else {
        navigate('/');
      }
    }
  }, [user, navigate, redirectParam, toast]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phno || !street || !city || !state || !zipCode || !password || !confirmPassword) {
      toast('Please fill all fields.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      toast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      toast('Password must contain at least 6 characters.', 'error');
      return;
    }
    const address = { street, city, state, zipCode, country };
    try {
      await dispatch(registerUser({ name, email, phno, address, password })).unwrap();
      navigate('/login');
    } catch (err) {
      toast(err || 'Registration failed. Try again.', 'error');
    }
  };

  const inputClass = "w-full h-14 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 transition-all";
  const inputNoIconClass = "w-full h-14 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl px-4 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 transition-all";
  const labelClass = "text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100 font-bold";
  const iconClass = "absolute left-4 top-4 w-5 h-5 text-slate-900 dark:text-slate-400 group-focus-within:text-yellow-400 transition-colors";

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-14">
      <div className="relative z-10 w-full max-w-5xl">
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
              Create Account
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">
              Start your premium shopping experience today.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleRegisterSubmit} className="space-y-6">

            {/* Personal & Address fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* NAME */}
              <div className="space-y-2">
                <label className={labelClass}>Full Name</label>
                <div className="relative group">
                  <input type="text" placeholder="Senthil Kumar" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  <User className={iconClass} />
                </div>
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <label className={labelClass}>Email Address</label>
                <div className="relative group">
                  <input type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  <Mail className={iconClass} />
                </div>
              </div>

              {/* PHONE */}
              <div className="space-y-2">
                <label className={labelClass}>Phone Number</label>
                <div className="relative group">
                  <input type="text" placeholder="+91 9876543210" value={phno} onChange={(e) => setPhno(e.target.value)} className={inputClass} />
                  <Phone className={iconClass} />
                </div>
              </div>

              {/* STREET */}
              <div className="space-y-2">
                <label className={labelClass}>Street Address</label>
                <div className="relative group">
                  <input type="text" placeholder="123 Main Street" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
                  <MapPin className={iconClass} />
                </div>
              </div>

              {/* CITY */}
              <div className="space-y-2">
                <label className={labelClass}>City</label>
                <input type="text" placeholder="Chennai" value={city} onChange={(e) => setCity(e.target.value)} className={inputNoIconClass} />
              </div>

              {/* STATE */}
              <div className="space-y-2">
                <label className={labelClass}>State</label>
                <input type="text" placeholder="Tamil Nadu" value={state} onChange={(e) => setState(e.target.value)} className={inputNoIconClass} />
              </div>

              {/* ZIP */}
              <div className="space-y-2">
                <label className={labelClass}>Zip Code</label>
                <input type="text" placeholder="600001" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={inputNoIconClass} />
              </div>

              {/* COUNTRY */}
              <div className="space-y-2">
                <label className={labelClass}>Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputNoIconClass} />
              </div>

            </div>

            {/* PASSWORDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* PASSWORD */}
              <div className="space-y-2">
                <label className={labelClass}>Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl pl-12 pr-12 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 transition-all"
                  />
                  <Lock className={iconClass} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-900 dark:text-slate-400 hover:text-yellow-400 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-2">
                <label className={labelClass}>Confirm Password</label>
                <div className="relative group">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-14 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl pl-12 pr-12 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 transition-all"
                  />
                  <Lock className={iconClass} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-4 text-slate-900 dark:text-slate-400 hover:text-yellow-400 transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* SUBMIT */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 text-black font-black tracking-wide shadow-[0_10px_40px_rgba(212,175,55,0.35)] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? 'Creating Account...' : 'Create Premium Account'}
              </button>
            </div>

          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?
            </p>
            <Link
              to={`/login${redirectParam ? `?redirect=${redirectParam}` : ''}`}
              className="mt-3 inline-flex items-center gap-2 text-yellow-500 font-bold hover:text-yellow-400 transition-colors"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;