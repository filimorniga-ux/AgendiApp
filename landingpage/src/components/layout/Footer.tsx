import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icons } from '../ui/Icons';

export const Footer = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const { t } = useLanguage();
    return (
    <footer className={`py-12 border-t ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'} text-center`}>
        <div className="flex justify-center gap-6 mb-8">
            <a href="https://facebook.com/agendiapp" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-[#f6e05e] transition-colors transform hover:scale-110"><Icons.Facebook /></a>
            <a href="https://instagram.com/agendiapp" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-[#f6e05e] transition-colors transform hover:scale-110"><Icons.Instagram /></a>
            <a href="https://tiktok.com/@agendiapp" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-[#f6e05e] transition-colors transform hover:scale-110"><Icons.TikTok /></a>
        </div>
        <p>&copy; 2026 AgendiApp. {t.footer.rights}</p>
    </footer>
    );
};
