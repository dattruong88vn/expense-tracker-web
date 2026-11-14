import { createBrowserRouter } from 'react-router-dom';

import { HomePage } from './home-page';
import { NotFoundPage } from './not-found-page';

export const routes = [
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
