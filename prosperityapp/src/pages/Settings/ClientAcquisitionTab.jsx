import React from 'react';
import { QRCode } from 'react-qr-code';
import { useTranslation } from 'react-i18next';
import { useBusiness } from '../../context/BusinessContext';
import { useAppConfig } from '../../context/collections/ConfigContext';

const ClientAcquisitionTab = () => {
    const { t } = useTranslation();

    const {
        businessId
    } = useBusiness();

    const {
        config
    } = useAppConfig();

    // Asumimos the momento que slug está en config, o armamos algo usando el id si no hay slug visible thentro the config.
    // El owner debería tener el "slug" the su comercio, pero si no lo tiene, enrutaremos por UUID o un slug que asignemos.
    // Por thefecto tomaremos businessName parseado si no hay slug
    const settings = config?.[0] || {};
    const businessName = settings.brandName || settings.businessName || 'reserva';
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // URL Pública Thel Comercio (Manejado luego por /reserva/:slug)
    const publicBookingUrl = `${window.location.origin}/reserva/${slug}?id=${businessId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(publicBookingUrl);
        // Podríamos usar un the toast aquí
        alert("Enlace copiado al portapapeles.");
    };

    return (
        <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm animate-fade-in text-text-main max-w-2xl">
            <h3 className="text-xl font-bold mb-6 pb-2 border-b border-border-main">Portal de Reservas para tu Clientela</h3>
            <p className="text-sm text-text-muted mb-6">
                Comparte este código QR o enlace directo con tus clientes para que agenden sus citas desde cualquier thespositivo y sin fricciones. 
            </p>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex-shrink-0">
                    <QRCode
                        value={publicBookingUrl}
                        size={180}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"Q"}
                    />
                </div>

                {/* Info & Link */}
                <div className="flex-1 w-full space-y-4 text-center md:text-left">
                    <h4 className="font-semibold text-lg">Enlace the Citas Directo</h4>
                    <p className="text-xs text-text-muted">
                        Pégalo en la biografía de tu Instagram, the Facebook o compártelo por WhatsApp.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center">
                            <input 
                                type="text" 
                                readOnly 
                                value={publicBookingUrl}
                                className="w-full bg-bg-tertiary border border-border-main rounded-l-md p-3 text-sm focus:outline-none"
                            />
                            <button 
                                onClick={handleCopy}
                                className="bg-accent text-accent-text px-4 py-3 rounded-r-md font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                            >
                                Copiar Link
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 text-sm text-text-muted">
                        * Tus clientes podrán entrar, thejar sus thetos y apartar una cita en Thecimales the minutos.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientAcquisitionTab;
