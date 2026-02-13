// ===== INICIO: src/components/modals/TimeClockModal.jsx =====
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, orderBy, limit, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import SearchableDropdown from '../ui/SearchableDropdown';

const TimeClockModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { collaborators } = useData();
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(false);

  // Buscar estado actual del colaborador seleccionado
  useEffect(() => {
    const fetchStatus = async () => {
      if (!selectedCollab) {
        setCurrentShift(null);
        return;
      }
      setLoading(true);
      try {
        // Buscar si tiene un turno abierto hoy
        const todayStr = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, 'workShifts'),
          where('collaboratorId', '==', selectedCollab.id),
          where('dateStr', '==', todayStr),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setCurrentShift({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setCurrentShift(null); // No ha marcado entrada hoy
        }
      } catch (error) {
        console.error("Error fetching shift:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [selectedCollab, isOpen]);

  const handleAction = async (actionType) => {
    if (!selectedCollab) return;
    setLoading(true);
    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const shiftsRef = collection(db, 'workShifts');

        if (actionType === 'checkIn') {
            // Crear nuevo turno
            await addDoc(shiftsRef, {
                collaboratorId: selectedCollab.id,
                collaboratorName: selectedCollab.name,
                dateStr: todayStr,
                checkIn: serverTimestamp(),
                status: 'working',
                createdAt: serverTimestamp()
            });
        } else if (currentShift) {
            // Actualizar turno existente
            const docRef = doc(db, 'workShifts', currentShift.id);
            const updateData = { status: 'working' }; // Default return status

            if (actionType === 'lunchStart') {
                updateData.lunchStart = serverTimestamp();
                updateData.status = 'lunch';
            } else if (actionType === 'lunchEnd') {
                updateData.lunchEnd = serverTimestamp();
                updateData.status = 'working';
            } else if (actionType === 'checkOut') {
                updateData.checkOut = serverTimestamp();
                updateData.status = 'finished';
            }

            await updateDoc(docRef, updateData);
        }

        toast.success(t('hr.success'));
        // Refrescar estado local (simulado re-ejecutando el effect al limpiar y setear de nuevo)
        const tempCollab = selectedCollab;
        setSelectedCollab(null); 
        setTimeout(() => setSelectedCollab(tempCollab), 100);

    } catch (error) {
        console.error(error);
        toast.error(t('common.error'));
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Determinar qué botones mostrar
  let statusText = t('hr.status.notStarted');
  let buttons = [];

  if (!currentShift) {
      buttons.push({ key: 'checkIn', label: t('hr.actions.checkIn'), color: 'bg-green-600' });
  } else {
      if (currentShift.status === 'working') {
          statusText = t('hr.status.working');
          if (!currentShift.lunchStart) {
              buttons.push({ key: 'lunchStart', label: t('hr.actions.lunchStart'), color: 'bg-yellow-600' });
          }
          buttons.push({ key: 'checkOut', label: t('hr.actions.checkOut'), color: 'bg-red-600' });
      } else if (currentShift.status === 'lunch') {
          statusText = t('hr.status.lunch');
          buttons.push({ key: 'lunchEnd', label: t('hr.actions.lunchEnd'), color: 'bg-green-600' });
      } else if (currentShift.status === 'finished') {
          statusText = t('hr.status.finished');
      }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
      <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-md modal-content flex flex-col">
        <div className="p-4 border-b border-border-main flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-main">{t('hr.title')}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
            {/* Selector de Colaborador */}
            <div>
                <label className="block text-sm font-medium text-text-muted mb-2">{t('hr.selectStaff')}</label>
                <SearchableDropdown 
                    items={collaborators || []} 
                    placeholder={t('modals.forms.collabSearch')} 
                    onSelect={setSelectedCollab} 
                    initialValue={selectedCollab} 
                />
            </div>

            {/* Estado y Acciones */}
            {selectedCollab && (
                <div className="bg-bg-tertiary/30 p-4 rounded-lg border border-border-main text-center animate-fade-in">
                    <p className="text-sm text-text-muted mb-1">{t('hr.todayStatus')}</p>
                    <p className="text-2xl font-bold text-accent mb-6">{statusText}</p>

                    {loading ? (
                        <p className="text-text-muted">{t('common.loading')}</p>
                    ) : (
                        <div className="grid gap-3">
                            {buttons.map(btn => (
                                <button
                                    key={btn.key}
                                    onClick={() => handleAction(btn.key)}
                                    className={`w-full py-3 rounded-md font-bold text-white shadow-md hover:brightness-110 transition-all ${btn.color}`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TimeClockModal;
// ===== FIN: src/components/modals/TimeClockModal.jsx =====