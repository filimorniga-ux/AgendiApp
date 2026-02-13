import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { collection, query, where, onSnapshot, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../../../context/DataContext'; // Import useData
import { Icons } from '../ui/Icons';

// --- CONFIGURACIÓN DE SUPER ADMIN ---
// Solo este email podrá ver y usar el selector de roles
const SUPER_ADMIN_EMAIL = "filimorniga@gmail.com";

const RoleBadge = ({ role }) => {
    let color = '';
    if (role === 'admin') color = 'bg-red-500/10 text-red-500 border-red-500/20';
    if (role === 'staff') color = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (role === 'client') color = 'bg-green-500/10 text-green-500 border-green-500/20';

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${color}`}>
            {role}
        </span>
    );
};

export const Dashboard = ({ user, isDarkMode }) => {
    const { t } = useLanguage();
    const { userRole, updateRoleSimulation, realRole } = useData(); // Use global context
    const navigate = useNavigate();

    // Verificar si el usuario actual es el super admin
    const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

    // Estado local solo para revenue (podría moverse al context si se quisiera global también)
    const [revenue, setRevenue] = useState(0);
    const [loadingStats, setLoadingStats] = useState(false);

    // 1. EFECTO: IDENTIFICACIÓN Y CREACIÓN DE USUARIO (Mantenemos la creación si no existe, pero el rol viene del context)
    useEffect(() => {
        const checkUserRole = async () => {
            if (!db || !user) return;

            // La lógica de creación de usuario nuevo sigue siendo útil aquí si DataContext no lo maneja
            // Pero DataContext ya lee el rol. Solo nos aseguramos de crear el doc si no existe.
            const userRef = doc(db, "users", user.uid);
            try {
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    console.log("🆕 Creando perfil de usuario nuevo...");
                    await setDoc(userRef, {
                        email: user.email,
                        name: user.displayName || "Usuario Sin Nombre",
                        role: 'client', // Por defecto todos son clientes
                        createdAt: new Date()
                    });
                    // No necesitamos setear estado local, DataContext lo recogerá en su próximo ciclo o recarga
                }
            } catch (error) {
                console.error("Error verificando usuario:", error);
            }
        };

        checkUserRole();
    }, [user]);

    // 2. EFECTO: DATOS EN TIEMPO REAL (Solo si eres Admin o Staff)
    useEffect(() => {
        if (!db || !user) return;

        // Solo cargamos estadísticas financieras si estamos en vista Admin
        if (userRole === 'admin') {
            setLoadingStats(true);
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            // Escuchamos la colección real de citas
            const q = query(
                collection(db, "appointments"),
                where("status", "==", "completed"),
                where("date", ">=", startOfToday)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const total = snapshot.docs.reduce((acc, doc) => {
                    const data = doc.data();
                    return acc + (Number(data.price) || 0);
                }, 0);
                setRevenue(total);
                setLoadingStats(false);
            }, (error) => {
                console.error("Error cargando ventas:", error);
                setLoadingStats(false);
            });
            return () => unsubscribe();
        }
    }, [user, userRole]); // Dependencia userRole

    // Función para simular venta (Escribe en la DB real)
    const simulateSale = async () => {
        if (!db) return;
        try {
            await addDoc(collection(db, "appointments"), {
                clientName: "Cliente Casual",
                serviceName: "Corte Rápido",
                date: new Date(),
                status: "completed",
                price: 45.00, // Precio real
                cost: 10.00,
                staffId: user.uid
            });
            alert("💰 ¡Venta de $45 registrada en Firebase!");
        } catch (e) {
            console.error("Error guardando venta: ", e);
        }
    };

    // --- VISTAS (COMPONENTES VISUALES) ---

    const AdminView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tarjeta de Ingresos REALES */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.dashboard.admin_section.revenue}</h3>
                        <Icons.ChartBar />
                    </div>
                    <div className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} ${loadingStats ? 'opacity-50' : ''}`}>
                        ${revenue.toFixed(2)}
                    </div>
                    <button onClick={simulateSale} className="mt-4 text-xs font-bold px-3 py-2 rounded-lg bg-[#f6e05e]/20 text-[#f6e05e] hover:bg-[#f6e05e] hover:text-black transition-all w-full">
                        + {t.dashboard.admin_section.simulate_sale}
                    </button>
                </div>

                {/* PIN de Seguridad (Estático por ahora) */}
                <div className={`p-6 rounded-2xl border relative overflow-hidden ${isDarkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className={`font-bold ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>{t.dashboard.admin_section.pin_control}</h3>
                        <div className="text-red-500"><Icons.Lock /></div>
                    </div>
                    <div className={`text-4xl font-black relative z-10 tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>****</div>
                    <p className={`text-sm mt-2 relative z-10 ${isDarkMode ? 'text-red-200/70' : 'text-red-800/70'}`}>{t.dashboard.admin_section.pin_desc}</p>
                </div>

                {/* Gestión de Personal (Visual) */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.dashboard.admin_section.manage_staff}</h3>
                        <Icons.UserGroup />
                    </div>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full bg-slate-500 border-2 border-slate-800 flex items-center justify-center text-xs text-white">S{i}</div>
                        ))}
                        <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-white">+</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const StaffView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-2 text-[#f6e05e]">Panel de Colaborador</h3>
                <p className="text-sm opacity-70">Aquí verás tu agenda y comisiones asignadas.</p>
            </div>
        </div>
    );

    const ClientView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-8 rounded-2xl bg-gradient-to-r from-[#f6e05e] to-[#f6c05e] text-[#1a202c] shadow-lg`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-xl mb-1">{t.dashboard.client_section.book_now}</h3>
                        <p className="opacity-80 text-sm max-w-xs">Reserva tu próxima cita en segundos.</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><Icons.Calendar /></div>
                </div>
                <button
                    onClick={() => navigate('/app/agenda')}
                    className="mt-6 bg-[#1a202c] text-white px-6 py-2 rounded-lg font-bold text-sm hover:shadow-lg hover:scale-105 transition-all"
                >
                    Reservar Ahora
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.dashboard.client_section.loyalty}</h3>
                        <Icons.Star />
                    </div>
                    <div className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>0 <span className="text-sm font-normal opacity-50">pts</span></div>
                </div>
            </div>
        </div>
    );

    // --- RENDER PRINCIPAL ---

    if (!userRole && !realRole) {
        return <div className="min-h-screen flex items-center justify-center text-[#f6e05e]">Cargando perfil...</div>;
    }

    return (
        <div className={`max-w-7xl mx-auto px-6 py-8 transition-all duration-300`}>
            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8`}>
                <div>
                    <h1 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {t.dashboard.welcome} <span className="text-[#f6e05e]">{user.displayName || user.email?.split('@')[0]}</span>
                    </h1>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tu Rol Real:</span>
                        <RoleBadge role={realRole || 'client'} />
                        {/* Mostrar indicador si estamos simulando */}
                        {realRole !== userRole && (
                            <span className="text-xs text-[#f6e05e] border border-[#f6e05e] px-2 py-0.5 rounded ml-2">
                                Simulando: {userRole}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {/* BOTÓN PARA IR A LA APP OPERATIVA */}
                    <button
                        onClick={() => navigate('/app')}
                        className="px-6 py-3 rounded-lg bg-[#f6e05e] text-black font-bold hover:bg-[#f6e05e]/90 transition-colors flex items-center gap-2"
                    >
                        <span>🏢</span>
                        Ir a la App
                    </button>

                    {/* SELECTOR DE VISTA: SOLO VISIBLE PARA EL SUPER ADMIN */}
                    {isSuperAdmin && (
                        <div className={`flex items-center gap-2 p-1 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <span className={`text-xs px-3 font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Vista Previa:</span>
                            {['admin', 'staff', 'client'].map(role => (
                                <button
                                    key={role}
                                    onClick={() => updateRoleSimulation(role)} // Usar función global
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${userRole === role
                                        ? 'bg-[#f6e05e] text-[#1a202c] shadow-sm'
                                        : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    {t.dashboard.roles[role]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-500/10 pt-8">
                {userRole === 'admin' && <AdminView />}
                {userRole === 'staff' && <StaffView />}
                {userRole === 'client' && <ClientView />}
            </div>
        </div>
    );
};