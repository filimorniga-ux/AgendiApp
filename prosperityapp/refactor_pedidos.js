const fs = require('fs');

const path = '/Users/miguelperdomoserrato/AgendiApp-Project/prosperityapp/src/pages/PedidosPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add ErrorBoundary import
if (!content.includes('import ErrorBoundary')) {
  content = content.replace(
    "import { parseDate } from '../lib/dateUtils';",
    "import { parseDate } from '../lib/dateUtils';\nimport ErrorBoundary from '../components/ErrorBoundary';"
  );
}

// 2. Rename PedidosPage to PedidosPageContent
content = content.replace('const PedidosPage = () => {', 'const PedidosPageContent = () => {');

// 3. Create the memoized components above PedidosPageContent
const memoizedComponents = `
// --- MEMOIZED COMPONENTS PARA OPTIMIZACIÓN ---

const SupplierCard = React.memo(({ supplier, onDelete, t }) => {
    return (
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-main shadow-sm">
            <h3 className="font-bold text-text-main text-lg mb-1">{supplier.name}</h3>
            <p className="text-sm text-text-muted flex items-center gap-2"><i data-feather="user" className="w-4 h-4"></i> {supplier.contact}</p>
            <p className="text-sm text-text-muted flex items-center gap-2"><i data-feather="phone" className="w-4 h-4"></i> {supplier.phone}</p>
            <div className="mt-3 pt-3 border-t border-border-main/50 text-xs text-text-secondary">
                <p><strong>{t('orders.suppliers.bank')}:</strong> {supplier.bank}</p>
                <p><strong>{t('orders.suppliers.account')}:</strong> {supplier.account}</p>
            </div>
            <button onClick={() => onDelete('suppliers', supplier.id)} className="mt-2 text-red-400 hover:text-red-500 text-xs flex items-center gap-1"><i data-feather="trash-2" className="w-3 h-3"></i> {t('common.delete')}</button>
        </div>
    );
});

const InvoiceRow = React.memo(({ inv, onDelete }) => {
    return (
        <tr className="border-b border-border-main text-sm hover:bg-bg-tertiary">
            <td className="p-3 text-text-main">{inv.date ? parseDate(inv.date).toLocaleDateString() : 'N/A'}</td>
            <td className="p-3 text-text-main font-semibold">{inv.supplierName}</td>
            <td className="p-3 text-text-muted">{inv.rut || '-'}</td>
            <td className="p-3 text-text-muted">{inv.brand || '-'}</td>
            <td className="p-3 text-text-muted">
                <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs">{inv.category || 'General'}</span>
            </td>
            <td className="p-3 text-text-muted">{inv.method}</td>
            <td className="p-3 text-right">
                {inv.invoiceUrl ? (
                    <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline mr-3 text-xs flex items-center justify-end gap-1">
                        <i data-feather="file-text" className="w-3 h-3"></i> Ver
                    </a>
                ) : (
                    <span className="text-text-muted mr-3 text-xs">Sin archivo</span>
                )}
                <button onClick={() => onDelete('invoices', inv.id)} className="text-red-400"><i data-feather="trash-2" className="w-4 h-4"></i></button>
            </td>
        </tr>
    );
});

const DebtRow = React.memo(({ debt, onDelete, onDetails }) => {
    return (
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-main flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1">
                <h4 className="font-bold text-text-main text-lg">{debt.supplierName}</h4>
                <p className="text-xs text-text-muted">Ref: {debt.invoiceRef || 'N/A'}</p>
                <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-green-400 font-semibold">Pagado: {formatCurrency(debt.paidAmount)}</span>
                    <span className="text-red-400 font-bold">Pendiente: {formatCurrency(debt.pendingAmount)}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-bg-tertiary h-2 rounded-full mt-2 overflow-hidden">
                    <div
                        className="bg-accent h-full transition-all"
                        style={{ width: \`\${(debt.paidAmount / debt.totalAmount) * 100}%\` }}
                    ></div>
                </div>
            </div>
            <div className="text-center flex flex-col gap-2">
                <span className={\`px-3 py-1 rounded-full text-xs font-bold \${debt.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}\`}>
                    {debt.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                </span>
                <button
                    onClick={() => onDetails(debt)}
                    className="text-xs text-accent hover:underline"
                >
                    Ver Detalles / Pagar
                </button>
            </div>
            <div>
                <button onClick={() => onDelete('debts', debt.id)} className="ml-2 text-text-muted hover:text-red-400 p-2"><i data-feather="trash-2" className="w-4 h-4"></i></button>
            </div>
        </div>
    );
});

const PedidosPageContent = () => {
`;

content = content.replace('const PedidosPageContent = () => {', memoizedComponents);

// 4. Update the handleDelete to be a useCallback
content = content.replace(
  "const handleDelete = async (collectionName, id) => {",
  "const handleDelete = React.useCallback(async (collectionName, id) => {"
);
content = content.replace(
  "toast.error(t('common.error')); }\n    };",
  "toast.error(t('common.error')); }\n    }, [t]);"
);

// Add useCallback to open debt details
const onDetailsCallback = `
    const handleDebtDetails = React.useCallback((debt) => {
        setSelectedDebt(debt);
        setModalType('debtDetails');
        setIsModalOpen(true);
    }, []);
`;
content = content.replace('// --- RENDERERS ---', onDetailsCallback + '\n    // --- RENDERERS ---');

