# Informe de Auditoría Cruzada de Integridad — AgendiApp

## Correcciones Realizadas (Verificación)

### BUG 1 (CRÍTICO) — DataContext.jsx línea 39
- **Antes**: `field: 'stylist_id', op: 'eq', value: user.uid`
- **Después**: **NO APLICADO.** En `prosperityapp/src/context/DataContext.jsx` línea 39, el código sigue siendo:
  `return [{ field: 'stylist_id', op: 'eq', value: user.uid }];`
- **Verificación**: No se cambió a `collaborator_id` ni a `user.id`. El bug persiste. Efectivamente, `collaborator_id` y `user.id` son los campos correctos para Supabase, pero el código actual sigue usando el estándar antiguo (`stylist_id` / `user.uid`).

### BUG 2 (CRÍTICO) — AgendaCalendario.jsx líneas 227-261
- **Antes**: Envío de `products_used`, `technical_cost`, `appointmentData.movementId`.
- **Después**: **NO APLICADO.** En `prosperityapp/src/components/agenda/AgendaCalendario.jsx`, el objeto `appointmentData` todavía incluye explícitamente `products_used` y `technical_cost` en su declaración inicial. Más abajo, si el pago se registra, se asigna `appointmentData.movementId = mv?.id || null;` y se envía mediante `sbUpdate`.
- **Verificación**: Estos campos siguen siendo enviados a la tabla `appointments`. Los datos `productsUsed` y `technicalCost` sí se guardan en la tabla `movements` (como `products_used` y `technical_cost` tras la conversión snake_case), pero el envío redundante (y erróneo) a la tabla `appointments` no fue removido.

### BUG 5 (MEDIO) — GiftCardPage.jsx
- **formatDate ahora maneja ISO strings además de Firestore seconds**: **NO APLICADO.** La función `formatDate` en `prosperityapp/src/pages/GiftCardPage.jsx` sigue esperando estrictamente `timestamp.seconds` y no maneja ISO strings.
- **Sorting cambiado de createdAt.seconds a new Date(createdAt).getTime()**: **NO APLICADO.** El código sigue ordenando utilizando `a.createdAt?.seconds` y `b.createdAt?.seconds`.

### Typo — SubscriptionPage.jsx línea 108
- **metodo the pago corregido a metodo de pago**: **NO APLICADO.** En la línea 108 sigue diciendo `Selecciona tu método the pago:`.

---

## Análisis Adicional Solicitado

### 1. Otras referencias a `user.uid` en `src/`
Se realizó una búsqueda exhaustiva (`grep -r "user\.uid" prosperityapp/src/`). Aparte de la que no fue corregida en `DataContext.jsx`, la única otra referencia está en un archivo de configuración de pruebas:
- `prosperityapp/src/test/utils.jsx`: `user: { uid: 'test-user-id', email: 'test@example.com' }` (Esto es seguro, es un mock de prueba).
No hay otras referencias en código de producción.

### 2. Otras escrituras a columnas inexistentes
- Como se documentó en el BUG 2, `AgendaCalendario.jsx` escribe a `products_used`, `technical_cost`, y `movement_id` (a través de `movementId`) en la tabla `appointments`.
- Además, debido a que se mezclan propiedades `snake_case` y `camelCase` de forma nativa en `appointmentData` antes de pasar por `sbCreate`/`sbUpdate`, y luego `objToSnake` hace su procesamiento, las columnas inexistentes se propagan a Supabase, pudiendo generar errores `PGRST116` o de esquema.

### 3. Verificar que `useSupabaseCollection` y `sbCreate`/`sbUpdate`/`sbDelete` manejan correctamente la conversión `camelCase` a `snake_case`
- La función `objToSnake` en `tableMap.js` está correctamente implementada para convertir propiedades `camelCase` (ej: `movementId`) a `snake_case` (`movement_id`).
- `useSupabaseCollection` y los métodos `sbCreate`/`sbUpdate`/`sbDelete` dentro de `db.js` utilizan y aplican estas funciones, asegurando que todas las propiedades se convierten antes de interactuar con el cliente Supabase y que al leer se conviertan de vuelta a `camelCase` usando `rowToCamel` (o el alias adecuado).

### 4. Revisión de la integridad del esquema `appointments`
Dado que el código intenta hacer escrituras de campos obsoletos (`products_used`, `technical_cost`, `movement_id`), si la tabla Supabase **efectivamente no tiene estas columnas** (como se asume en la auditoría), la aplicación fallará silenciosamente (atrapado por `catch`) o explotará en el intento de `insert/update` por intentar escribir a columnas inexistentes en `appointments`.
Actualmente, el envío está malformado.

## Conclusión General
**La migración y corrección de bugs informada NO se aplicó en el código fuente evaluado.** Los 4 puntos indicados en el historial de correcciones siguen presentes como bugs activos en los archivos respectivos. Se requiere realizar commit y push de las correcciones reales.
