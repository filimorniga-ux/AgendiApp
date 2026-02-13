import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = { apiKey: "AIzaSyA_DRItdey17fAAvPLQxrOBzK7kHkJXzo0", authDomain: "prosperitysuiteapp.firebaseapp.com", projectId: "prosperitysuiteapp", storageBucket: "prosperitysuiteapp.firebasestorage.app", messagingSenderId: "932761267995", appId: "1:932761267995:web:2f85d39a64212fe8baadbe", measurementId: "G-EBXC1SEV95" };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app); export const db = getFirestore(app);
