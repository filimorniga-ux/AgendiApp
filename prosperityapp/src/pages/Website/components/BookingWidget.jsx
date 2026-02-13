import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import SearchableDropdown from '../../../components/ui/SearchableDropdown';
import { useTranslation } from 'react-i18next';
import feather from 'feather-icons';
import { db } from '../../../firebase/config';
import { addDoc, collection, serverTimestamp, Timestamp, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const BookingWidget = () => {
    const { t } = useTranslation();
    const { services, collaborators, isLoading } = useData();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingData, setBookingData] = useState({
        service: null,
        stylist: null,
        date: '',
        time: '',
        clientName: '',
        clientEmail: ''
    });

    // Mocked time slots for now
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00'];

    const handleNext = () => {
        if (step === 1 && bookingData.service) setStep(2);
        else if (step === 2 && bookingData.stylist && bookingData.date) setStep(3);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleConfirm = async () => {
        if (!bookingData.service || !bookingData.stylist || !bookingData.date || !bookingData.time || !bookingData.clientName || !bookingData.clientEmail) {
            toast.error("Faltan datos para completar la reserva.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Identificar o Crear Cliente
            let clientId = null;
            const clientsRef = collection(db, 'clients');
            const q = query(clientsRef, where("email", "==", bookingData.clientEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Cliente existe
                clientId = querySnapshot.docs[0].id;
            } else {
                // Crear nuevo cliente
                const newClientRef = doc(collection(db, 'clients'));
                clientId = newClientRef.id;
                await setDoc(newClientRef, {
                    name: bookingData.clientName,
                    email: bookingData.clientEmail,
                    role: 'client',
                    createdAt: serverTimestamp(),
                    phone: '', // Opcional por ahora
                    preferences: {}
                });
            }

            // 2. Crear Cita
            // Crear fecha combinada para el inicio de la cita
            const [hours, minutes] = bookingData.time.split(':').map(Number);
            const startDate = new Date(bookingData.date);
            startDate.setHours(hours, minutes, 0, 0);

            // Calcular fecha de fin basada en la duración del servicio
            const durationMinutes = bookingData.service.duration || 60;
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

            const appointmentData = {
                serviceId: bookingData.service.id,
                serviceName: bookingData.service.name,
                servicePrice: bookingData.service.price,
                serviceDuration: durationMinutes,
                stylistId: bookingData.stylist.id,
                stylistName: bookingData.stylist.name,
                clientId: clientId,
                clientName: bookingData.clientName,
                clientEmail: bookingData.clientEmail,
                date: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
                time: bookingData.time,
                status: 'pending',
                createdAt: serverTimestamp(),
                source: 'web_widget'
            };

            await addDoc(collection(db, 'appointments'), appointmentData);

            toast.success("¡Reserva enviada con éxito!");

            // Resetear formulario
            setBookingData({
                service: null,
                stylist: null,
                date: '',
                time: '',
                clientName: '',
                clientEmail: ''
            });
            setStep(1);

        } catch (error) {
            console.error("Error creando reserva:", error);
            toast.error("Error al procesar la reserva. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter active stylists
    const activeStylists = useMemo(() =>
        (collaborators || []).filter(c => c.status === 'active'),
        [collaborators]);

    React.useEffect(() => {
        feather.replace();
    }, [step]);

    if (isLoading) return <div className="p-4 text-center">Cargando widget...</div>;

    return (
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-auto border border-gray-100">
            {/* Header / Progress */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                        {step === 1 && "Selecciona tu Servicio"}
                        {step === 2 && "Elige Profesional y Fecha"}
                        {step === 3 && "Tus Datos y Confirmación"}
                    </h3>
                    <span className="text-sm font-medium text-gray-400">Paso {step} de 3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Step 1: Service Selection */}
            {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué te gustaría hacerte?</label>
                        <SearchableDropdown
                            items={services || []}
                            placeholder="Buscar servicio..."
                            onSelect={(service) => setBookingData({ ...bookingData, service })}
                            initialValue={bookingData.service}
                        />
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={!bookingData.service}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors ${bookingData.service
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Continuar
                    </button>
                </div>
            )}

            {/* Step 2: Stylist & Date */}
            {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profesional Preferido</label>
                        <SearchableDropdown
                            items={activeStylists}
                            placeholder="Cualquiera disponible"
                            onSelect={(stylist) => setBookingData({ ...bookingData, stylist })}
                            initialValue={bookingData.stylist}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                            value={bookingData.date}
                            onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleBack}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Atrás
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!bookingData.stylist || !bookingData.date}
                            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${bookingData.stylist && bookingData.date
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Ver Horas
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Time & Confirmation */}
            {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm mb-4">
                        <p><span className="font-bold">Servicio:</span> {bookingData.service?.name}</p>
                        <p><span className="font-bold">Profesional:</span> {bookingData.stylist?.name}</p>
                        <p><span className="font-bold">Fecha:</span> {bookingData.date}</p>
                        <p><span className="font-bold">Precio est.:</span> ${bookingData.service?.price}</p>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 outline-none"
                                placeholder="Tu nombre"
                                value={bookingData.clientName}
                                onChange={(e) => setBookingData({ ...bookingData, clientName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 outline-none"
                                placeholder="tu@email.com"
                                value={bookingData.clientEmail}
                                onChange={(e) => setBookingData({ ...bookingData, clientEmail: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Horas Disponibles</label>
                        <div className="grid grid-cols-4 gap-2">
                            {timeSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={() => setBookingData({ ...bookingData, time })}
                                    className={`py-2 px-1 text-sm rounded border transition-all ${bookingData.time === time
                                        ? 'bg-yellow-500 text-white border-yellow-500 shadow-md transform scale-105'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-400 hover:text-yellow-600'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleBack}
                            disabled={isSubmitting}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Atrás
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!bookingData.time || !bookingData.clientName || !bookingData.clientEmail || isSubmitting}
                            className={`flex-1 py-3 rounded-lg font-semibold transition-colors shadow-lg flex justify-center items-center ${bookingData.time && bookingData.clientName && bookingData.clientEmail && !isSubmitting
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "Confirmar Reserva"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingWidget;
