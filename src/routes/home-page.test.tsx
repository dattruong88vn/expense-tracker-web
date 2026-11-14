import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { API_BASE_URL, server } from '@/test/msw';
import { renderRoute } from '@/test/render';

describe('HomePage', () => {
  it('shows a loading state, then the status returned by GET /health', async () => {
    renderRoute('/');

    expect(screen.getByRole('status')).toHaveTextContent('Checking the API…');
    expect(await screen.findByText('ok')).toBeInTheDocument();
  });

  it('shows an error state when the API is unreachable, and recovers on retry', async () => {
    server.use(http.get(`${API_BASE_URL}/health`, () => HttpResponse.error()));
    renderRoute('/');

    expect(await screen.findByText('The API is unreachable.')).toBeInTheDocument();

    server.resetHandlers();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('ok')).toBeInTheDocument();
  });

  it('renders the not-found page for an unknown route', () => {
    renderRoute('/unknown');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
