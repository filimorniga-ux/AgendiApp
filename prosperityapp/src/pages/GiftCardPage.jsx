// ===== INICIO: src/pages/GiftCardPage.jsx (Sprint 98 - Final Fix) =====
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useCollection } from '../hooks/useCollection';
import { useTranslation } from 'react-i18next';
import { useStorage } from '../hooks/useStorage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const GiftCardPage = () => {
  const { t } = useTranslation();
  const { data: giftCards, loading } = useCollection('giftCards');
  const { isLoading: isDataLoading } = useData();
  const { uploadFile, progress, isUploading } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingCardId, setUploadingCardId] = useState(null);
  const [uploadType, setUploadType] = useState(null); // 'purchase' or 'redemption'

  const handleUploadReceipt = async (e, cardId, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCardId(cardId);
    setUploadType(type);

    const path = type === 'purchase'
      ? `giftcards/receipts/${file.name}`
      : `giftcards/redemption_receipts/${file.name}`;

    try {
      const url = await uploadFile(file, path);

      const cardRef = doc(db, 'giftCards', cardId);
      const updateField = type === 'purchase' ? 'receiptUrl' : 'redemptionReceiptUrl';
      await updateDoc(cardRef, { [updateField]: url });

      toast.success(`${type === 'purchase' ? 'Comprobante de compra' : 'Evidencia de canje'} subido correctamente`);
    } catch (err) {
      console.warn("Error uploading:", err);
      toast.error("Error al subir archivo");
    } finally {
      setUploadingCardId(null);
      setUploadType(null);
    }
  };

  const filteredGiftCards = useMemo(() => {
    if (!giftCards) return [];

    const sorted = [...giftCards].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    if (!searchTerm) return sorted;

    const term = searchTerm.toLowerCase();
    return sorted.filter(gc =>
      gc.code.toLowerCase().includes(term) ||
      gc.buyerName.toLowerCase().includes(term) ||
      (gc.buyerContact && gc.buyerContact.toLowerCase().includes(term))
    );
  }, [giftCards, searchTerm]);

  if (loading || isDataLoading) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text-main">{t('giftcards.title')}</h2>
          <p className="text-text-muted">{t('giftcards.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-bg-secondary p-4 rounded-lg border border-border-main">
        <input
          type="search"
          className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 placeholder-text-muted text-text-main"
          placeholder={t('giftcards.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        <div className="bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
              <tr>
                <th className="p-3 font-semibold">{t('giftcards.table.code')}</th>
                <th className="p-3 font-semibold">{t('giftcards.table.buyer')}</th>
                <th className="p-3 font-semibold">{t('giftcards.table.contact')}</th>
                <th className="p-3 font-semibold text-right">{t('giftcards.table.initialValue')}</th>
                <th className="p-3 font-semibold text-right">{t('giftcards.table.balance')}</th>
                <th className="p-3 font-semibold text-center">{t('giftcards.table.status')}</th>
                <th className="p-3 font-semibold">{t('giftcards.table.createdAt')}</th>
                <th className="p-3 font-semibold text-center">{t('giftcards.table.evidence')}</th>
              </tr>
            </thead>
            <tbody>
              {(filteredGiftCards || []).map(gc => {
                const isExhausted = gc.status === 'Agotada' || gc.balance <= 0;
                const isCurrentlyUploading = uploadingCardId === gc.id;

                return (
                  <tr key={gc.id} className={`border-b border-border-main text-sm ${isExhausted ? 'opacity-50 hover:bg-bg-tertiary/20' : 'hover:bg-bg-tertiary'}`}>
                    <td className="p-3 text-text-main font-semibold">{gc.code}</td>
                    <td className="p-3 text-text-main">{gc.buyerName}</td>
                    <td className="p-3 text-text-muted">{gc.buyerContact || t('common.notAvailable')}</td>
                    <td className="p-3 text-right text-text-main">{formatCurrency(gc.initialValue)}</td>
                    <td className={`p-3 text-right font-bold ${isExhausted ? 'text-text-muted' : 'text-accent'}`}>
                      {formatCurrency(gc.balance)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isExhausted ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                        }`}>
                        {isExhausted ? t('giftcards.status.exhausted') : t('giftcards.status.active')}
                      </span>
                    </td>
                    <td className="p-3 text-text-muted">{formatDate(gc.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-2 items-center justify-center">
                        {/* Comprobante de Compra */}
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleUploadReceipt(e, gc.id, 'purchase')}
                            accept=".pdf,.jpg,.png,.jpeg"
                            disabled={isCurrentlyUploading}
                          />
                          <div className={`px-3 py-2 rounded border transition-colors text-xs font-semibold ${gc.receiptUrl
                            ? 'bg-green-500/20 border-green-500/50 text-green-300'
                            : 'bg-bg-tertiary border-border-main text-text-main hover:bg-bg-main'
                            }`} title={t('giftcards.tooltips.purchaseReceipt')}>
                            {isCurrentlyUploading && uploadingCardId === gc.id && uploadType === 'purchase' ? (
                              <span>{Math.round(progress)}%</span>
                            ) : (
                              <span>{t('giftcards.buttons.purchaseReceipt')}</span>
                            )}
                          </div>
                        </label>

                        {/* Evidencia de Canje */}
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleUploadReceipt(e, gc.id, 'redemption')}
                            accept=".pdf,.jpg,.png,.jpeg"
                            disabled={isCurrentlyUploading}
                          />
                          <div className={`px-3 py-2 rounded border transition-colors text-xs font-semibold ${gc.redemptionReceiptUrl
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            : 'bg-bg-tertiary border-border-main text-text-main hover:bg-bg-main'
                            }`} title={t('giftcards.tooltips.redemptionReceipt')}>
                            {isCurrentlyUploading && uploadingCardId === gc.id && uploadType === 'redemption' ? (
                              <span>{Math.round(progress)}%</span>
                            ) : (
                              <span>{t('giftcards.buttons.redemptionReceipt')}</span>
                            )}
                          </div>
                        </label>

                        {/* Ver evidencias si existen */}
                        {(gc.receiptUrl || gc.redemptionReceiptUrl) && (
                          <div className="relative">
                            <button
                              className="px-3 py-2 rounded border border-border-main bg-bg-tertiary text-text-main hover:bg-bg-main transition-colors text-xs font-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                const links = [];
                                if (gc.receiptUrl) links.push(gc.receiptUrl);
                                if (gc.redemptionReceiptUrl) links.push(gc.redemptionReceiptUrl);

                                // Abrir cada documento en una nueva pestaña
                                links.forEach(link => window.open(link, '_blank'));
                              }}
                              title={t('giftcards.tooltips.viewDocuments')}
                            >
                              {t('giftcards.buttons.viewDocuments')}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredGiftCards && filteredGiftCards.length === 0 && (
            <p className="text-center text-text-muted p-8">{t('giftcards.noData')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftCardPage;
// ===== FIN: src/pages/GiftCardPage.jsx (Sprint 98) =====
