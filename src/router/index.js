import { useAuthStore } from '@/stores/AuthStore.js'
import { createRouter, createWebHistory } from 'vue-router'
import { MY_PROJECT_VIEWS } from '@/router/projects.js'
import { PUBLISHED_PROJECT_VIEWS } from '@/router/published.js'

import AdminHomeView from '@/views/admin/AdminHomeView.vue'
import AdminView from '@/views/admin/AdminView.vue'
import ApiView from '@/views/misc/ApiView.vue'
import AskUsView from '@/views/misc/AskUsView.vue'
import CuratorHomeView from '@/views/curator/CuratorHomeView.vue'
import CuratorView from '@/views/curator/CuratorView.vue'
import HomeView from '@/views/HomeView.vue'
import MyProjectsView from '@/views/project/MyProjectsView.vue'
import NewsView from '@/views/misc/NewsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ProjectView from '@/views/project/published/ProjectView.vue'
import RootView from '@/views/RootView.vue'
import TermsView from '@/views/misc/TermsView.vue'
import UserLogin from '@/views/users/UserLogin.vue'
import UserAuth from '@/views/users/UserAuth.vue'
import UserProfileView from '@/views/users/UserProfileView.vue'
import UserRegistrationView from '@/views/users/UserRegistrationView.vue'
import UserView from '@/views/users/UserView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // User's Projects
    {
      path: '/',
      name: 'RootView',
      component: RootView,
      children: [
        {
          path: '',
          name: 'HomeView',
          component: HomeView,
        },

        // misc
        {
          path: '/askus',
          name: 'AskUsView',
          component: AskUsView,
        },
        {
          path: '/news',
          name: 'MewsView',
          component: NewsView,
        },
        {
          path: '/api',
          name: 'api',
          component: ApiView,
        },
        {
          path: '/terms',
          name: 'terms',
          component: TermsView,
        },

        // users
        {
          path: '/users',
          component: UserView,
          children: [
            {
              path: 'login',
              name: 'UserLogin',
              component: UserLogin,
            },
            {
              path: 'auth',
              name: 'UserAuth',
              component: UserAuth,
              beforeEnter: (to, from) => {
                if (!to.query.code) {
                  return { name: 'UserLogin' }
                }
              },
            },
            {
              path: 'myprofile',
              name: 'myprofile',
              component: UserProfileView,
              beforeEnter: (to, from) => {
                const authStore = useAuthStore()
                if (!authStore.hasValidAuthToken() && to.name !== 'UserLogin') {
                  return { name: 'UserLogin' }
                }
              },
            },
            {
              path: 'register',
              name: 'UserRegistrationView',
              component: UserRegistrationView,
            },
          ],
        },

        // admin
        {
          path: '/admin',
          component: AdminView,
          beforeEnter: (to, from) => {
            const authStore = useAuthStore()
            if (!authStore.hasValidAuthToken() && to.name !== 'UserLogin') {
              return { name: 'UserLogin' }
            }
          },
          children: [
            {
              path: '',
              name: 'AdminHomeView',
              component: AdminHomeView,
            },
          ],
        },

        // curation
        {
          path: '/curator',
          component: CuratorView,
          children: [
            {
              path: '',
              name: 'CuratorHomeView',
              component: CuratorHomeView,
              beforeEnter: (to, from) => {
                const authStore = useAuthStore()
                if (!authStore.hasValidAuthToken() && to.name !== 'UserLogin') {
                  return { name: 'UserLogin' }
                }
              },
            },
          ],
        },
        // User's Projects
        {
          path: '/myprojects',
          name: 'MyProjectListView',
          component: () =>
            import(
              /* webpackChunkName: "unpublished" */ '@/views/project/home/ListView.vue'
            ),
        },
        {
          path: '/myprojects',
          name: 'MyProjectsView',
          component: MyProjectsView,
          beforeEnter: (to, from) => {
            const authStore = useAuthStore()
            if (!authStore.hasValidAuthToken() && to.name !== 'UserLogin') {
              return { name: 'UserLogin' }
            }
          },
          children: MY_PROJECT_VIEWS,
        },

        // Public view of Projects
        {
          path: '/project',
          component: ProjectView,
          // add default redirect to /project view
          redirect: '/project/pub_date',
          children: PUBLISHED_PROJECT_VIEWS,
        },
        {
          path: '/:catchAll(.*)',
          component: NotFoundView,
        },
      ],
    },
    {
      path: '/myprojects/:projectId/matrices/:matrixId/edit',
      name: 'MyProjectMatrixEditView',
      component: () => import('@/views/project/matrices/MatrixEditorView.vue'),
    },
    {
      path: '/myprojects/:projectId/matrices/:matrixId/characters',
      name: 'MyProjectCharacterEditorView',
      component: () =>
        import('@/views/project/matrices/CharacterEditorView.vue'),
    },
    {
      path: '/project/:projectId/matrices/:matrixId/view',
      name: 'ProjectMatrixViewerView',
      component: () => import('@/views/project/published/MatrixViewerView.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return { el: to.hash, behavior: 'auto' }
    } else if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

router.beforeEach((to, from) => {
  if (to.fullPath != from.fullPath) {
    console.time(to.fullPath)
  }
})

router.afterEach((to, from) => {
  if (to.fullPath != from.fullPath) {
    console.timeEnd(to.fullPath)
  }
})

export default router
