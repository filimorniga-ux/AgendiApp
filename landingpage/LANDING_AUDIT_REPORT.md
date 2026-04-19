# Landing Page Audit Report

## 1. Verificación de correcciones previas (Commit a77864c5)

| ID | Corrección | Estado | Comentario |
|---|---|---|---|
| 1 | Eliminado CDN Tailwind v3 | ✅ Verificado | Ya no existe en `index.html`. |
| 2 | Eliminado script importmap | ✅ Verificado | Ya no existe en `index.html`. |
| 3 | Eliminados console.log (email/project) | ✅ Verificado | No se encontraron `console.log` en el código. |
| 4 | Reemplazados alert con msjs genéricos | ✅ Verificado | Los alerts de `App.tsx` y `Dashboard.tsx` tienen mensajes estáticos orientados al usuario. |
| 5 | Eliminada vulnerabilidad email.includes | ✅ Verificado | Ahora valida contra una constante predefinida `SUPER_ADMIN_EMAIL`. |
| 6 | Agregados meta description, OG, favicon | ✅ Verificado | Están presentes correctamente en `index.html`. |
| 7 | Logo placeholder -> inline SVG | ✅ Verificado | Implementado correctamente en `Header.tsx` (como base64 SVG). |
| 8 | Copyright 2025 -> 2026 | ✅ Verificado | Actualizado correctamente en `Footer.tsx`. |
| 9 | Eliminado Agenda.tsx | ✅ Verificado | El archivo ya no existe. |
| 10 | Cambiado error: any a error: unknown | ✅ Verificado | Se corrigió en `App.tsx` para usar `unknown` e inspeccionar con `instanceof Error`. |

## 2. Hallazgos Adicionales

### Resumen de Severidad

| Severidad | Problemas Encontrados |
|---|---|
| Crítica (Security/Build) | 0 |
| Alta (TypeScript/Bugs) | 2 |
| Media (i18n/Accesibilidad) | 3 |
| Baja (Dead code/Perf) | 2 |

### Lista de Problemas (Nuevos Hallazgos)

1. **[Alta] Tipos `any` restantes (TypeScript)**
   - **Archivo:** `src/components/layout/Header.tsx` (línea 13)
   - **Problema:** `user: any;` en `HeaderProps`. Debería ser `User | null` de `firebase/auth`.
   - **Archivo:** `src/components/sections/BentoGrid.tsx` (línea 3)
   - **Problema:** Props sin tipar: `const BentoCard = ({ ... }: any) =>`
   - **Archivo:** `src/components/sections/Pricing.tsx` (línea 23)
   - **Problema:** Props sin tipar en componente interno: `const PlanCard = ({ ... }: any) =>`
   - **Archivo:** `src/components/sections/Testimonials.tsx` y `Tutorials.tsx`
   - **Problema:** Array map usa `any`: `.map((item: any, i: number)`
   - **Archivo:** `src/lib/firebase.ts` (línea 10)
   - **Problema:** `let analytics: any = null;` Debería ser `Analytics | null` (requiere importación de tipos).

2. **[Alta] Falta de `<a>` con atributos seguros y accesibles en el Footer**
   - **Archivo:** `src/components/layout/Footer.tsx`
   - **Problema:** Los links de redes sociales (`href="#"`) deberían apuntar a URLs reales o incluir `target="_blank" rel="noopener noreferrer"` y un `aria-label` para accesibilidad.

3. **[Media] Accesibilidad (a11y) - Focus y Textos Alternativos**
   - **Archivo:** `src/components/ui/ThemeButton.tsx` y `LanguageSwitcher.tsx`
   - **Problema:** Botones sin `aria-label` descriptivo. Perjudica severamente la accesibilidad para lectores de pantalla.
   - **Archivo:** `src/components/sections/Hero.tsx`
   - **Problema:** El decorador visual `<div ... pointer-events-none>` carece de `aria-hidden="true"`, pudiendo ser leído erróneamente por tecnologías de asistencia.

4. **[Media] Internacionalización Incompleta (i18n)**
   - **Archivo:** `src/components/dashboard/Dashboard.tsx`
   - **Problema:** Las vistas de rol `StaffView` y `ClientView` (Ej. "Panel de Colaborador", "Reservar Ahora", "pts") tienen textos hardcodeados en lugar de utilizar el contexto `t.dashboard...`.
   - **Archivo:** `src/components/layout/Footer.tsx`
   - **Problema:** "Todos los derechos reservados." está hardcodeado.

5. **[Baja] Dependencias de desarrollo faltantes para Vite/React**
   - **Archivo:** `package.json`
   - **Problema:** Se corrigió parcialmente en mis pruebas añadiendo `@types/react` y `@types/react-dom`, pero no se guardó en `package.json`. Sin ellos, TypeScript en strict mode y editores lanzarán advertencias para JSX.

6. **[Baja] Rendimiento (Bundle Size)**
   - **Problema:** El bundle principal `index-*.js` pesa ~754 kB (minificado, 195 kB gzip). Como advierte Vite durante el build, se recomienda realizar Code Splitting / Lazy Loading (`React.lazy`) para secciones debajo del "fold" o modales pesados, mejorando el First Contentful Paint.

## Recomendaciones y Pasos a Seguir

1. **Fix TypeScript:** Reemplazar de inmediato todas las instancias de `any` por sus interfaces correspondientes. Este es un quick-win de alta prioridad.
2. **Ajustar Accesibilidad:** Agregar los atributos `aria-label` y `aria-hidden` pertinentes.
3. **Completar i18n:** Extraer los textos en crudo encontrados en `Dashboard.tsx` y `Footer.tsx` a `src/lib/i18n.ts`.
4. **Actualizar `package.json`:** Incluir explícitamente `@types/react` y `@types/react-dom` como `devDependencies` para mantener una experiencia de desarrollo fluida y sin errores de linting.
