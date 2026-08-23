import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './Home';
import { AuthProvider } from '../hooks/useAuth';
import { LanguageProvider } from '../i18n/LanguageContext';
import { Layout } from '../components/layout/LayoutWithSidebar';
import * as api from '../services/api';

vi.mock('../services/api');

// Render Home within the real app layout route structure.
// LayoutWithSidebar renders LeaderSelector (and hides Home) when
// no identity is set, so tests must authenticate via localStorage.
function renderHome({ authenticated = true }: { authenticated?: boolean } = {}) {
  if (authenticated) {
    localStorage.setItem('employee_id', '1');
  }
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

describe('Home Page', () => {
  // Mock employees for LeaderSelector
  const mockEmployees = [
    { id: 1, name: 'Alice', email: 'alice@test.com', position_name: 'CEO' },
    { id: 2, name: 'Bob', email: 'bob@test.com', position_name: 'CTO' },
  ];

  const mockSubordinates = [
    {
      employee_id: 2,
      employee_name: 'Bob Sinclair',
      position_name: 'CTO',
      latest_evaluation: null,
      depth: 0
    },
    {
      employee_id: 3,
      employee_name: 'Carol Nguyen',
      position_name: 'CFO',
      latest_evaluation: {
        id: 1,
        employee_id: 3,
        evaluator_id: 1,
        total_score: 3.5,
        evaluation_date: '2026-08-17T10:00:00Z',
        evaluation_year: 2026,
        week_number: 33,
        questions: [
          { question_id: 1, title: 'Entrega de Resultados', weight: 25, score: 4 }
        ]
      },
      depth: 0
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('employee_id');
    // Mock getEmployees for LeaderSelector
    vi.mocked(api.getEmployees).mockResolvedValue(mockEmployees);
  });

  it('should display subordinates list when data loads successfully', async () => {
    vi.mocked(api.getSubordinateEvaluations).mockResolvedValue(mockSubordinates);

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Bob Sinclair')).toBeInTheDocument();
      expect(screen.getByText('Carol Nguyen')).toBeInTheDocument();
      expect(screen.getByText('CTO')).toBeInTheDocument();
      expect(screen.getByText('CFO')).toBeInTheDocument();
    });
  });

  it('should handle empty subordinate list', async () => {
    vi.mocked(api.getSubordinateEvaluations).mockResolvedValue([]);

    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/não possui subordinados/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully with retry option', async () => {
    vi.mocked(api.getSubordinateEvaluations).mockRejectedValue(new Error('API Error'));

    renderHome();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tentar novamente|retry/i })).toBeInTheDocument();
    });
  });

  it('should retry loading after API failure when retry is clicked', async () => {
    vi.mocked(api.getSubordinateEvaluations)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce(mockSubordinates);

    const user = userEvent.setup();
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tentar novamente|retry/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /tentar novamente|retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Bob Sinclair')).toBeInTheDocument();
    });
    expect(api.getSubordinateEvaluations).toHaveBeenCalledTimes(2);
  });

  it('should show evaluate and history actions for each subordinate', async () => {
    vi.mocked(api.getSubordinateEvaluations).mockResolvedValue(mockSubordinates);

    renderHome();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Avaliar/ })).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: /histórico/i })).toHaveLength(2);
    });
  });

  it('AC-37: shows leader selector prompt when API returns 401', async () => {
    // Mock API to return 401 (unauthorized)
    const error401 = new Error('Unauthorized');
    (error401 as any).response = { status: 401 };
    vi.mocked(api.getSubordinateEvaluations).mockRejectedValue(error401);

    renderHome({ authenticated: false });

    await waitFor(() => {
      expect(screen.getByText(/Selecione sua identidade/i)).toBeInTheDocument();
    });
  });
});
