import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import feather from 'feather-icons';
import Papa from 'papaparse';
import VCard from 'vcf';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const ContactImportModal = ({ isOpen, onClose, onImportComplete }) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const [parsedContacts, setParsedContacts] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importSummary, setImportSummary] = useState(null);
    const fileInputRef = useRef();

    if (!isOpen) return null;

    const parseVCF = (text) => {
        const contacts = [];
        const cards = VCard.parse(text);

        (Array.isArray(cards) ? cards : [cards]).forEach(card => {
            try {
                const name = card.get('fn')?.valueOf() || card.get('n')?.valueOf() || 'Sin nombre';
                const phone = card.get('tel')?.valueOf() || '';
                const email = card.get('email')?.valueOf() || '';

                if (phone || email) {
                    contacts.push({
                        name: typeof name === 'string' ? name : name.join(' '),
                        phone: typeof phone === 'string' ? phone : phone[0] || '',
                        email: typeof email === 'string' ? email : email[0] || '',
                        source: 'VCF'
                    });
                }
            } catch (err) {
                console.warn('Error parsing vCard:', err);
            }
        });

        return contacts;
    };

    const parseCSV = (text) => {
        return new Promise((resolve) => {
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const contacts = results.data
                        .filter(row => row.Nombre || row.Teléfono || row.Telefono || row.Phone)
                        .map(row => ({
                            name: row.Nombre || row.Name || 'Sin nombre',
                            phone: row.Teléfono || row.Telefono || row.Phone || '',
                            email: row.Email || row.Correo || '',
                            source: 'CSV'
                        }));
                    resolve(contacts);
                }
            });
        });
    };

    const handleFileSelect = async (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            let contacts = [];

            try {
                if (file.name.endsWith('.vcf')) {
                    contacts = parseVCF(text);
                } else if (file.name.endsWith('.csv')) {
                    contacts = await parseCSV(text);
                } else {
                    // Try both
                    try {
                        contacts = parseVCF(text);
                    } catch {
                        contacts = await parseCSV(text);
                    }
                }

                if (contacts.length === 0) {
                    toast.error(t('clients.importModal.noContactsFound'));
                    return;
                }

                setParsedContacts(contacts);
                toast.success(`${contacts.length} ${t('clients.importModal.contactsFound')}`);
            } catch (error) {
                console.warn('Error parsing file:', error);
                toast.error(t('clients.importModal.parseError'));
            }
        };

        reader.readAsText(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleImport = async () => {
        setIsImporting(true);
        let imported = 0;
        let duplicates = 0;
        let errors = 0;

        try {
            // Get existing clients to check for duplicates
            const clientsSnapshot = await getDocs(collection(db, 'clients'));
            const existingPhones = new Set(
                clientsSnapshot.docs.map(doc => doc.data().phone).filter(Boolean)
            );

            for (const contact of parsedContacts) {
                try {
                    // Skip if duplicate
                    if (contact.phone && existingPhones.has(contact.phone)) {
                        duplicates++;
                        continue;
                    }

                    // Import contact
                    await addDoc(collection(db, 'clients'), {
                        name: contact.name,
                        phone: contact.phone || '',
                        email: contact.email || '',
                        createdAt: new Date(),
                        source: contact.source
                    });

                    imported++;
                    existingPhones.add(contact.phone);
                } catch (err) {
                    console.warn('Error importing contact:', err);
                    errors++;
                }
            }

            setImportSummary({ imported, duplicates, errors, total: parsedContacts.length });
            toast.success(t('clients.importModal.importComplete'));

            if (onImportComplete) {
                onImportComplete();
            }
        } catch (error) {
            console.warn('Error during import:', error);
            toast.error(t('common.error'));
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setParsedContacts([]);
        setImportSummary(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
            <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-border-main flex justify-between items-center">
                    <h3 className="text-xl font-bold text-text-main">{t('clients.importModal.title')}</h3>
                    <button onClick={handleClose} className="text-text-muted hover:text-text-main">
                        <i data-feather="x"></i>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {!importSummary ? (
                        <>
                            {/* Upload Area */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-accent bg-accent/10' : 'border-border-main'
                                    }`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                <i data-feather="upload-cloud" className="w-12 h-12 mx-auto mb-4 text-text-muted"></i>
                                <p className="text-lg font-semibold text-text-main mb-2">
                                    {t('clients.importModal.dragDrop')}
                                </p>
                                <p className="text-sm text-text-muted mb-4">
                                    {t('clients.importModal.supportedFormats')}
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn-golden px-6 py-2"
                                >
                                    {t('clients.importModal.selectFile')}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".vcf,.csv"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                            </div>

                            {/* Preview */}
                            {parsedContacts.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-lg text-text-main mb-3">
                                        {t('clients.importModal.preview')} ({parsedContacts.length})
                                    </h4>
                                    <div className="bg-bg-tertiary rounded-lg border border-border-main max-h-64 overflow-y-auto">
                                        <table className="w-full">
                                            <thead className="bg-bg-main sticky top-0">
                                                <tr>
                                                    <th className="text-left p-3 text-sm font-semibold text-text-muted">Nombre</th>
                                                    <th className="text-left p-3 text-sm font-semibold text-text-muted">Teléfono</th>
                                                    <th className="text-left p-3 text-sm font-semibold text-text-muted">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedContacts.slice(0, 50).map((contact, idx) => (
                                                    <tr key={idx} className="border-t border-border-main">
                                                        <td className="p-3 text-sm text-text-main">{contact.name}</td>
                                                        <td className="p-3 text-sm text-text-main">{contact.phone}</td>
                                                        <td className="p-3 text-sm text-text-muted">{contact.email}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {parsedContacts.length > 50 && (
                                            <p className="p-3 text-center text-sm text-text-muted">
                                                ... y {parsedContacts.length - 50} más
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Summary */
                        <div className="text-center py-8">
                            <i data-feather="check-circle" className="w-16 h-16 mx-auto mb-4 text-green-500"></i>
                            <h4 className="text-2xl font-bold text-text-main mb-6">
                                {t('clients.importModal.summary')}
                            </h4>
                            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                    <p className="text-3xl font-bold text-green-500">{importSummary.imported}</p>
                                    <p className="text-sm text-text-muted">{t('clients.importModal.imported')}</p>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                    <p className="text-3xl font-bold text-yellow-500">{importSummary.duplicates}</p>
                                    <p className="text-sm text-text-muted">{t('clients.importModal.duplicates')}</p>
                                </div>
                                {importSummary.errors > 0 && (
                                    <div className="col-span-2 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                        <p className="text-3xl font-bold text-red-500">{importSummary.errors}</p>
                                        <p className="text-sm text-text-muted">{t('clients.importModal.errors')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border-main flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-text-muted hover:text-text-main transition-colors"
                    >
                        {importSummary ? t('common.close') : t('common.cancel')}
                    </button>
                    {!importSummary && parsedContacts.length > 0 && (
                        <button
                            onClick={handleImport}
                            disabled={isImporting}
                            className="btn-golden px-6 py-2 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isImporting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    {t('clients.importModal.importing')}
                                </>
                            ) : (
                                <>
                                    <i data-feather="upload" className="w-4 h-4"></i>
                                    {t('clients.importModal.import')}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactImportModal;
