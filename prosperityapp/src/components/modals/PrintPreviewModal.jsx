import React from 'react';
import { useTranslation } from 'react-i18next';
import feather from 'feather-icons';

// Helper for icons to avoid feather.replace() DOM conflicts
const Icon = ({ name, className }) => {
    const icon = feather.icons[name];
    if (!icon) return null;
    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{ __html: icon.toSvg({ class: className }) }}
        />
    );
};

const PrintPreviewModal = ({ isOpen, onClose, onPrint, title, children }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
            <div className="bg-bg-secondary rounded-lg shadow-2xl border border-border-main w-full max-w-4xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border-main flex justify-between items-center bg-bg-tertiary rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-full text-accent">
                            <Icon name="printer" className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-main">{title || t('reports.printPreview')}</h3>
                            <p className="text-xs text-text-muted">Revise el documento antes de imprimir</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-bg-main rounded-full text-text-muted hover:text-text-main transition-colors"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Preview Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-100 flex justify-center">
                    <div className="bg-white shadow-lg p-8 min-h-[297mm] w-[210mm] text-black print-preview-content transform scale-90 origin-top">
                        {children}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border-main bg-bg-tertiary rounded-b-lg flex justify-between items-center">
                    <div className="text-sm text-text-muted">
                        <Icon name="info" className="w-4 h-4 inline mr-1" />
                        Al confirmar, se abrirá el diálogo de impresión del sistema.
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-text-muted hover:text-text-main transition-colors font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={onPrint}
                            className="btn-golden px-6 py-2 flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                        >
                            <Icon name="printer" className="w-4 h-4" />
                            {t('common.confirm')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;
