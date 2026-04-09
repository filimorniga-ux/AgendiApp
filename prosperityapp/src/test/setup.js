import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Firebase mocks removed. ──────────────────────────────────────────────

// ── Mock Supabase (evita conexión real) ─────────────────────────────────
const mockSupabaseQuery = {
  select:      vi.fn().mockReturnThis(),
  insert:      vi.fn().mockReturnThis(),
  update:      vi.fn().mockReturnThis(),
  delete:      vi.fn().mockReturnThis(),
  upsert:      vi.fn().mockReturnThis(),
  eq:          vi.fn().mockReturnThis(),
  neq:         vi.fn().mockReturnThis(),
  gt:          vi.fn().mockReturnThis(),
  gte:         vi.fn().mockReturnThis(),
  lt:          vi.fn().mockReturnThis(),
  lte:         vi.fn().mockReturnThis(),
  in:          vi.fn().mockReturnThis(),
  order:       vi.fn().mockReturnThis(),
  limit:       vi.fn().mockReturnThis(),
  single:      vi.fn(() => Promise.resolve({ data: null, error: null })),
  maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
  then:        vi.fn((cb) => Promise.resolve({ data: [], error: null }).then(cb)),
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

// Mock Firebase config to prevent invalid API key error
vi.mock('../firebase/config', () => ({
  db: {},
  auth: { currentUser: null },
  storage: {},
}));

// Mock Supabase client
vi.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));