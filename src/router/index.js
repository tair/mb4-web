import { useAuthStore } from '@/stores/AuthStore.js'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import { createRouter, createWebHistory } from 'vue-router'
import { MY_PROJECT_VIEWS } from '@/router/projects.js'

import AdminHomeView from '@/views/admin/AdminHomeView.vue'
import AdminView from '@/views/admin/AdminView.vue'
import AskUsView from '@/views/misc/AskUsView.vue'
import CuratorHomeView from '@/views/curator/CuratorHomeView.vue'
import CuratorView from '@/views/curator/CuratorView.vue'
import HomeView from '@/views/HomeView.vue'
import MyProjectMatrixEditView from '@/views/project/MyProjectMatrixEditView.vue'
import MyProjectsView from '@/views/project/MyProjectsView.vue'
import NewsView from '@/views/misc/NewsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ProjectAuthorView from '@/views/project/ProjectAuthorView.vue'
import ProjectBibliographyView from '@/views/project/ProjectBibliographyView.vue'
import ProjectDocumentView from '@/views/project/ProjectDocumentView.vue'
import ProjectDownloadView from '@/views/project/ProjectDownloadView.vue'
import ProjectInstitutionView from '@/views/project/ProjectInstitutionView.vue'
import ProjectJournalView from '@/views/project/ProjectJournalView.vue'
import ProjectMatrixView from '@/views/project/ProjectMatrixView.vue'
import ProjectMediaView from '@/views/project/ProjectMediaView.vue'
import ProjectMediaViewsView from '@/views/project/ProjectMediaViewsView.vue'
import ProjectOverviewView from '@/views/project/ProjectOverviewView.vue'
import ProjectPopularView from '@/views/project/ProjectPopularView.vue'
import ProjectSpecimenView from '@/views/project/ProjectSpecimenView.vue'
import ProjectTaxaView from '@/views/project/ProjectTaxaView.vue'
import ProjectTitleView from '@/views/project/ProjectTitleView.vue'
import ProjectView from '@/views/project/ProjectView.vue'
import ProjectsHomeView from '@/views/project/ProjectsHomeView.vue'
import RootView from '@/views/RootView.vue'
import Terms from '@/views/misc/Terms.vue'
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
          path: '/terms',
          name: 'terms',
          component: Terms,
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
          children: [
            {
              path: 'pub_date',
              name: 'ProjectPubDateView',
              component: ProjectsHomeView,
            },
            {
              path: 'prj_no',
              name: 'ProjectNoView',
              component: ProjectsHomeView,
            },
            {
              path: 'journal_year',
              name: 'ProjectJornalYearView',
              component: ProjectsHomeView,
            },
            {
              path: 'title',
              name: 'ProjectTitleView',
              component: ProjectTitleView,
            },
            {
              path: 'popular',
              name: 'ProjectPopularView',
              component: ProjectPopularView,
            },
            {
              path: 'author',
              name: 'ProjectAuthorView',
              component: ProjectAuthorView,
            },
            {
              path: 'journal',
              name: 'ProjectJournalView',
              component: ProjectJournalView,
            },
            {
              path: 'institution',
              name: 'ProjectInstitutionView',
              component: ProjectInstitutionView,
            },
            {
              path: ':id/overview',
              name: 'ProjectOverviewView',
              component: ProjectOverviewView,
            },
            {
              path: ':id/matrices',
              name: 'ProjectMatrixView',
              component: ProjectMatrixView,
            },
            {
              path: ':id/media',
              name: 'ProjectMediaView',
              component: ProjectMediaView,
            },
            {
              path: ':id/views',
              name: 'ProjectMediaViewsView',
              component: ProjectMediaViewsView,
            },
            {
              path: ':id/specimens',
              name: 'ProjectSpecimenView',
              component: ProjectSpecimenView,
            },
            {
              path: ':id/taxa',
              name: 'ProjectTaxaView',
              component: ProjectTaxaView,
            },
            {
              path: ':id/bibliography',
              name: 'ProjectBibliographyView',
              component: ProjectBibliographyView,
            },
            {
              path: ':id/documents',
              name: 'ProjectDocumentView',
              component: ProjectDocumentView,
            },
            {
              path: ':id/download',
              name: 'ProjectDownloadView',
              component: ProjectDownloadView,
              beforeEnter: (to, from) => {
                const projectDetailStore = usePublicProjectDetailsStore()
                const id = to.params.id
                if (!projectDetailStore.isDownloadValid(id)) {
                  return { name: 'ProjectOverviewView', params: { id } }
                }
              },
            },
          ],
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
      component: MyProjectMatrixEditView,
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

export default router
