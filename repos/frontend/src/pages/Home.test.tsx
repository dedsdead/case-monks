import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Home } from './Home';
import { AuthProvider } from '../hooks/useAuth';
import { LanguageProvider } from '../i18n/LanguageContext';
import * as api from '../services/api';

vi.mock('../services/api');

function renderHome() {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Home />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

describe('Home Page', () => {
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
});
