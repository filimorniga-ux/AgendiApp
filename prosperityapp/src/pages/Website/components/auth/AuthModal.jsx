import React from 'react';
import { CloseIcon } from '../ui/Icons';

export const AuthModal = ({ isDarkMode, onClose, title, children }) => (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className={`${isDarkMode ? 'bg-[#1a202c] border border-slate-700' : 'bg-white'} w-full max-w-md rounded-3xl shadow-2xl p-8 relative`} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
                <CloseIcon />
            </button>
            <h2 className={`text-2xl font-black text-center mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
            {children}
        </div>
    </div>
);
