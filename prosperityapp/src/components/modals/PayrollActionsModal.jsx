import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import feather from 'feather-icons';

const PayrollActionsModal = ({ isOpen, onClose, collaborators, onAction }) => {
    const { t } = useTranslation();
    const [actionType, setActionType] = useState('print'); // 'print' or 'export'
    const [scope, setScope] = useState('general'); // 'general' or 'specific'
    const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');

    useEffect(() => {
        feather.replace();
    }, [isOpen, actionType, scope]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onAction(actionType, scope === 'specific' ? selectedCollaboratorId : null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-text-main">{t('payroll.actionsTitle')}</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main">
                        <i data-feather="x"></i>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Action Selection */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-3">{t('payroll.selectAction')}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setActionType('print')}
                                className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${actionType === 'print'
                                        ? 'bg-accent/10 border-accent text-accent'
                                        : 'bg-bg-tertiary border-border-main text-text-muted hover:bg-bg-main'
                                    }`}
                            >
                                <i data-feather="printer" className="w-6 h-6"></i>
                                <span className="font-semibold">{t('reports.printView')}</span>
                            </button>
                            <button
                                onClick={() => setActionType('export')}
                                className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${actionType === 'export'
                                        ? 'bg-green-500/10 border-green-500 text-green-500'
                                        : 'bg-bg-tertiary border-border-main text-text-muted hover:bg-bg-main'
                                    }`}
                            >
                                <i data-feather="download" className="w-6 h-6"></i>
                                <span className="font-semibold">{t('reports.exportExcel')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Scope Selection */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-3">{t('payroll.selectScope')}</label>
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="scope"
                                    value="general"
                                    checked={scope === 'general'}
                                    onChange={() => setScope('general')}
                                    className="form-radio text-accent"
                                />
                                <span className="text-text-main">{t('payroll.scopeGeneral')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="scope"
                                    value="specific"
                                    checked={scope === 'specific'}
                                    onChange={() => setScope('specific')}
                                    className="form-radio text-accent"
                                />
                                <span className="text-text-main">{t('payroll.scopeSpecific')}</span>
                            </label>
                        </div>

                        {scope === 'specific' && (
                            <select
                                value={selectedCollaboratorId}
                                onChange={(e) => setSelectedCollaboratorId(e.target.value)}
                                className="w-full bg-bg-main border border-border-main rounded-lg p-2.5 text-text-main focus:ring-2 focus:ring-accent focus:border-transparent"
                            >
                                <option value="">{t('payroll.selectCollaborator')}</option>
                                {collaborators.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-text-muted hover:text-text-main transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={scope === 'specific' && !selectedCollaboratorId}
                        className="btn-golden px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i data-feather="check" className="w-4 h-4"></i>
                        {t('common.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayrollActionsModal;
