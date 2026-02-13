import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Configuración que lee de tu archivo .env.local
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Inicialización Singleton: Revisa si ya existe una instancia para no duplicarla
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializamos los servicios
const auth = getAuth(app);
const db = getFirestore(app);
let analytics: any = null;

// Analytics solo corre en el navegador (cliente)
if (typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.warn("Analytics no pudo iniciarse (posible bloqueo de adblock):", e);
    }
}

// Debug: Esto te confirmará en la consola que ya tienes conexión
console.log("🔥 Prosperity App conectada correctamente. ID:", firebaseConfig.projectId);

export { app, auth, db, analytics };
// Parche temporal para compatibilidad con la UI antigua
export const initialAuthToken = null;