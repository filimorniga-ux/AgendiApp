import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { supabase } from '../../supabase/client';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { BentoGrid } from './components/sections/BentoGrid';
import { Ecosystem } from './components/sections/Ecosystem';
import { Tutorials } from './components/sections/Tutorials';
import { Pricing } from './components/sections/Pricing';
import { Testimonials } from './components/sections/Testimonials';
import { Contact } from './components/sections/Contact';
import { AuthModal } from './components/auth/AuthModal';
import { Icons } from './components/ui/Icons';

import { HelmetProvider, Helmet } from 'react-helmet-async';

// ── Password validation ─────────────────────────────────────────────────────
const validatePassword = (pwd, t) => {
    if (pwd.length < 8) return t.auth.password_min_length;
    if (!/\d/.test(pwd)) return t.auth.password_needs_number;
    return '';
};

function MainApp() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Modal visibility
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Auth sub-views inside modals
    const [authView, setAuthView] = useState('form');
    // 'form' | 'check_email' | 'forgot_password' | 'forgot_sent'

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMsg, setResendMsg] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');

    const [bgStyle, setBgStyle] = useState({});

    // ── Auth state listener ─────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoadingAuth(false);

            if (currentUser && (window.location.pathname === '/' || window.location.pathname === '')) {
                navigate('/app');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoadingAuth(false);

            if (currentUser) {
                console.info('✅ Usuario autenticado:', currentUser.email);
                if (window.location.pathname === '/' || window.location.pathname === '') {
                    navigate('/app');
                }
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, [navigate]);

    useEffect(() => {
        setBgStyle({
            backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
        });
    }, [isDarkMode]);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const resetAuthState = () => {
        setError('');
        setResendMsg('');
        setAuthView('form');
        setLoading(false);
        setResendLoading(false);
    };

    const openLogin = () => {
        resetAuthState();
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    const openRegister = () => {
        resetAuthState();
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const closeAll = () => {
        setShowLoginModal(false);
        setShowRegisterModal(false);
        resetAuthState();
    };

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: sbErr } = await supabase.auth.signInWithPassword({ email, password });

            if (sbErr) {
                // Handle "Email not confirmed" specifically
                if (sbErr.message?.toLowerCase().includes('email not confirmed')) {
                    setError('');
                    setAuthView('check_email');
                    setLoading(false);
                    return;
                }
                throw sbErr;
            }

            closeAll();
            navigate('/app');
        } catch (err) {
            console.warn('Error login:', err);
            if (err.message?.includes('Invalid login credentials')) {
                setError(t.auth.error_generic);
            } else {
                setError(err.message || t.auth.error_generic);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side password validation
        const pwdError = validatePassword(password, t);
        if (pwdError) {
            setError(pwdError);
            return;
        }

        setLoading(true);

        try {
            const { data, error: sbErr } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin + '/auth/callback',
                },
            });

            if (sbErr) {
                // Check if user already exists with Google (auto-linking scenario)
                if (sbErr.message?.includes('already registered') ||
                    sbErr.message?.includes('User already registered')) {
                    setError(t.auth.account_exists_google + ' ' + t.auth.set_password_link);
                    setLoading(false);
                    return;
                }
                throw sbErr;
            }

            // Supabase returns a user with identities=[] when email already exists
            // but confirm is required — detect this case
            if (data?.user?.identities?.length === 0) {
                setError(t.auth.account_exists_google + ' ' + t.auth.set_password_link);
                setLoading(false);
                return;
            }

            // Success — show "check your email" screen (do NOT redirect to /app)
            setAuthView('check_email');
        } catch (err) {
            console.warn('Error registro:', err);
            setError(err.message || t.auth.error_generic);
        } finally {
            setLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        setResendMsg('');
        setResendLoading(true);
        try {
            const { error: resendErr } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: window.location.origin + '/auth/callback',
                },
            });
            if (resendErr) throw resendErr;
            setResendMsg(t.auth.resend_success);
        } catch (err) {
            setResendMsg(err.message || t.auth.resend_cooldown);
        } finally {
            setResendLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
                forgotEmail || email,
                { redirectTo: window.location.origin + '/auth/callback?type=recovery' }
            );
            if (resetErr) throw resetErr;
            setAuthView('forgot_sent');
        } catch (err) {
            setError(err.message || t.auth.error_generic);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error: oauthErr } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + '/app' },
            });
            if (oauthErr) throw oauthErr;
        } catch (err) {
            console.warn('Google Auth Error:', err);
        }
    };

    const handleAppleLogin = async () => {
        try {
            const { error: oauthErr } = await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: { redirectTo: window.location.origin + '/app' },
            });
            if (oauthErr) throw oauthErr;
        } catch (err) {
            console.warn('Apple Sign In Error:', err);
            setError('Error al iniciar sesión con Apple.');
        }
    };

    const scrollToPricing = () => {
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) pricingSection.scrollIntoView({ behavior: 'smooth' });
    };

    if (loadingAuth) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#f6e05e] border-t-transparent rounded-full animate-spin"></div></div>;

    // ── Shared CSS classes ──────────────────────────────────────────────────
    const inputCls = `w-full p-4 rounded-xl outline-none transition-all ${isDarkMode ? 'bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:bg-white/10 focus:border-[#f6e05e]/50 focus:ring-1 focus:ring-[#f6e05e]/50' : 'bg-slate-100 border border-transparent text-slate-900 focus:bg-white focus:border-[#f6e05e] focus:ring-2 focus:ring-[#f6e05e]'}`;
    const btnPrimary = 'w-full py-4 rounded-xl font-bold bg-[#f6e05e] text-[#0f172a] shadow-[0_4px_14px_rgba(246,224,94,0.39)] hover:shadow-[0_6px_20px_rgba(246,224,94,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-50';
    const dividerCls = isDarkMode ? 'border-white/10' : 'border-slate-300';
    const dividerTextCls = isDarkMode ? 'bg-slate-950 text-white/50' : 'bg-white text-slate-500';
    const oauthBtnGoogle = `w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isDarkMode ? 'border border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'}`;
    const oauthBtnApple = `w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isDarkMode ? 'border border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-900 hover:bg-black text-white'}`;
    const linkCls = `w-full text-sm mt-2 transition-colors ${isDarkMode ? 'text-white/50 hover:text-[#f6e05e]' : 'text-slate-500 hover:text-[#f6e05e]'}`;

    // ── OAuth buttons block ─────────────────────────────────────────────────
    const OAuthButtons = () => (
        <>
            <div className="relative py-2 mt-4">
                <div className="absolute inset-0 flex items-center"><span className={`w-full border-t ${dividerCls}`}></span></div>
                <div className="relative flex justify-center"><span className={`px-4 text-xs uppercase ${dividerTextCls}`}>O</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button type="button" onClick={handleGoogleLogin} className={oauthBtnGoogle}>
                    <Icons.Google /> {t.auth.google}
                </button>
                <button type="button" onClick={handleAppleLogin} className={oauthBtnApple}>
                    <Icons.Apple /> {t.auth.apple}
                </button>
            </div>
        </>
    );

    // ── "Check your email" sub-view ─────────────────────────────────────────
    const CheckEmailView = () => (
        <div className="text-center space-y-4">
            <div style={{ fontSize: 48 }}>✉️</div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {t.auth.check_email_title}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {t.auth.check_email_msg} <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{email}</strong>
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                {t.auth.check_email_hint}
            </p>
            <button
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className={`${btnPrimary} !py-3 text-sm`}
            >
                {resendLoading ? '...' : t.auth.resend_email}
            </button>
            {resendMsg && (
                <p className={`text-xs ${resendMsg.includes('!') ? 'text-green-400' : 'text-amber-400'}`}>
                    {resendMsg}
                </p>
            )}
            <button type="button" onClick={openLogin} className={linkCls}>
                {t.auth.already_confirmed} {t.auth.submit_login}
            </button>
        </div>
    );

    // ── "Forgot password" sub-view ──────────────────────────────────────────
    const ForgotPasswordView = () => (
        <div className="space-y-4">
            <div className="text-center" style={{ fontSize: 40 }}>🔑</div>
            <h3 className={`text-xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {t.auth.forgot_password_title}
            </h3>
            <p className={`text-sm text-center ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {t.auth.forgot_password_msg}
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
                <input
                    type="email"
                    value={forgotEmail || email}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={t.auth.email}
                    required
                    className={inputCls}
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button type="submit" disabled={loading} className={btnPrimary}>
                    {loading ? '...' : t.auth.forgot_password_submit}
                </button>
            </form>
            <button type="button" onClick={() => { setError(''); setAuthView('form'); }} className={linkCls}>
                {t.auth.back_to_login}
            </button>
        </div>
    );

    // ── "Forgot password sent" sub-view ─────────────────────────────────────
    const ForgotSentView = () => (
        <div className="text-center space-y-4">
            <div style={{ fontSize: 48 }}>📧</div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {t.auth.check_email_title}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {t.auth.forgot_password_sent}
            </p>
            <button type="button" onClick={openLogin} className={linkCls}>
                {t.auth.back_to_login}
            </button>
        </div>
    );

    return (
        <div style={bgStyle} className={`font-sans antialiased min-h-screen transition-colors duration-500 bg-fixed selection:bg-[#f6e05e] selection:text-black`}>
            <Helmet>
                <title>AgendiApp — Software y Aplicación para Barberías, Peluquerías y Spa de Uñas</title>
                <meta name="description" content="Automatiza tus reservas, controla comisiones y digitaliza tu inventario fácilmente con el mejor software de peluquerías, barberías y spa de uñas. Sistema de reservas de belleza líder." />
                <meta name="keywords" content="aplicación para barberías, software de peluquerías, spa de uñas, software de gestión de spa y uñas, sistema de reservas de belleza, SaaS peluquerías, agendamiento online" />
                <meta property="og:title" content="AgendiApp — El Software Premium para tu Negocio de Belleza" />
                <meta property="og:description" content="Sistema de reservas de belleza enfocado en peluquerías, barberías y spa de uñas. Atrae más clientes y gestiona todo en un solo lugar." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://agendiapp.app/" />
            </Helmet>
            <Header
                isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)}
                user={user}
                onLoginClick={openLogin}
                onRegisterClick={scrollToPricing}
                onLogout={handleLogout}
            />

            <main>
                {user ? (
                    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: isDarkMode ? '#020617' : '#f8fafc' }}>
                        <div className="w-10 h-10 border-4 border-[#f6e05e] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <Hero isDarkMode={isDarkMode} onRegisterClick={scrollToPricing} />
                        <BentoGrid isDarkMode={isDarkMode} />
                        <Ecosystem isDarkMode={isDarkMode} />
                        <Tutorials isDarkMode={isDarkMode} />
                        <Pricing isDarkMode={isDarkMode} onRegisterClick={openRegister} />
                        <Testimonials isDarkMode={isDarkMode} />
                        <Contact isDarkMode={isDarkMode} />
                    </>
                )}
            </main>

            <Footer isDarkMode={isDarkMode} />

            {/* ── LOGIN MODAL ────────────────────────────────────────────── */}
            {showLoginModal && (
                <AuthModal isDarkMode={isDarkMode} onClose={closeAll} title={
                    authView === 'forgot_password' ? t.auth.forgot_password_title
                    : authView === 'forgot_sent' ? t.auth.check_email_title
                    : authView === 'check_email' ? t.auth.check_email_title
                    : t.auth.login_title
                }>
                    {authView === 'check_email' && <CheckEmailView />}
                    {authView === 'forgot_password' && <ForgotPasswordView />}
                    {authView === 'forgot_sent' && <ForgotSentView />}
                    {authView === 'form' && (
                        <form className="space-y-4" onSubmit={handleLoginSubmit}>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.auth.email} required className={inputCls} />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.auth.pass} required className={inputCls} />

                            {error && <p className="text-red-400 text-xs">{error}</p>}

                            {/* Forgot password link */}
                            <button
                                type="button"
                                onClick={() => { setError(''); setForgotEmail(email); setAuthView('forgot_password'); }}
                                className={`text-xs transition-colors ${isDarkMode ? 'text-white/40 hover:text-[#f6e05e]' : 'text-slate-400 hover:text-[#f6e05e]'}`}
                            >
                                {t.auth.forgot_password}
                            </button>

                            <button type="submit" disabled={loading} className={btnPrimary}>
                                {loading ? '...' : t.auth.submit_login}
                            </button>

                            <OAuthButtons />

                            <button type="button" onClick={openRegister} className={linkCls}>{t.auth.switch_reg}</button>
                        </form>
                    )}
                </AuthModal>
            )}

            {/* ── REGISTER MODAL ─────────────────────────────────────────── */}
            {showRegisterModal && (
                <AuthModal isDarkMode={isDarkMode} onClose={closeAll} title={
                    authView === 'check_email' ? t.auth.check_email_title : t.auth.register_title
                }>
                    {authView === 'check_email' ? (
                        <CheckEmailView />
                    ) : (
                        <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.auth.email} required className={inputCls} />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.auth.pass} required className={inputCls} />

                            {/* Password strength hints */}
                            {password.length > 0 && (
                                <div className={`flex flex-col gap-1 text-xs ${isDarkMode ? '' : ''}`}>
                                    <span className={password.length >= 8 ? 'text-green-400' : (isDarkMode ? 'text-white/40' : 'text-slate-400')}>
                                        {password.length >= 8 ? '✓' : '○'} {t.auth.password_min_length}
                                    </span>
                                    <span className={/\d/.test(password) ? 'text-green-400' : (isDarkMode ? 'text-white/40' : 'text-slate-400')}>
                                        {/\d/.test(password) ? '✓' : '○'} {t.auth.password_needs_number}
                                    </span>
                                </div>
                            )}

                            {error && <p className="text-red-400 text-xs">{error}</p>}

                            <button type="submit" disabled={loading} className={btnPrimary}>
                                {loading ? '...' : t.auth.submit_register}
                            </button>

                            <OAuthButtons />

                            <button type="button" onClick={openLogin} className={linkCls}>{t.auth.switch_log}</button>
                        </form>
                    )}
                </AuthModal>
            )}
        </div>
    );
}

export default function App() {
    return (
        <HelmetProvider>
            <LanguageProvider>
                <MainApp />
            </LanguageProvider>
        </HelmetProvider>
    );
}