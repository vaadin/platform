/******************************************************************************
 * Copied from generated file to wrap in AuthProvider
 ******************************************************************************/

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from 'Frontend/generated/routes';
import { AuthProvider } from './auth';

function App() {
    return <AuthProvider>
        <RouterProvider router={router} />
    </AuthProvider>;
}

createRoot(document.getElementById('outlet')!).render(createElement(App));
