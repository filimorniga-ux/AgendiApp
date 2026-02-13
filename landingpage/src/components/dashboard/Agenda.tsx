import React, { useState, useEffect, useMemo } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
    Calendar,
    Clock,
    Plus,
    User,
    X,
    ChevronLeft,
    ChevronRight,
    MapPin,
    DollarSign,
    Scissors
} from 'lucide-react';

// --- INTERFACES ---

export interface Staff {
    id: string;
    name: string;
    email: string;
    role: 'staff' | 'admin'; // Incluimos admin porque a veces también atienden
    photoURL?: string;
}

export interface Appointment {
    id?: string;
    clientName: string;
    clientPhone?: string;
    serviceName: string;
    date: Date; // En Firestore es Timestamp, pero lo convertiremos a Date
    durationMinutes: number;
    staffId: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    price: number;
    notes?: string;
}

// --- COMPONENTE PRINCIPAL ---

export const Agenda = ({ isDarkMode }: { isDarkMode: boolean }) => {
    // Estados de Datos
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados de UI
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // --- 1. CARGAR PERSONAL (STAFF) ---
    useEffect(() => {
        // Escuchamos usuarios que sean 'staff' o 'admin' (para que aparezcan en columnas)
        const q = query(
            collection(db, "users"),
            where("role", "in", ["staff", "admin"])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const staffData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Staff[];

            // Ordenar alfabéticamente
            staffData.sort((a, b) => a.name.localeCompare(b.name));
            setStaffMembers(staffData);
        }, (error) => {
            console.error("Error cargando staff:", error);
        });

        return () => unsubscribe();
    }, []);

    // --- 2. CARGAR CITAS (APPOINTMENTS) ---
    useEffect(() => {
        // Definir rango del día seleccionado (00:00 a 23:59)
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        const q = query(
            collection(db, "appointments"),
            where("date", ">=", startOfDay),
            where("date", "<=", endOfDay)
            // Nota: Firestore requiere índice compuesto para filtrar por rango y ordenar.
            // Si falla, ver consola para crear el índice.
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
                };
            }) as Appointment[];

            setAppointments(apps);
            setLoading(false);
        }, (error) => {
            console.error("Error cargando citas:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentDate]);

    // --- HELPERS ---

    const changeDate = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'no_show': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDERIZADO ---

    return (
        <div className={`flex flex-col h-full min-h-[600px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>

            {/* HEADER: FECHA Y ACCIONES */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-slate-500/20">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-500/20 rounded-lg transition-colors">
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex flex-col items-center min-w-[150px]">
                        <span className="text-xs uppercase tracking-widest opacity-70">
                            {currentDate.toLocaleDateString('es-ES', { weekday: 'long' })}
                        </span>
                        <span className="font-bold text-lg">
                            {currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                        </span>
                    </div>

                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-500/20 rounded-lg transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <button
                    onClick={() => { setEditingAppointment(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-[#f6e05e] hover:bg-[#e6d04e] text-slate-900 px-4 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                    <Plus size={18} />
                    <span>Nueva Cita</span>
                </button>
            </div>

            {/* KANBAN BOARD */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                    {/* COLUMNA SIN ASIGNAR (SI HAY CITAS SIN STAFF) */}
                    {appointments.some(a => !a.staffId) && (
                        <div className={`w-72 flex-shrink-0 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="p-3 border-b border-slate-500/10 font-bold text-center text-red-400">
                                Sin Asignar
                            </div>
                            <div className="p-2 space-y-2">
                                {appointments.filter(a => !a.staffId).map(app => (
                                    <AppointmentCard
                                        key={app.id}
                                        appointment={app}
                                        onClick={() => { setEditingAppointment(app); setIsModalOpen(true); }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* COLUMNAS POR ESTILISTA */}
                    {staffMembers.length === 0 && !loading ? (
                        <div className="w-full text-center py-10 opacity-50">
                            No hay estilistas registrados. Crea usuarios con rol 'staff'.
                        </div>
                    ) : (
                        staffMembers.map(staff => (
                            <div key={staff.id} className={`w-72 flex-shrink-0 rounded-xl border flex flex-col ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200'}`}>
                                {/* HEADER COLUMNA */}
                                <div className={`p-3 border-b border-slate-500/10 flex items-center gap-3 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} rounded-t-xl`}>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                        {staff.name.charAt(0)}
                                    </div>
                                    <span className="font-bold truncate">{staff.name}</span>
                                    <span className="ml-auto text-xs opacity-50 bg-slate-500/10 px-2 py-0.5 rounded-full">
                                        {appointments.filter(a => a.staffId === staff.id).length}
                                    </span>
                                </div>

                                {/* LISTA DE CITAS */}
                                <div className="p-2 space-y-2 flex-1 overflow-y-auto min-h-[200px]">
                                    {appointments
                                        .filter(a => a.staffId === staff.id)
                                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                                        .map(app => (
                                            <AppointmentCard
                                                key={app.id}
                                                appointment={app}
                                                onClick={() => { setEditingAppointment(app); setIsModalOpen(true); }}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <AppointmentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingAppointment}
                    staffMembers={staffMembers}
                    currentDate={currentDate}
                    isDarkMode={isDarkMode}
                />
            )}
        </div>
    );
};

// --- SUBCOMPONENTES ---

const AppointmentCard = ({ appointment, onClick }: { appointment: Appointment, onClick: () => void }) => {
    const statusColors = {
        pending: 'border-l-yellow-500',
        confirmed: 'border-l-blue-500',
        completed: 'border-l-green-500',
        cancelled: 'border-l-red-500',
        no_show: 'border-l-gray-500'
    };

    return (
        <div
            onClick={onClick}
            className={`p-3 rounded-lg border border-slate-500/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all border-l-4 ${statusColors[appointment.status] || 'border-l-slate-500'} shadow-sm`}
        >
            <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm">{appointment.clientName}</span>
                <span className="text-xs font-mono opacity-70 bg-slate-500/10 px-1 rounded">
                    {appointment.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <div className="text-xs opacity-70 flex items-center gap-1 mb-2">
                <Scissors size={10} />
                {appointment.serviceName}
            </div>
            <div className="flex justify-between items-center mt-2">
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-500/10`}>
                    {appointment.status}
                </span>
                <span className="text-xs font-bold text-[#f6e05e]">
                    ${appointment.price}
                </span>
            </div>
        </div>
    );
};

const AppointmentModal = ({
    isOpen,
    onClose,
    initialData,
    staffMembers,
    currentDate,
    isDarkMode
}: {
    isOpen: boolean,
    onClose: () => void,
    initialData: Appointment | null,
    staffMembers: Staff[],
    currentDate: Date,
    isDarkMode: boolean
}) => {
    const [formData, setFormData] = useState<Partial<Appointment>>({
        clientName: '',
        serviceName: '',
        price: 0,
        durationMinutes: 30,
        status: 'pending',
        staffId: staffMembers[0]?.id || '',
        date: currentDate
    });

    const [time, setTime] = useState("09:00");

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            const d = new Date(initialData.date);
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            setTime(`${hours}:${minutes}`);
        } else {
            // Reset para nueva cita
            setFormData(prev => ({
                ...prev,
                date: currentDate,
                staffId: staffMembers[0]?.id || ''
            }));
        }
    }, [initialData, currentDate, staffMembers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Combinar fecha y hora
        const [hours, minutes] = time.split(':').map(Number);
        const finalDate = new Date(currentDate);
        finalDate.setHours(hours, minutes, 0, 0);

        const payload = {
            ...formData,
            date: finalDate,
            price: Number(formData.price),
            durationMinutes: Number(formData.durationMinutes)
        };

        try {
            if (initialData?.id) {
                // Editar
                await updateDoc(doc(db, "appointments", initialData.id), payload);
            } else {
                // Crear
                await addDoc(collection(db, "appointments"), payload);
            }
            onClose();
        } catch (error) {
            console.error("Error guardando cita:", error);
            alert("Error al guardar. Revisa la consola.");
        }
    };

    if (!isOpen) return null;

    const inputClass = `w-full p-2 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'} focus:ring-2 focus:ring-[#f6e05e] focus:border-transparent outline-none transition-all`;
    const labelClass = `block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} animate-in zoom-in-95 duration-200`}>
                <div className="p-4 border-b border-slate-500/10 flex justify-between items-center bg-[#f6e05e]/10">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        {initialData ? <><Clock size={20} /> Editar Cita</> : <><Plus size={20} /> Nueva Cita</>}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Hora</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Duración (min)</label>
                            <select
                                value={formData.durationMinutes}
                                onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                                className={inputClass}
                            >
                                <option value="15">15 min</option>
                                <option value="30">30 min</option>
                                <option value="45">45 min</option>
                                <option value="60">1 hora</option>
                                <option value="90">1.5 horas</option>
                                <option value="120">2 horas</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Cliente</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 opacity-50" size={16} />
                            <input
                                type="text"
                                placeholder="Nombre del cliente"
                                value={formData.clientName}
                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                className={`${inputClass} pl-10`}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Servicio</label>
                        <div className="relative">
                            <Scissors className="absolute left-3 top-2.5 opacity-50" size={16} />
                            <input
                                type="text"
                                placeholder="Corte, Tinte, Barba..."
                                value={formData.serviceName}
                                onChange={e => setFormData({ ...formData, serviceName: e.target.value })}
                                className={`${inputClass} pl-10`}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Estilista</label>
                            <select
                                value={formData.staffId}
                                onChange={e => setFormData({ ...formData, staffId: e.target.value })}
                                className={inputClass}
                                required
                            >
                                <option value="" disabled>Seleccionar...</option>
                                {staffMembers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Precio ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 opacity-50" size={16} />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className={`${inputClass} pl-10`}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Estado</label>
                        <div className="flex gap-2 flex-wrap">
                            {['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: status as any })}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${formData.status === status
                                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                                            : 'bg-transparent border-slate-300 text-slate-500 hover:border-slate-500'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 rounded-xl font-bold bg-[#f6e05e] hover:bg-[#e6d04e] text-slate-900 shadow-lg hover:shadow-xl transition-all"
                        >
                            {initialData ? 'Guardar Cambios' : 'Crear Cita'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
