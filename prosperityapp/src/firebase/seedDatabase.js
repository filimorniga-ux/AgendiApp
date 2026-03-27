// ===== INICIO: src/firebase/seedDatabase.js (VERSIÓN 100% FINAL) =====
    import { db } from './config';
    import { collection, doc, writeBatch, getDocs, query, serverTimestamp } from 'firebase/firestore';

    // Genera un stock aleatorio entre 6 y 24
    const getRandomStock = () => Math.floor(Math.random() * (24 - 6 + 1)) + 6;
    const defaultMinStock = 3; // Umbral mínimo por defecto
    const creationTimestamp = serverTimestamp(); // Fecha de creación

    const defaultData = {
      collaborators: [
        { name: 'Víctor', role: 'Barbería y estilismo masculino', commissionPercent: 50, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 0 },
        { name: 'Miguel', role: 'Director y colorista principal', commissionPercent: 50, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 1 },
        { name: 'Gladys', role: 'Estilista experta en cortes Pixie', commissionPercent: 40, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 2 },
        { name: 'Diana', role: 'Especialista en balayage y babylights', commissionPercent: 40, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 3 },
        { name: 'Andrés', role: 'Asistente técnico', commissionPercent: 50, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 4 },
        { name: 'Julio', role: 'Colorista experto', commissionPercent: 50, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 5 },
        { name: 'Nancy', role: 'Técnica en color y estilista integral', commissionPercent: 40, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 6 },
        { name: 'Abi', role: 'Barbero profesional y estilista', commissionPercent: 50, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 7 },
        { name: 'Yisel', role: 'Asistente y apoyo general', commissionPercent: 50, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 8 },
        { name: 'Eliana', role: 'Manicurista', commissionPercent: 40, salesCommissionPercent: 10, active: true, status: 'active', displayOrder: 9 }
      ],
      clients: [ 
        { name: 'Valentina Rojas', phone: '987654321', lastVisit: '2025-10-11' }, 
        { name: 'Benjamín Soto', phone: '912345678', lastVisit: '2025-10-13' }, 
      ],
      services: [
        { name: 'Loreal / Moroccanoil XS', category: 'Masajes Capilares y Ampolletas', price: 22000, duration: 45 },
        { name: 'Loreal / Moroccanoil S', category: 'Masajes Capilares y Ampolletas', price: 22000, duration: 45 },
        { name: 'Loreal / Moroccanoil M', category: 'Masajes Capilares y Ampolletas', price: 27000, duration: 45 },
        { name: 'Loreal / Moroccanoil L', category: 'Masajes Capilares y Ampolletas', price: 32000, duration: 45 },
        { name: 'Loreal / Moroccanoil XL', category: 'Masajes Capilares y Ampolletas', price: 37000, duration: 45 },
        { name: 'Sebastian Penetraitt / Dark Oil / Hydre', category: 'Masajes Capilares y Ampolletas', price: 23000, duration: 45 },
        { name: 'Ampolletas hidratantes / brillo / descongestionantes', category: 'Masajes Capilares y Ampolletas', price: 15000, duration: 30 },
        { name: 'Baño de Cristalización', category: 'Masajes Capilares y Ampolletas', price: 20000, duration: 45 },
        { name: 'Reparación Molecular o Ultimate Repair', category: 'Masajes Capilares y Ampolletas', price: 40000, duration: 60 },
        { name: 'Axilas', category: 'Depilación con Cera', price: 7000, duration: 20 },
        { name: 'Diseño de cejas (cera)', category: 'Depilación con Cera', price: 6000, duration: 30 },
        { name: 'Facial completa (cera)', category: 'Depilación con Cera', price: 20000, duration: 45 },
        { name: 'Bigote', category: 'Depilación con Cera', price: 5000, duration: 15 },
        { name: 'Frente', category: 'Depilación con Cera', price: 7000, duration: 15 },
        { name: 'Patillas (chuletas)', category: 'Depilación con Cera', price: 6000, duration: 15 },
        { name: 'Nariz', category: 'Depilación con Cera', price: 6000, duration: 15 },
        { name: 'Orejas', category: 'Depilación con Cera', price: 6000, duration: 15 },
        { name: 'Mentón', category: 'Depilación con Cera', price: 6000, duration: 15 },
        { name: 'Rebaje parcial', category: 'Depilación con Cera', price: 15000, duration: 30 },
        { name: 'Rebaje completo', category: 'Depilación con Cera', price: 20000, duration: 45 },
        { name: 'Rebaje full con glúteos', category: 'Depilación con Cera', price: 27000, duration: 60 },
        { name: 'Medio brazo', category: 'Depilación con Cera', price: 12000, duration: 30 },
        { name: 'Brazo completo', category: 'Depilación con Cera', price: 16000, duration: 45 },
        { name: 'Media pierna', category: 'Depilación con Cera', price: 15000, duration: 30 },
        { name: 'Pierna completa', category: 'Depilación con Cera', price: 20000, duration: 45 },
        { name: 'Espalda completa', category: 'Depilación con Cera', price: 20000, duration: 45 },
        { name: 'Línea de abdomen', category: 'Depilación con Cera', price: 6000, duration: 15 },
        { name: 'Abdomen completo', category: 'Depilación con Cera', price: 15000, duration: 30 },
        { name: 'Glúteo completo', category: 'Depilación con Cera', price: 14000, duration: 30 },
        { name: 'Pecho hombre', category: 'Depilación con Cera', price: 12000, duration: 30 },
        { name: 'Cejas (hilo)', category: 'Depilación con Hilo', price: 7000, duration: 20 },
        { name: 'Diseño de cejas (hilo)', category: 'Depilación con Hilo', price: 13000, duration: 30 },
        { name: 'Diseño con Henna', category: 'Depilación con Hilo', price: 20000, duration: 45 },
        { name: 'Mejillas (hilo)', category: 'Depilación con Hilo', price: 6000, duration: 15 },
        { name: 'Pómulo (hilo)', category: 'Depilación con Hilo', price: 4000, duration: 15 },
        { name: 'Bigote (bozo)', category: 'Depilación con Hilo', price: 5000, duration: 15 },
        { name: 'Patillas (hilo)', category: 'Depilación con Hilo', price: 5000, duration: 15 },
        { name: 'Frente (hilo)', category: 'Depilación con Hilo', price: 6000, duration: 15 },
        { name: 'Mentón (hilo)', category: 'Depilación con Hilo', price: 6000, duration: 15 },
        { name: 'Facial completa (hilo)', category: 'Depilación con Hilo', price: 24000, duration: 45 },
        { name: 'Lifting', category: 'Cejas y Pestañas', price: 21000, duration: 60 },
        { name: 'Lifting + Tinte', category: 'Cejas y Pestañas', price: 25000, duration: 70 },
        { name: 'Ondulado de pestañas', category: 'Cejas y Pestañas', price: 21000, duration: 60 },
        { name: 'Pestañas postizas de racimo', category: 'Cejas y Pestañas', price: 17000, duration: 30 },
        { name: 'Extensiones pelo a pelo clásico', category: 'Cejas y Pestañas', price: 40000, duration: 120 },
        { name: 'Extensiones volumen', category: 'Cejas y Pestañas', price: 45000, duration: 120 },
        { name: 'Extensiones híbridas', category: 'Cejas y Pestañas', price: 50000, duration: 120 },
        { name: 'Visos Talla S', category: 'Visos / Retoques / Fondo de Color', price: 50000, duration: 120 },
        { name: 'Visos Talla M', category: 'Visos / Retoques / Fondo de Color', price: 70000, duration: 140 },
        { name: 'Visos Talla L', category: 'Visos / Retoques / Fondo de Color', price: 80000, duration: 150 },
        { name: 'Visos Talla XL', category: 'Visos / Retoques / Fondo de Color', price: 100000, duration: 180 },
        { name: 'Visos Talla XXL', category: 'Visos / Retoques / Fondo de Color', price: 120000, duration: 200 },
        { name: 'Solo raíz sin baño de color', category: 'Visos / Retoques / Fondo de Color', price: 40000, duration: 90 },
        { name: 'Raíz + baño de color S', category: 'Visos / Retoques / Fondo de Color', price: 45000, duration: 90 },
        { name: 'Raíz + baño de color M', category: 'Visos / Retoques / Fondo de Color', price: 50000, duration: 100 },
        { name: 'Raíz + baño de color L', category: 'Visos / Retoques / Fondo de Color', price: 55000, duration: 120 },
        { name: 'Raíz + baño de color XL', category: 'Visos / Retoques / Fondo de Color', price: 65000, duration: 120 },
        { name: 'Raíz + baño de color XXL', category: 'Visos / Retoques / Fondo de Color', price: 70000, duration: 120 },
        { name: 'Solo baño de color (todo el largo)', category: 'Visos / Retoques / Fondo de Color', price: 35000, duration: 60 },
        { name: 'Babylights / Balayage S', category: 'Babylights / Balayage', price: 60000, duration: 150 },
        { name: 'Babylights / Balayage M', category: 'Babylights / Balayage', price: 80000, duration: 180 },
        { name: 'Babylights / Balayage L', category: 'Babylights / Balayage', price: 100000, duration: 180 },
        { name: 'Babylights / Balayage XL', category: 'Babylights / Balayage', price: 120000, duration: 210 },
        { name: 'Babylights / Balayage XXL', category: 'Babylights / Balayage', price: 150000, duration: 240 },
        { name: 'Alisado S', category: 'Alisados Permanentes y Botox Capilar', price: 40000, duration: 120 },
        { name: 'Alisado M', category: 'Alisados Permanentes y Botox Capilar', price: 60000, duration: 150 },
        { name: 'Alisado L', category: 'Alisados Permanentes y Botox Capilar', price: 80000, duration: 180 },
        { name: 'Alisado XL', category: 'Alisados Permanentes y Botox Capilar', price: 100000, duration: 210 },
        { name: 'Alisado XXL', category: 'Alisados Permanentes y Botox Capilar', price: 120000, duration: 240 },
        { name: 'Botox Capilar (largo único)', category: 'Alisados Permanentes y Botox Capilar', price: 30000, duration: 90 },
        { name: 'Manicura tradicional', category: 'Manicura y Pedicura', price: 13000, duration: 45 },
        { name: 'Secado rápido', category: 'Manicura y Pedicura', price: 15000, duration: 45 },
        { name: 'Esmaltado permanente', category: 'Manicura y Pedicura', price: 23000, duration: 60 },
        { name: 'Pedicura tradicional', category: 'Manicura y Pedicura', price: 16000, duration: 45 },
        { name: 'Pedicura secado rápido', category: 'Manicura y Pedicura', price: 19000, duration: 45 },
        { name: 'Pedicura permanente', category: 'Manicura y Pedicura', price: 24000, duration: 60 },
        { name: 'Retiro de esmalte permanente', category: 'Manicura y Pedicura', price: 6000, duration: 20 },
        { name: 'Uñas acrílicas', category: 'Manicura y Pedicura', price: 45000, duration: 120 },
        { name: 'Retiro de acrílico', category: 'Manicura y Pedicura', price: 17000, duration: 45 },
        { name: 'Mantenimiento acrílico', category: 'Manicura y Pedicura', price: 35000, duration: 90 },
        { name: 'Reparación de uña', category: 'Manicura y Pedicura', price: 6000, duration: 15 },
        { name: 'Uñas Poly Gel', category: 'Manicura y Pedicura', price: 40000, duration: 120 },
        { name: 'Uñas Softgel', category: 'Manicura y Pedicura', price: 40000, duration: 90 },
        { name: 'Kapping', category: 'Manicura y Pedicura', price: 32000, duration: 75 },
        { name: 'Base Rubber', category: 'Manicura y Pedicura', price: 28000, duration: 60 },
        { name: 'Brushing S', category: 'Brushing / Planchado y Peinados', price: 10000, duration: 30 },
        { name: 'Brushing M', category: 'Brushing / Planchado y Peinados', price: 12000, duration: 45 },
        { name: 'Brushing L', category: 'Brushing / Planchado y Peinados', price: 14000, duration: 60 },
        { name: 'Brushing XL', category: 'Brushing / Planchado y Peinados', price: 16000, duration: 60 },
        { name: 'Brushing XXL', category: 'Brushing / Planchado y Peinados', price: 18000, duration: 75 },
        { name: 'Trenzas tejidas', category: 'Brushing / Planchado y Peinados', price: 12000, duration: 45 },
        { name: 'Trenzas con decoración', category: 'Brushing / Planchado y Peinados', price: 15000, duration: 60 },
        { name: 'Peinados recogidos sencillos', category: 'Brushing / Planchado y Peinados', price: 20000, duration: 60 },
        { name: 'Peinados elaborados', category: 'Brushing / Planchado y Peinados', price: 25000, duration: 90 },
        { name: 'Ondas', category: 'Brushing / Planchado y Peinados', price: 14000, duration: 45 },
        { name: 'Lavado solo', category: 'Cortes y Lavado', price: 5000, duration: 15 },
        { name: 'Lavado con servicio', category: 'Cortes y Lavado', price: 3000, duration: 15 },
        { name: 'Corte dama', category: 'Cortes y Lavado', price: 15000, duration: 60 },
        { name: 'Corte hombre', category: 'Cortes y Lavado', price: 12000, duration: 45 },
        { name: 'Barba express', category: 'Cortes y Lavado', price: 10000, duration: 30 },
        { name: 'Barba con ritual', category: 'Cortes y Lavado', price: 12000, duration: 45 },
        { name: 'Cejas con navaja', category: 'Cortes y Lavado', price: 4000, duration: 15 }
      ],
      technicalInventory: [
        { name: 'Tinte PH', brand: 'PH', category: 'Tinte', unitSize: 100, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4800, collabCost: 8000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte IGORA', brand: 'Igora', category: 'Tinte', unitSize: 80, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4800, collabCost: 8000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte ALFAPARF', brand: 'Alfaparf', category: 'Tinte', unitSize: 80, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4800, collabCost: 8000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte BBCOS', brand: 'BBCOS', category: 'Tinte', unitSize: 95, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4200, collabCost: 7000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte PREVIA', brand: 'Previa', category: 'Tinte', unitSize: 100, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4200, collabCost: 7000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte DIALIGHT', brand: 'Loreal', category: 'Tinte', unitSize: 50, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4800, collabCost: 8000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte SHINEFINITY', brand: 'Wella', category: 'Tinte', unitSize: 50, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4800, collabCost: 8000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte PROMOCIÓN', brand: 'Promoción', category: 'Tinte', unitSize: 90, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 3000, collabCost: 5000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte INOA', brand: 'Loreal', category: 'Tinte', unitSize: 60, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 5400, collabCost: 9000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte DIA RICHESE', brand: 'Loreal', category: 'Tinte', unitSize: 50, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4800, collabCost: 8000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte COLORTOUCH', brand: 'Wella', category: 'Tinte', unitSize: 50, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4800, collabCost: 8000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte COLOR PERFECT', brand: 'Wella', category: 'Tinte', unitSize: 80, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4800, collabCost: 8000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Tinte BLIFE COLOR', brand: 'Farmavita', category: 'Tinte', unitSize: 100, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 4800, collabCost: 8000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Decolorante (genérico 30g)', brand: 'Varios', category: 'Decolorante y oxidantes', unitSize: 30, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 1200, collabCost: 2000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Decolorante Wella 800g', brand: 'Wella', category: 'Decolorante y oxidantes', unitSize: 800, unitOfMeasure: 'g', stockUnits: getRandomStock(), facturaCost: 40173, collabCost: 53333, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Oxigenta 1L (10 Vol)', brand: 'Varios', category: 'Decolorante y oxidantes', unitSize: 1000, unitOfMeasure: 'ml', stockUnits: getRandomStock(), facturaCost: 6000, collabCost: 10000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Oxigenta 1L (20 Vol)', brand: 'Varios', category: 'Decolorante y oxidantes', unitSize: 1000, unitOfMeasure: 'ml', stockUnits: getRandomStock(), facturaCost: 6000, collabCost: 10000, minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Oxigenta 1L (30 Vol)', brand: 'Varios', category: 'Decolorante y oxidantes', unitSize: 1000, unitOfMeasure: 'ml', stockUnits: getRandomStock(), facturaCost: 6000, collabCost: 10000, minStock: defaultMinStock, createdAt: creationTimestamp }
      ],
      retailInventory: [
        { name: 'Olaplex 0', brand: 'Olaplex', category: 'Olaplex', price: 35000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Olaplex 03', brand: 'Olaplex', category: 'Olaplex', price: 35000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Olaplex 04', brand: 'Olaplex', category: 'Olaplex', price: 35000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Olaplex 05', brand: 'Olaplex', category: 'Olaplex', price: 35000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Olaplex 06', brand: 'Olaplex', category: 'Olaplex', price: 35000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Olaplex 07', brand: 'Olaplex', category: 'Olaplex', price: 35000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Olaplex 08', brand: 'Olaplex', category: 'Olaplex', price: 35000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Olaplex 09', brand: 'Olaplex', category: 'Olaplex', price: 35000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Olaplex 60 ml', brand: 'Olaplex', category: 'Olaplex', price: 64000, stock: getRandomStock(), cost: 40000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Duo Olaplex', brand: 'Olaplex', category: 'Olaplex', price: 64000, stock: getRandomStock(), cost: 40000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=O', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'White Meches Shampoo 1 L', brand: 'Yelloff', category: 'Yelloff', price: 25000, stock: getRandomStock(), cost: 15000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=Y', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'White Meches Shampoo 500 ml', brand: 'Yelloff', category: 'Yelloff', price: 22000, stock: getRandomStock(), cost: 13000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=Y', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'White Meches Mascarilla 500 ml', brand: 'Yelloff', category: 'Yelloff', price: 22000, stock: getRandomStock(), cost: 13000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=Y', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Dúo Shampoo + Bálsamo', brand: 'Cristalización', category: 'Cristalización', price: 35000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=C', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Pack Shampoo + Bálsamo + Mascarilla', brand: 'Cristalización', category: 'Cristalización', price: 65000, stock: getRandomStock(), cost: 40000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=C', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Mascarilla Cristalización', brand: 'Cristalización', category: 'Cristalización', price: 30000, stock: getRandomStock(), cost: 18000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=C', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Shampoo Sebastian', brand: 'Sebastian', category: 'Sebastian', price: 25000, stock: getRandomStock(), cost: 15000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=S', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Mascarilla Sebastian', brand: 'Sebastian', category: 'Sebastian', price: 34000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=S', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Aceite Dark Oil', brand: 'Sebastian', category: 'Sebastian', price: 35000, stock: getRandomStock(), cost: 21000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=S', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Mascarilla Dark Oil', brand: 'Sebastian', category: 'Sebastian', price: 35000, stock: getRandomStock(), cost: 21000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=S', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Shampoo Dark Oil', brand: 'Sebastian', category: 'Sebastian', price: 25000, stock: getRandomStock(), cost: 15000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=S', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Laca Sebastian', brand: 'Sebastian', category: 'Sebastian', price: 26000, stock: getRandomStock(), cost: 16000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=S', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Spider Pomade', brand: 'Barbería', category: 'Barbería', price: 15000, stock: getRandomStock(), cost: 9000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=B', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Cera Tarro Amarillo', brand: 'Barbería', category: 'Barbería', price: 14000, stock: getRandomStock(), cost: 8000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=B', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Ceras Bandido', brand: 'Barbería', category: 'Barbería', price: 13000, stock: getRandomStock(), cost: 7500, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=B', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Danger Barba Forte', brand: 'Barbería', category: 'Barbería', price: 16000, stock: getRandomStock(), cost: 10000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=B', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Aceite Barba Forte', brand: 'Barbería', category: 'Barbería', price: 16000, stock: getRandomStock(), cost: 10000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=B', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Revlon One', brand: 'Barbería', category: 'Barbería', price: 22000, stock: getRandomStock(), cost: 13000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=R', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Mask Color 270 g', brand: 'Cloe', category: 'Cloe', price: 17000, stock: getRandomStock(), cost: 10000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=C', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Mask Color 500 g', brand: 'Cloe', category: 'Cloe', price: 25000, stock: getRandomStock(), cost: 15000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=C', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Aceite Cloe', brand: 'Cloe', category: 'Cloe', price: 10000, stock: getRandomStock(), cost: 6000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=C', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Termoprotector', brand: 'Cloe', category: 'Cloe', price: 17000, stock: getRandomStock(), cost: 10000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=C', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Shampoo Cloe Matizante', brand: 'Cloe', category: 'Cloe', price: 17000, stock: getRandomStock(), cost: 10000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=C', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Strange Love Curls', brand: 'Cloe', category: 'Cloe', price: 17000, stock: getRandomStock(), cost: 10000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=C', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Crema Moldeadora de Rizos', brand: 'Moroccanoil', category: 'Moroccanoil', price: 33000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=M', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Pack Moroccanoil', brand: 'Moroccanoil', category: 'Moroccanoil', price: 65000, stock: getRandomStock(), cost: 40000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=M', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Aceite 100 ml', brand: 'Moroccanoil', category: 'Moroccanoil', price: 37000, stock: getRandomStock(), cost: 22000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=M', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Mask 250 ml', brand: 'Moroccanoil', category: 'Moroccanoil', price: 37000, stock: getRandomStock(), cost: 22000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=M', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Dream Duo', brand: 'Moroccanoil', category: 'Moroccanoil', price: 45000, stock: getRandomStock(), cost: 27000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=M', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Kit Completo', brand: 'Moroccanoil', category: 'Moroccanoil', price: 69000, stock: getRandomStock(), cost: 42000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=M', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Crema Intensiva de Rizos', brand: 'Moroccanoil', category: 'Moroccanoil', price: 33000, stock: getRandomStock(), cost: 20000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=M', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Laca', brand: 'Moroccanoil', category: 'Moroccanoil', price: 24000, stock: getRandomStock(), cost: 14000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=M', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Shampoo 300 ml', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 25000, stock: getRandomStock(), cost: 15000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Serioxyl Advanced', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 37000, stock: getRandomStock(), cost: 22000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Aminexil Advanced', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 37000, stock: getRandomStock(), cost: 22000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Mascarilla 250 ml', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 30000, stock: getRandomStock(), cost: 18000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Musse Curl Expression', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 28000, stock: getRandomStock(), cost: 17000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Activador Curl Expression', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 25000, stock: getRandomStock(), cost: 15000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Cera TecniArt', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 16000, stock: getRandomStock(), cost: 10000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Gel Fix Max', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 17000, stock: getRandomStock(), cost: 10000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Shampoo 500 ml', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 36000, stock: getRandomStock(), cost: 22000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Pack Shampoo + Mascarilla', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 55000, stock: getRandomStock(), cost: 33000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Sérum Vita Color Spectrum Metal Detox', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 32000, stock: getRandomStock(), cost: 19000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Aceite Absolut Repair 10 en 1', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 35000, stock: getRandomStock(), cost: 21000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Laca Loreal', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 20000, stock: getRandomStock(), cost: 12000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp },
        { name: 'Espuma Loreal', brand: 'Loreal Professionnel', category: 'Loreal Professionnel', price: 20000, stock: getRandomStock(), cost: 12000, photo: 'https://placehold.co/400x400/1a202c/f6e05e?text=L', minStock: defaultMinStock, createdAt: creationTimestamp }
      ],
    };

    export const handleSeedDatabase = async () => {
      const confirmation = window.confirm(
        "¿Estás seguro de que quieres borrar TODOS los datos y reemplazarlos con los datos de ejemplo? Esta acción no se puede deshacer."
      );
      if (!confirmation) { alert("Operación cancelada."); return; }
      alert("Restableciendo datos... Por favor, espera. Esto puede tardar un minuto.");
      try {
        const collectionsToWipe = ['collaborators', 'clients', 'services', 'technicalInventory', 'retailInventory', 'movements', 'monthlyClosings', 'appointments', 'giftCards', 'payrollClosings', 'stockMovements'];
        const deleteBatch = writeBatch(db);
        for (const collName of collectionsToWipe) {
          const collRef = collection(db, collName);
          const snapshot = await getDocs(query(collRef));
          snapshot.docs.forEach(doc => { deleteBatch.delete(doc.ref); });
        }
        await deleteBatch.commit();
        console.info("Datos anteriores borrados.");
        
        const seedBatch = writeBatch(db);
        for (const collName of Object.keys(defaultData)) {
          const collData = defaultData[collName];
          collData.forEach(docData => {
            const newDocRef = doc(collection(db, collName));
            // Asigna el timestamp del servidor aquí
            const dataWithTimestamp = {
              ...docData,
              createdAt: serverTimestamp() // Asegura que los docs de inventario/servicios tengan fecha de creación
            };
            seedBatch.set(newDocRef, dataWithTimestamp);
          });
        }
        
        await seedBatch.commit();
        alert("¡Éxito! La base de datos ha sido restablecida con los datos de prueba. La página se recargará.");
        window.location.reload();
      } catch (error) {
        console.warn("Error al restablecer la base de datos: ", error);
        alert("Error al restablecer la base de datos: " + error.message);
      }
    };
    // ===== FIN: src/firebase/seedDatabase.js (Sprint 67 - Completo) =====