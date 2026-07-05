/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
      }} />
    </AppProviders>
  );
}
