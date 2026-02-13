// ===== INICIO: src/hooks/useMonthlyRecords.js =====
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

export const useMonthlyRecords = (yearMonth) => {
  const [records, setRecords] = useState([]);
  const [partners, setPartners] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!yearMonth) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    const docId = yearMonth;
    let unsubDoc;
    let unsubRecords;

    try {
      const docRef = doc(db, 'monthlyClosings', docId);
      unsubDoc = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setPartners(docSnap.data().partners || []);
        } else {
          setPartners([]);
        }
      }, (err) => {
        console.error(err);
        setError("Error cargando datos de socios.");
      });

      const recordsRef = collection(db, 'monthlyClosings', docId, 'records');
      const q = query(recordsRef, orderBy('date', 'desc'));
      
      unsubRecords = onSnapshot(q, (snapshot) => {
        const results = [];
        snapshot.forEach((doc) => {
          results.push({ ...doc.data(), id: doc.id });
        });
        setRecords(results);
        setLoading(false);
      }, (err) => {
        console.error(err);
        setError("Error cargando registros mensuales.");
        setLoading(false);
      });

    } catch (err) {
        setError("Error al configurar los listeners de Firebase.");
        setLoading(false);
    }

    return () => {
      if (unsubDoc) unsubDoc();
      if (unsubRecords) unsubRecords();
    };
  }, [yearMonth]);

  return { records, partners, loading, error };
};
// ===== FIN: src/hooks/useMonthlyRecords.js =====