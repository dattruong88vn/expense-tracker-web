import { setupServer } from 'msw/node';

import { handlers } from '@/mocks/handlers';

export { API_BASE_URL } from '@/mocks/auth-handlers';

export const server = setupServer(...handlers);
