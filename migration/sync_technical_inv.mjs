import { createRequire } from 'module';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname }  from 'path';
import { fileURLToPath }     from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

const SA_PATH = resolve(__dirname, 'serviceAccountKey.json');
if (!existsSync(SA_PATH)) {
  console.error('\n❌  serviceAccountKey.json no encontrado en:', SA_PATH);
  process.exit(1);
}

const admin = require('firebase-admin');
const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const fsDb = admin.firestore();

async function generateSql() {
  console.log('Obteniendo technicalInventory de Firestore...');
  const snap = await fsDb.collection('technicalInventory').get();
  
  if (snap.empty) {
    console.log('No hay inventario técnico en Firestore.');
    process.exit(0);
  }

  let sqlStatements = '';

  for (const doc of snap.docs) {
    const data = doc.data();
    const firebaseId = doc.id;
    
    // Extracción
    const stockUnits = data.stockUnits ?? data.stockCurrent ?? data.stock ?? 0;
    const unitSize = data.unitSize ?? 'NULL';
    const unitOfMeasure = data.unitOfMeasure ? `'${data.unitOfMeasure.replace(/'/g, "''")}'` : 'NULL';
    const facturaCost = data.facturaCost ?? 0;
    const collabCost = data.collabCost ?? data.costPerUnit ?? 0;

    sqlStatements += `
UPDATE technical_inventory SET
  stock_current = ${stockUnits},
  unit_size = ${unitSize},
  unit_of_measure = ${unitOfMeasure},
  factura_cost = ${facturaCost},
  collab_cost = ${collabCost}
WHERE firebase_id = '${firebaseId.replace(/'/g, "''")}';
`;
  }

  const outPath = resolve(__dirname, 'sync.sql');
  writeFileSync(outPath, sqlStatements);
  console.log(`\n✅ SQL generado en ${outPath}`);
}

generateSql().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
