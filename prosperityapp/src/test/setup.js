import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Mock Firebase (evita inicialización real con env vars vacías) ──────
vi.mock('../firebase/config', () => ({
  db:      {},
  auth:    { currentUser: null, onAuthStateChanged: vi.fn(() => () => {}) },
  storage: {},
}));

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    getAuth:          vi.fn(() => ({ currentUser: null })),
    onAuthStateChanged: vi.fn((_auth, cb) => { cb(null); return () => {}; }),
    signInWithEmailAndPassword: vi.fn(),
    signOut:          vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
  };
});

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    getFirestore: vi.fn(() => ({})),
    collection:   vi.fn(),
    doc:          vi.fn(),
    getDocs:      vi.fn(() => Promise.resolve({ docs: [] })),
    getDoc:       vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    setDoc:       vi.fn(() => Promise.resolve()),
    addDoc:       vi.fn(() => Promise.resolve({ id: 'mock-id' })),
    updateDoc:    vi.fn(() => Promise.resolve()),
    deleteDoc:    vi.fn(() => Promise.resolve()),
    onSnapshot:   vi.fn((_q, cb) => { cb({ docs: [] }); return () => {}; }),
    query:        vi.fn((...args) => args[0]),
    where:        vi.fn(),
    orderBy:      vi.fn(),
    limit:        vi.fn(),
    serverTimestamp: vi.fn(() => new Date().toISOString()),
    Timestamp:    { fromDate: vi.fn((d) => d), now: vi.fn(() => new Date()) },
  };
});

vi.mock('firebase/storage', async () => {
  const actual = await vi.importActual('firebase/storage');
  return {
    ...actual,
    getStorage:    vi.fn(() => ({})),
    ref:           vi.fn(),
    uploadBytesResumable: vi.fn(() => ({ on: vi.fn(), snapshot: { ref: {} } })),
    getDownloadURL: vi.fn(() => Promise.resolve('https://mock-url.com/file.jpg')),
    deleteObject:  vi.fn(() => Promise.resolve()),
  };
});

// ── Mock Supabase (evita conexión real) ─────────────────────────────────
const mockSupabaseQuery = {
  select:  vi.fn().mockReturnThis(),
  insert:  vi.fn().mockReturnThis(),
  update:  vi.fn().mockReturnThis(),
  delete:  vi.fn().mockReturnThis(),
  upsert:  vi.fn().mockReturnThis(),
  eq:      vi.fn().mockReturnThis(),
  neq:     vi.fn().mockReturnThis(),
  gt:      vi.fn().mockReturnThis(),
  gte:     vi.fn().mockReturnThis(),
  lt:      vi.fn().mockReturnThis(),
  lte:     vi.fn().mockReturnThis(),
  in:      vi.fn().mockReturnThis(),
  order:   vi.fn().mockReturnThis(),
  limit:   vi.fn().mockReturnThis(),
  single:  vi.fn(() => Promise.resolve({ data: null, error: null })),
  then:    vi.fn((cb) => Promise.resolve({ data: [], error: null }).then(cb)),
};

const mockSupabaseClient = {
  from:    vi.fn(() => mockSupabaseQuery),
  auth: {
    getSession:      vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn((cb) => {
      if (typeof cb === 'function') {
        cb('SIGNED_IN', { user: null });
      }
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signOut:         vi.fn(() => Promise.resolve({ error: null })),
    getUser:         vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  },
  storage: {
    from: vi.fn(() => ({
      upload:         vi.fn(() => Promise.resolve({ data: {}, error: null })),
      getPublicUrl:   vi.fn(() => ({ data: { publicUrl: 'https://mock-storage.com/file.jpg' } })),
      remove:         vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  },
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  channel: vi.fn(() => ({
    on:       vi.fn().mockReturnThis(),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  })),
  removeChannel: vi.fn(),
};

vi.mock('../supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// ── Mocks globales de entorno de navegador ───────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserver;

// ── Mock de LocalStorage ─────────────────────────────────────────────────
const localStorageMock = (function() {
  let store = {};
  return {
    getItem:    function(key) { return store[key] || null; },
    setItem:    function(key, value) { store[key] = value.toString(); },
    removeItem: function(key) { delete store[key]; },
    clear:      function() { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ── Mock de i18n ─────────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str) => str,
    i18n: { changeLanguage: () => Promise.resolve() },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  Trans: ({ children }) => children,
}));