// 5. Replace render contents with memoized components
const renderSuppliersOld = `        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers?.map(s => (
                <div key={s.id} className="bg-bg-secondary p-4 rounded-lg border border-border-main shadow-sm">
                    <h3 className="font-bold text-text-main text-lg mb-1">{s.name}</h3>
                    <p className="text-sm text-text-muted flex items-center gap-2"><i data-feather="user" className="w-4 h-4"></i> {s.contact}</p>
                    <p className="text-sm text-text-muted flex items-center gap-2"><i data-feather="phone" className="w-4 h-4"></i> {s.phone}</p>
                    <div className="mt-3 pt-3 border-t border-border-main/50 text-xs text-text-secondary">
                        <p><strong>{t('orders.suppliers.bank')}:</strong> {s.bank}</p>
                        <p><strong>{t('orders.suppliers.account')}:</strong> {s.account}</p>
                    </div>
                    <button onClick={() => handleDelete('suppliers', s.id)} className="mt-2 text-red-400 hover:text-red-500 text-xs flex items-center gap-1"><i data-feather="trash-2" className="w-3 h-3"></i> {t('common.delete')}</button>
                </div>
            ))}
            {(suppliers || []).length === 0 && <p className="text-text-muted p-4">{t('dashboard.noData')}</p>}
        </div>`;

const renderSuppliersNew = `        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers?.map(s => (
                <SupplierCard key={s.id} supplier={s} onDelete={handleDelete} t={t} />
            ))}
            {(suppliers || []).length === 0 && <p className="text-text-muted p-4">{t('dashboard.noData')}</p>}
        </div>`;

content = content.replace(renderSuppliersOld, renderSuppliersNew);


const renderInvoicesOld = `                <tbody>
                    {invoices?.map(inv => (
                        <tr key={inv.id} className="border-b border-border-main text-sm hover:bg-bg-tertiary">
                            <td className="p-3 text-text-main">{inv.date ? parseDate(inv.date).toLocaleDateString() : 'N/A'}</td>
                            <td className="p-3 text-text-main font-semibold">{inv.supplierName}</td>
                            <td className="p-3 text-text-muted">{inv.rut || '-'}</td>
                            <td className="p-3 text-text-muted">{inv.brand || '-'}</td>
                            <td className="p-3 text-text-muted">
                                <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs">{inv.category || 'General'}</span>
                            </td>
                            <td className="p-3 text-text-muted">{inv.method}</td>
                            <td className="p-3 text-right">
                                {inv.invoiceUrl ? (
                                    <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline mr-3 text-xs flex items-center justify-end gap-1">
                                        <i data-feather="file-text" className="w-3 h-3"></i> Ver
                                    </a>
                                ) : (
                                    <span className="text-text-muted mr-3 text-xs">Sin archivo</span>
                                )}
                                <button onClick={() => handleDelete('invoices', inv.id)} className="text-red-400"><i data-feather="trash-2" className="w-4 h-4"></i></button>
                            </td>
                        </tr>
                    ))}
                </tbody>`;

const renderInvoicesNew = `                <tbody>
                    {invoices?.map(inv => (
                        <InvoiceRow key={inv.id} inv={inv} onDelete={handleDelete} />
                    ))}
                </tbody>`;

content = content.replace(renderInvoicesOld, renderInvoicesNew);

const renderDebtsOld = `        <div className="space-y-4">
            {debts?.map(debt => (
                <div key={debt.id} className="bg-bg-secondary p-4 rounded-lg border border-border-main flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1">
                        <h4 className="font-bold text-text-main text-lg">{debt.supplierName}</h4>
                        <p className="text-xs text-text-muted">Ref: {debt.invoiceRef || 'N/A'}</p>
                        <div className="mt-2 flex gap-4 text-sm">
                            <span className="text-green-400 font-semibold">Pagado: {formatCurrency(debt.paidAmount)}</span>
                            <span className="text-red-400 font-bold">Pendiente: {formatCurrency(debt.pendingAmount)}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-bg-tertiary h-2 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-accent h-full transition-all"
                                style={{ width: \`\${(debt.paidAmount / debt.totalAmount) * 100}%\` }}
                            ></div>
                        </div>
                    </div>
                    <div className="text-center flex flex-col gap-2">
                        <span className={\`px-3 py-1 rounded-full text-xs font-bold \${debt.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}\`}>
                            {debt.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                        <button
                            onClick={() => { setSelectedDebt(debt); setModalType('debtDetails'); setIsModalOpen(true); }}
                            className="text-xs text-accent hover:underline"
                        >
                            Ver Detalles / Pagar
                        </button>
                    </div>
                    <div>
                        <button onClick={() => handleDelete('debts', debt.id)} className="ml-2 text-text-muted hover:text-red-400 p-2"><i data-feather="trash-2" className="w-4 h-4"></i></button>
                    </div>
                </div>
            ))}
            {(debts || []).length === 0 && <p className="text-text-muted p-4 text-center">{t('dashboard.noData')}</p>}
        </div>`;

const renderDebtsNew = `        <div className="space-y-4">
            {debts?.map(debt => (
                <DebtRow key={debt.id} debt={debt} onDelete={handleDelete} onDetails={handleDebtDetails} />
            ))}
            {(debts || []).length === 0 && <p className="text-text-muted p-4 text-center">{t('dashboard.noData')}</p>}
        </div>`;
        
content = content.replace(renderDebtsOld, renderDebtsNew);

// 6. Append the actual PedidosPage that wraps PedidosPageContent in ErrorBoundary
const wrapComponent = `
const PedidosPage = () => (
    <ErrorBoundary>
        <PedidosPageContent />
    </ErrorBoundary>
);

export default PedidosPage;
`;

content = content.replace('export default PedidosPage;', wrapComponent);

fs.writeFileSync(path, content, 'utf-8');
console.log("PedidosPage.jsx updated successfully.");

