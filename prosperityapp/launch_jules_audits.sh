#!/bin/bash

# Task 1
jules new --repo filimorniga-ux/AgendiApp "Auditoría de Core Financiero y Caja (Fases 4, 5 y 6): Modal de Movimientos (MovementModal), Caja Diaria y Cierres Mensuales. Busca errores matemáticos que resulten en NaN, vulnerabilidades de doble submit por estados isSubmitting mal implementados, y promesas sin .catch() en base de datos. Entrega un reporte exhaustivo." &

# Task 2
jules new --repo filimorniga-ux/AgendiApp "Auditoría de Inventario y Supply Chain (Fases 7, 8 y 9): Catálogo de Precios, Inventario, y Flujo de Recepción Física. Evalúa el rendimiento de las listas (busca necesidad de virtualización/paginación), mutaciones directas a arrays y audita la precisión flotante de los cálculos técnicos (costo por ml/gramo)." &

# Task 3
jules new --repo filimorniga-ux/AgendiApp "Auditoría de Recursos Humanos y Operaciones (Fases 3, 11 y 12): Gestión de Agenda, Colaboradores y Nóminas. Revisa el FormulaBuilder asegurándote de que no crashea si los datos de comisiones vienen en null. Verifica que los subscriptions Realtime de Agenda no causen render loops, y evalúa la complejidad ciclomática de los filtros de la Agenda." &

# Task 4
jules new --repo filimorniga-ux/AgendiApp "Auditoría de Clientes, Fidelización y Venta Pública (Fases 10, 16 y 17): CRM de Clientes, Giftcards y Public Booking. Audita seguridad (fugas de información de negocio en rutas públicas), prevención de saturación de API con debounces en buscadores, y verifica Error Boundaries en caso de fallo de generación de códigos." &

# Task 5
jules new --repo filimorniga-ux/AgendiApp "Auditoría de Seguridad, Suscripción y Configuración (Fases 1, 2, 15 y 18): Auth, Navegación, Settings y Facturación. Revisa que las integraciones de MercadoPago/Stripe no dependan de la UI para valores sensibles, limpia (cleanup) los listeners de Auth en onAuthStateChange, y asegura que BusinessContext no tenga dependencias circulares." &

# Task 6
jules new --repo filimorniga-ux/AgendiApp "Auditoría Analítica y Resiliencia Offline (Fases 13, 14 y 20 Offline-First): Dashboard, Reportes y estado local. Analiza el rendimiento de Recharts evitando bloqueos del Main Thread. Audita generación asíncrona de PDF/Excel. Finalmente, diseña la Fase 20 para probar flujos de caja y agenda cuando la app se queda sin internet (Dexie/IndexDB optimistic UI)." &

wait
echo "Las 6 tareas de auditoría han sido enviadas a Jules exitosamente."
