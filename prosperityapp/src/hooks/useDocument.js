// ===== INICIO: src/hooks/useDocument.js =====
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

export const useDocument = (collectionName, id) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setDocument(null);
      return;
    }
    
    setLoading(true);
    const docRef = doc(db, collectionName, id);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDocument({ ...docSnap.data(), id: docSnap.id });
        setError(null);
      } else {
        setError('Documento no encontrado.');
        setDocument(null);
      }
      setLoading(false);
    }, (err) => {
      console.warn(err);
      setError('No se pudo cargar el documento.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, id]);

  return { document, loading, error };
};
// ===== FIN: src/hooks/useDocument.js =====