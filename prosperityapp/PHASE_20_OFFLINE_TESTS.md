# Fase 20: Pruebas de Resiliencia Offline (Design)

Este documento detalla el plan de pruebas para validar la arquitectura Offline-First de AgendiApp, utilizando Dexie/IndexedDB y UI optimista.

## 1. Escenario: Registro de Venta en Caja (Modo Offline)
- **Preparación:** Iniciar sesión y cargar los datos iniciales. Desactivar la conexión a internet (Modo Avión o via DevTools).
- **Acción:**
    1. Ir a "Caja Diaria".
    2. Abrir el modal de registro de movimiento.
    3. Registrar una "Venta" o "Servicio" con un cliente existente.
- **Validación Esperada:**
    - El modal se cierra exitosamente sin errores de red.
    - El movimiento aparece inmediatamente en la columna correspondiente de `CurrentCashTab`.
    - El item muestra un icono de "nube tachada" (cloud-off) indicando sincronización pendiente.
    - El `OfflineIndicator` (banner superior) muestra "1 cambio pendiente".
    - El total de la caja se actualiza optimísticamente.

## 2. Escenario: Gestión de Agenda (Modo Offline)
- **Preparación:** Mantener el dispositivo offline.
- **Acción:**
    1. Ir a "Agenda".
    2. Crear una nueva cita para un estilista y hora específica.
- **Validación Esperada:**
    - La cita aparece en el tablero Kanban.
    - La tarjeta de la cita muestra el icono de estado offline.
    - No hay bloqueos en la UI durante el guardado.

## 3. Escenario: Sincronización Automática (Reconexión)
- **Preparación:** Tener al menos 2 cambios pendientes (de los escenarios anteriores).
- **Acción:** Restaurar la conexión a internet.
- **Validación Esperada:**
    - `OfflineIndicator` cambia a "Conexión restaurada — sincronizando...".
    - La cola en `localDb.offline_queue` se procesa secuencialmente.
    - Los iconos de "pendiente" en Caja y Agenda desaparecen al confirmarse la inserción en Supabase.
    - Verificar en la base de datos de Supabase que los registros `transaction_id` coincidan con lo generado localmente.

## 4. Escenario: Persistencia tras Recarga (Cold Boot Offline)
- **Preparación:** Realizar un cambio offline y cerrar/recargar la pestaña del navegador (sin internet).
- **Acción:** Abrir la app nuevamente.
- **Validación Esperada:**
    - La app carga (gracias al Service Worker / PWA).
    - Los datos cacheados en IndexedDB se muestran correctamente.
    - Los cambios pendientes de sincronización persisten en la UI y en la cola.

## 5. Auditoría de Rendimiento Analítico
- **Acción:** Navegar a la pestaña "Clientes" en el Dashboard con un dataset de >500 movimientos.
- **Validación:** El scroll y el cambio de pestañas debe ser fluido (<100ms) gracias a las optimizaciones O(N) aplicadas en los `useMemo` del `DashboardPage`.
