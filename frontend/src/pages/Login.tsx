import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff, ChevronLeft, Zap, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface LoginProps {
  isDark: boolean;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onDemoLogin?: () => Promise<{ success: boolean; error?: string }>;
}

const Login: React.FC<LoginProps> = ({ isDark, onLogin, onDemoLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      let result;
      if (onDemoLogin) {
        result = await onDemoLogin();
      } else {
        result = await onLogin('demo@omniguard.ai', 'demo123');
      }

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Demo login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login error');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleFillDemoCredentials = () => {
    setEmail('demo@omniguard.ai');
    setPassword('demo123');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login handleSubmit called');
    console.log('Email:', email);
    console.log('Password:', password);
    
    setError('');
    setLoading(true);

    const result = await onLogin(email, password);
    console.log('Login result:', result);
    setLoading(false);

    if (result.success) {
      console.log('Login success, navigating to dashboard');
      navigate('/dashboard');
    } else {
      console.log('Login failed:', result.error);
      setError(result.error || 'Invalid email or password');
    }
  };

  const shapes = [
    { type: 'circle', size: 80, color: 'from-primary/40 to-secondary/40', delay: 0 },
    { type: 'hexagon', size: 100, color: 'from-secondary/30 to-accent/30', delay: 0.3 },
    { type: 'square', size: 90, color: 'from-accent/40 to-primary/40', delay: 0.6 },
    { type: 'triangle', size: 110, color: 'from-primary/20 to-secondary/20', delay: 0.9 },
    { type: 'circle', size: 70, color: 'from-accent/30 to-primary/30', delay: 1.2 },
    { type: 'hexagon', size: 85, color: 'from-secondary/20 to-accent/20', delay: 1.5 },
    { type: 'square', size: 105, color: 'from-primary/30 to-accent/30', delay: 1.8 },
    { type: 'triangle', size: 95, color: 'from-secondary/40 to-primary/40', delay: 2.1 },
  ];

  const getShapeClassName = (type: string, color: string) => {
    switch (type) {
      case 'circle':
        return cn('absolute bg-gradient-to-br rounded-full', color);
      case 'square':
        return cn('absolute bg-gradient-to-br rotate-45', color);
      case 'hexagon':
        return cn('absolute bg-gradient-to-br', color);
      case 'triangle':
        return cn('absolute bg-gradient-to-br', color);
      default:
        return cn('absolute bg-gradient-to-br rounded-full', color);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 lg:p-8">
      <div className="absolute inset-0 overflow-hidden">
        {shapes.map((shape, i) => (
          <motion.div
            key={i}
            className={getShapeClassName(shape.type, shape.color)}
            style={{
              width: shape.size,
              height: shape.size,
              left: `${5 + i * 12}%`,
              top: `${5 + (i % 4) * 25}%`,
              clipPath: shape.type === 'hexagon' 
                ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' 
                : shape.type === 'triangle' 
                ? 'polygon(50% 0%, 0% 100%, 100% 100%)' 
                : 'none',
            }}
            animate={{
              x: [0, 60, -40, 0],
              y: [0, -40, 50, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.15, 0.85, 1],
            }}
            transition={{
              duration: 10 + i * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: shape.delay,
            }}
          />
        ))}
      </div>

      <Link 
        to="/" 
        className="absolute top-8 left-8 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1, x: -4 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'p-3 rounded-2xl flex items-center gap-2',
            isDark 
              ? 'bg-slate-800/80 hover:bg-slate-700' 
              : 'bg-white/80 hover:bg-white'
          )}
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="font-bold">Back to Home</span>
        </motion.button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className={cn(
          'w-full max-w-5xl mx-4 rounded-3xl overflow-hidden shadow-2xl relative z-10',
          isDark 
            ? 'bg-card' 
            : 'bg-white'
        )}
      >
        <div className="grid lg:grid-cols-2">
          <div className={cn(
            'p-8 lg:p-16 flex flex-col justify-between',
            isDark 
              ? 'bg-gradient-to-br from-primary/5 to-secondary/5' 
              : 'bg-gradient-to-br from-primary/5 to-secondary/5'
          )}>
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 mb-10"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight">
                  Omni <span className="gradient-text">Guard AI</span>
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className={cn(
                  'text-4xl md:text-5xl font-black mb-6 leading-tight',
                  isDark ? 'text-white' : 'text-slate-900'
                )}>
                  Sign In to
                  <span className="gradient-text"> Omni Guard AI</span>
                </h1>
                <p className={cn(
                  'text-lg mb-10',
                  isDark ? 'text-slate-400' : 'text-slate-600'
                )}>
                  Protect your digital space with advanced AI and continue monitoring harmful content across platforms.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-700/30"
            >
              <div className={cn(
                'p-4 rounded-2xl',
                isDark ? 'bg-slate-800/50' : 'bg-slate-100'
              )}>
                <p className={cn(
                  'text-xs font-semibold mb-1 uppercase tracking-wider',
                  isDark ? 'text-slate-500' : 'text-slate-500'
                )}>
                  System Status
                </p>
                <p className="text-primary font-black text-xl">99.9%</p>
                <p className={cn(
                  'text-xs',
                  isDark ? 'text-slate-500' : 'text-slate-500'
                )}>
                  Uptime
                </p>
              </div>
              <div className={cn(
                'p-4 rounded-2xl',
                isDark ? 'bg-slate-800/50' : 'bg-slate-100'
              )}>
                <p className={cn(
                  'text-xs font-semibold mb-1 uppercase tracking-wider',
                  isDark ? 'text-slate-500' : 'text-slate-500'
                )}>
                  Protection Active
                </p>
                <p className="text-primary font-black text-xl">24/7</p>
                <p className={cn(
                  'text-xs',
                  isDark ? 'text-slate-500' : 'text-slate-500'
                )}>
                  Monitoring
                </p>
              </div>
            </motion.div>
          </div>

          <div className="p-8 lg:p-16">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-8">
                <h2 className={cn(
                  'text-3xl font-black mb-2',
                  isDark ? 'text-white' : 'text-slate-900'
                )}>
                  Welcome Back
                </h2>
                <p className={cn(
                  'text-sm',
                  isDark ? 'text-slate-400' : 'text-slate-600'
                )}>
                  Enter your credentials or enter immediately with the 1-click demo account.
                </p>
              </div>
            </motion.div>

            {/* Quick 1-Click Demo / Temp Account Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={cn(
                'p-5 rounded-2xl border mb-8 relative overflow-hidden transition-all duration-300 shadow-lg',
                isDark
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-teal-950/30 border-emerald-500/40 shadow-emerald-950/30'
                  : 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-300 shadow-emerald-100'
              )}
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <Zap className="w-4 h-4 fill-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-emerald-400 dark:text-emerald-300 flex items-center gap-1.5">
                      1-Click Instant Demo Login
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </h3>
                    <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      Preconfigured temp account (<span className="font-mono text-emerald-400">demo@omniguard.ai</span>)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider shrink-0">
                  Instant
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-3.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={loading || demoLoading}
                  onClick={handleDemoLogin}
                  className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{demoLoading ? 'Authenticating Temp Account...' : 'Quick Login — Enter Dashboard'}</span>
                  {!demoLoading && <ArrowRight className="w-4 h-4" />}
                </motion.button>
                <button
                  type="button"
                  onClick={handleFillDemoCredentials}
                  title="Autofill form fields with demo credentials"
                  className={cn(
                    'py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors shrink-0 text-center',
                    isDark ? 'border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white' : 'border-slate-300 hover:bg-white text-slate-700'
                  )}
                >
                  Fill Form
                </button>
              </div>
            </motion.div>

            {/* Visual Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className={cn('w-full border-t', isDark ? 'border-slate-800' : 'border-slate-200')} />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className={cn(
                  'px-3 font-semibold',
                  isDark ? 'bg-card text-slate-500' : 'bg-white text-slate-400'
                )}>
                  Or Login With Password
                </span>
              </div>
            </div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-semibold"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label className={cn(
                  'block text-xs font-semibold mb-2 uppercase tracking-wider',
                  isDark ? 'text-primary' : 'text-primary'
                )}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      'w-full pl-12 pr-4 py-4 rounded-2xl border-2 focus:outline-none focus:border-primary transition-all duration-300',
                      isDark 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    )}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn(
                    'text-xs font-semibold uppercase tracking-wider',
                    isDark ? 'text-primary' : 'text-primary'
                  )}>
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      'w-full pl-12 pr-12 py-4 rounded-2xl border-2 focus:outline-none focus:border-primary transition-all duration-300',
                      isDark 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    )}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : 'Authenticate'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </motion.button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 text-center"
            >
              <p className={cn(
                'text-xs',
                isDark ? 'text-slate-500' : 'text-slate-500'
              )}>
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary font-bold hover:underline">
                  Initialize Node
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
