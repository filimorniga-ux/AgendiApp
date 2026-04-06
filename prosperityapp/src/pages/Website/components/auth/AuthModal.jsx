import React from 'react';
import { CloseIcon } from '../ui/Icons';

export const AuthModal = ({ isDarkMode, onClose, title, children }) => (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
        <div className={`${isDarkMode ? 'bg-slate-950/70 border border-white/10 backdrop-blur-2xl text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : 'bg-white/80 border border-slate-200 backdrop-blur-2xl shadow-xl'} w-full max-w-md rounded-3xl p-6 md:p-8 relative modal-content transition-all duration-300`} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${isDarkMode ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:bg-slate-200'}`}>
                <CloseIcon />
            </button>
            <h2 className={`text-3xl font-black text-center mb-8 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
            {children}
        </div>
    </div>
);
