// ===== INICIO: src/components/modals/TimeClockModal.jsx =====
import React, { useRef,  useState, useEffect  } from 'react';
import { sbCreate, sbUpdate, sbGetAll } from '../../supabase/db';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import SearchableDropdown from '../ui/SearchableDropdown';
import { parseDate } from '../../lib/dateUtils';

import { useCollaborators } from '../../context/collections/CollaboratorsContext';
import { useBusiness } from '../../context/BusinessContext';

const TimeClockModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    const {
        collaborators
    } = useCollaborators();

    const {
        businessId
    } = useBusiness();

    const [selectedCollab, setSelectedCollab] = useState(null);
    const [currentShift, setCurrentShift] = useState(null);
    const [loading, setLoading] = useState(false);

    // Buscar estado actual del colaborador seleccionado
    useEffect(() => {
      const fetchStatus = async () => {
        if (!selectedCollab) { setCurrentShift(null); return; }
        setLoading(true);
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          const { data, error } = await sbGetAll('workShifts', businessId, {
            filters: { collaborator_id: selectedCollab.id, date_str: todayStr }
          });
          if (error) throw error;
          setCurrentShift(data && data.length > 0 ? data[0] : null);
        } catch (error) {
          console.warn('Error fetching shift:', error);
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

          if (actionType === 'checkIn') {
              const { error } = await sbCreate('workShifts', {
                  collaboratorId: selectedCollab.id,
                  collaboratorName: selectedCollab.name,
                  dateStr: todayStr,
                  checkIn: now.toISOString(),
                  status: 'working',
              }, businessId);
              if (error) throw error;
          } else if (currentShift) {
              const updateData = { status: 'working' };
              if (actionType === 'lunchStart') { updateData.lunchStart = now.toISOString(); updateData.status = 'lunch'; }
              else if (actionType === 'lunchEnd') { updateData.lunchEnd = now.toISOString(); updateData.status = 'working'; }
              else if (actionType === 'checkOut') { updateData.checkOut = now.toISOString(); updateData.status = 'finished'; }
              const { error } = await sbUpdate('workShifts', currentShift.id, updateData);
              if (error) throw error;
          }

          toast.success(t('hr.success'));
          const tempCollab = selectedCollab;
          setSelectedCollab(null);
          setTimeout(() => setSelectedCollab(tempCollab), 100);
      } catch (error) {
          console.warn(error);
          toast.error(t('common.error'));
      } finally {
          setLoading(false);
      }
    };



  const modalRef = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Foco inicial
      setTimeout(() => {
        if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
           const focusableElements = modalRef.current.querySelectorAll(
             'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
           );
           if (focusableElements.length > 0) {
             focusableElements[0].focus();
           }
        }
      }, 100);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);


  if (!isOpen) return null;

    // Determinar qué botones mostrar
    let statusText = t('hr.status.notStarted');
    let buttons = [];

    if (!currentShift) {
        buttons.push({ key: 'checkIn', label: t('hr.actions.checkIn'), color: 'bg-green-600' });
    } else {
        const lunchStartDate = currentShift.lunchStart ?? currentShift.lunch_start ? parseDate(currentShift.lunchStart ?? currentShift.lunch_start) : null;

        if (currentShift.status === 'working') {
            statusText = t('hr.status.working');
            if (!lunchStartDate) {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop" ref={modalRef} tabIndex="-1">
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