import type { RouteRecordRaw } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';

import { $t } from '#/locales';

const BasicLayout = () => import('#/layouts/basic.vue');
const AuthPageLayout = () => import('#/layouts/auth.vue');
/** 全局404页面 */
const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/_core/fallback/not-found.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: '404',
  },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

/** 基本路由，这些路由是必须存在的 */
const coreRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: BasicLayout,
    name: 'Root',
    redirect: '/start',
    meta: {
      hideInBreadcrumb: true,
      title: 'Root',
    },
    children: [
      {
        path: 'start',
        name: 'start',
        component: () => import('#/views/_core/authentication/login.vue'),
        meta: {
          title: 'Display GraPARI',
          hideInTab: true,
        },
      },
    ],
  },
];


export { coreRoutes, fallbackNotFoundRoute };
