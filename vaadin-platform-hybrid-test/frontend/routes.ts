import { Flow } from '@vaadin/flow-frontend';

const { serverSideRoutes } = new Flow({
  imports: () => import('../target/frontend/generated-flow-imports'),
});

export const routes = [
  // for client-side, place routes below (more info https://vaadin.com/docs/v18/flow/typescript/creating-routes.html)
  {
    path: '',
    component: 'main-view',
    action: async () => {
      await import('./views/main/main-view');
    },
    children: [
      {
        path: 'components',
        component: 'components-view',
        action: async () => {
          await import('./views/components/components-view');
        },
      },
      {
        path: '(hello-ts|)',
        component: 'hello-world-ts-view',
        action: async () => {
          await import('./views/helloworldts/hello-world-ts-view');
        },
      },
      // for server-side, the next magic line sends all unmatched routes:
      ...serverSideRoutes, // IMPORTANT: this must be the last entry in the array
    ],
  },
];
