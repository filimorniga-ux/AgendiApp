import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    OAuthProvider
} from 'firebase/auth';
// CORRECCIÓN AQUÍ: Ya no importamos initialAuthToken
import { auth } from "../../firebase/config";
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
import { Dashboard } from './components/dashboard/Dashboard';
import { AuthModal } from './components/auth/AuthModal';
import { Icons } from './components/ui/Icons';

function MainApp() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [bgStyle, setBgStyle] = useState({});

    // LÓGICA LIMPIA DE AUTENTICACIÓN REAL
    useEffect(() => {
        if (auth) {
            // Escuchamos el estado real de Firebase (Prosperity)
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setLoadingAuth(false);
                if (currentUser) {
                    console.log("✅ Usuario autenticado:", currentUser.email);
                }
            });
            return () => unsubscribe();
        } else {
            setLoadingAuth(false);
        }
    }, []);

    useEffect(() => {
        // REFINAMIENTO DE TEXTURA MODO NOCHE
        const iconColor = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
        const watermarkTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
        const encodeSvg = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        const watermarkText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 150"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-weight="900" font-size="120" fill="${watermarkTextColor}">AGENDIAPP</text></svg>`;
        const svgScissors = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="8.59" y1="8.59" x2="15.42" y2="15.42"></line><line x1="8.59" y1="15.41" x2="15.42" y2="8.59"></line></svg>`;

        setBgStyle({
            backgroundImage: `url("${encodeSvg(watermarkText)}"), url("${encodeSvg(svgScissors)}")`,
            backgroundPosition: 'center center, 10% 20%',
            backgroundSize: '1000px, 300px',
            backgroundRepeat: 'no-repeat, repeat',
            backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
        });
    }, [isDarkMode]);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            setUser(null);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!auth) return;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setShowLoginModal(false); // Cerrar modal al éxito
            navigate('/app'); // Redirección al Dashboard
        } catch (error) {
            console.error("Error login:", error);
            alert("Error: " + error.message);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!auth) return;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setShowRegisterModal(false);
            navigate('/app'); // Redirección al Dashboard
        } catch (error) {
            console.error("Error registro:", error);
            alert("Error: " + error.message);
        }
    };

    const handleGoogleLogin = async () => {
        if (!auth) return;
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            setShowLoginModal(false);
            setShowRegisterModal(false);
            navigate('/app'); // Redirección al Dashboard
        } catch (error) {
            console.error("Google Auth Error:", error);
        }
    };

    const handleAppleLogin = () => {
        if (auth) {
            const provider = new OAuthProvider('apple.com');
            signInWithPopup(auth, provider).catch((error) => {
                console.warn("Apple Sign In not configured in Firebase Console yet.", error);
                alert("Apple Sign In requiere dominio verificado. Usa Google o Email por ahora.");
            });
        }
    };

    const scrollToPricing = () => {
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (loadingAuth) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#f6e05e] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div style={bgStyle} className={`font-sans antialiased min-h-screen transition-colors duration-500 bg-fixed selection:bg-[#f6e05e] selection:text-black`}>
            <Header
                isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)}
                user={user}
                onLoginClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                onRegisterClick={scrollToPricing}
                onLogout={handleLogout}
            />

            <main>
                {user ? (
                    <Dashboard user={user} isDarkMode={isDarkMode} />
                ) : (
                    <>
                        <Hero isDarkMode={isDarkMode} onRegisterClick={scrollToPricing} />
                        <BentoGrid isDarkMode={isDarkMode} />
                        <Ecosystem isDarkMode={isDarkMode} />
                        <Tutorials isDarkMode={isDarkMode} />
                        <Pricing isDarkMode={isDarkMode} onRegisterClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }} />
                        <Testimonials isDarkMode={isDarkMode} />
                        <Contact isDarkMode={isDarkMode} />
                    </>
                )}
            </main>

            <Footer isDarkMode={isDarkMode} />

            {showLoginModal && (
                <AuthModal isDarkMode={isDarkMode} onClose={() => setShowLoginModal(false)} title={t.auth.login_title}>
                    <form className="space-y-4" onSubmit={handleLoginSubmit}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.auth.email}
                            className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#f6e05e]"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t.auth.pass}
                            className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#f6e05e]"
                        />
                        <button className="w-full py-4 rounded-xl font-bold bg-[#f6e05e] text-black hover:opacity-90 transition-opacity">{t.auth.submit_login}</button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-300 dark:border-slate-700"></span></div>
                            <div className="relative flex justify-center"><span className="bg-white dark:bg-[#1a202c] px-4 text-xs text-slate-500 uppercase">O</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={handleGoogleLogin} className="w-full py-3 rounded-xl font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors dark:text-white">
                                <Icons.Google />
                                {t.auth.google}
                            </button>
                            <button type="button" onClick={handleAppleLogin} className="w-full py-3 rounded-xl font-bold bg-black text-white hover:bg-slate-900 flex items-center justify-center gap-2 transition-colors">
                                <Icons.Apple />
                                {t.auth.apple}
                            </button>
                        </div>

                        <button type="button" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }} className="w-full text-sm text-slate-500 hover:text-[#f6e05e]">{t.auth.switch_reg}</button>
                    </form>
                </AuthModal>
            )}

            {showRegisterModal && (
                <AuthModal isDarkMode={isDarkMode} onClose={() => setShowRegisterModal(false)} title={t.auth.register_title}>
                    <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.auth.email}
                            className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#f6e05e]"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t.auth.pass}
                            className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#f6e05e]"
                        />
                        <button className="w-full py-4 rounded-xl font-bold bg-[#f6e05e] text-black hover:opacity-90 transition-opacity">{t.auth.submit_register}</button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-300 dark:border-slate-700"></span></div>
                            <div className="relative flex justify-center"><span className="bg-white dark:bg-[#1a202c] px-4 text-xs text-slate-500 uppercase">O</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={handleGoogleLogin} className="w-full py-3 rounded-xl font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors dark:text-white">
                                <Icons.Google />
                                {t.auth.google}
                            </button>
                            <button type="button" onClick={handleAppleLogin} className="w-full py-3 rounded-xl font-bold bg-black text-white hover:bg-slate-900 flex items-center justify-center gap-2 transition-colors">
                                <Icons.Apple />
                                {t.auth.apple}
                            </button>
                        </div>

                        <button type="button" onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }} className="w-full text-sm text-slate-500 hover:text-[#f6e05e]">{t.auth.switch_log}</button>
                    </form>
                </AuthModal>
            )}
        </div>
    );
}

export default function App() {
    return (
        <LanguageProvider>
            <MainApp />
        </LanguageProvider>
    );
}