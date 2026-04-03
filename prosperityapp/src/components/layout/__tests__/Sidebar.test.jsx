import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../Sidebar';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
const mockSignOutAll = vi.fn();
vi.mock('../../../context/BusinessContext', () => ({
  useBusiness: () => ({ realRole: global.__REAL_ROLE__ || 'owner', signOutAll: mockSignOutAll })
}));

vi.mock('../../../context/DataContext', () => ({
  useData: () => ({ userRole: 'owner', config: [{ brandName: 'Test Brand' }] })
}));

vi.mock('../../../context/ThemeContext', () => ({
  ThemeContext: React.createContext({ toggleTheme: vi.fn(), isDark: false })
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: vi.fn(), language: 'es' }
  })
}));

// Mock feather icons
global.feather = {
  icons: {
    calendar: { toSvg: () => '<svg></svg>' },
    home: { toSvg: () => '<svg></svg>' },
    'dollar-sign': { toSvg: () => '<svg></svg>' },
    truck: { toSvg: () => '<svg></svg>' },
    users: { toSvg: () => '<svg></svg>' },
    briefcase: { toSvg: () => '<svg></svg>' },
    clipboard: { toSvg: () => '<svg></svg>' },
    'book-open': { toSvg: () => '<svg></svg>' },
    tag: { toSvg: () => '<svg></svg>' },
    archive: { toSvg: () => '<svg></svg>' },
    package: { toSvg: () => '<svg></svg>' },
    'credit-card': { toSvg: () => '<svg></svg>' },
    'file-text': { toSvg: () => '<svg></svg>' },
    settings: { toSvg: () => '<svg></svg>' },
    'log-out': { toSvg: () => '<svg></svg>' },
    sun: { toSvg: () => '<svg></svg>' },
    moon: { toSvg: () => '<svg></svg>' },
  }
};

const renderSidebar = () => {
  render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all modules for owner role', () => {
    global.__REAL_ROLE__ = 'owner';
    renderSidebar();

    expect(screen.getByText('sidebar.agenda')).toBeInTheDocument();
    expect(screen.getByText('sidebar.dashboard')).toBeInTheDocument();
    expect(screen.getByText('sidebar.dailyCash')).toBeInTheDocument();
    expect(screen.getByText('sidebar.clients')).toBeInTheDocument();
  });

  it('renders only allowed modules for collaborator role', () => {
    global.__REAL_ROLE__ = 'collaborator';
    renderSidebar();

    expect(screen.getByText('sidebar.agenda')).toBeInTheDocument();
    expect(screen.getByText('sidebar.payroll')).toBeInTheDocument();
    expect(screen.getByText('sidebar.prices')).toBeInTheDocument();

    expect(screen.queryByText('sidebar.dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('sidebar.dailyCash')).not.toBeInTheDocument();
  });

  it('calls signOutAll on logout', () => {
    global.__REAL_ROLE__ = 'collaborator';
    renderSidebar();

    fireEvent.click(screen.getByText('sidebar.logout'));
    expect(mockSignOutAll).toHaveBeenCalled();
  });
});