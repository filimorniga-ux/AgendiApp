import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const SA_PATH = resolve(__dirname, 'serviceAccountKey.json');
if (!existsSync(SA_PATH)) {
  console.log('No serviceAccountKey.json found at', SA_PATH);
  process.exit(1);
}

const admin = require('firebase-admin');
const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const fsDb = admin.firestore();

async function run() {
  const snap = await fsDb.collection('technicalInventory').limit(10).get();
  snap.forEach(doc => {
    console.log(`Doc ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
  process.exit(0);
}

run();
