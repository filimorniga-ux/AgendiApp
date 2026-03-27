// ===== INICIO: src/hooks/useCollection.js =====
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const useCollection = (collectionName, _queryConstraints = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    let collectionRef = collection(db, collectionName);
    let q;

    if (Array.isArray(_queryConstraints)) {
      // Es un array de constraints (where, orderBy, etc.)
      q = query(collectionRef, ..._queryConstraints);
    } else if (typeof _queryConstraints === 'string') {
      // Es un string (orderByField) - Retrocompatibilidad
      q = query(collectionRef, orderBy(_queryConstraints));
    } else {
      // Sin filtros
      q = query(collectionRef);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = [];
      snapshot.forEach((doc) => {
        results.push({ ...doc.data(), id: doc.id });
      });
      setData(results);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.warn(err);
      setError('No se pudieron cargar los datos.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(_queryConstraints)]);

  return { data, loading, error };
};
// ===== FIN: src/hooks/useCollection.js =====