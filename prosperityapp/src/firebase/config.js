// ===== INICIO: src/firebase/config.js (FINAL) =====

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de Firebase para "Prosperity Suite"
const firebaseConfig = {
  apiKey: "AIzaSyA_DRItdey17fAAvPLQxrOBzK7kHkJXzo0",
  authDomain: "prosperitysuiteapp.firebaseapp.com",
  projectId: "prosperitysuiteapp",
  storageBucket: "prosperitysuiteapp.firebasestorage.app",
  messagingSenderId: "932761267995",
  appId: "1:932761267995:web:2f85d39a64212fe8baadbe",
  measurementId: "G-EBXC1SEV95"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la instancia de Firestore para usarla en la aplicación
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ===== FIN: src/firebase/config.js (FINAL) =====