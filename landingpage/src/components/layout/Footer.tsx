import React from 'react';
import { Icons } from '../ui/Icons';

export const Footer = ({ isDarkMode }: { isDarkMode: boolean }) => (
    <footer className={`py-12 border-t ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'} text-center`}>
        <div className="flex justify-center gap-6 mb-8">
            <a href="#" className="hover:text-[#f6e05e] transition-colors transform hover:scale-110"><Icons.Facebook /></a>
            <a href="#" className="hover:text-[#f6e05e] transition-colors transform hover:scale-110"><Icons.Instagram /></a>
            <a href="#" className="hover:text-[#f6e05e] transition-colors transform hover:scale-110"><Icons.TikTok /></a>
        </div>
        <p>&copy; 2025 Agendiapp. Gema-Arquitecto Build.</p>
    </footer>
);
