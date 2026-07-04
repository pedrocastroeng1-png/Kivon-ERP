/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
