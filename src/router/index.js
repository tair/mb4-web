import { useAuthStore } from '@/stores/AuthStore.js'
import { createRouter, createWebHistory } from 'vue-router'

import AdminHomeView from '@/views/admin/AdminHomeView.vue'
import AdminView from '@/views/admin/AdminView.vue'
import AskUsView from '@/views/misc/AskUsView.vue'
import CuratorHomeView from '@/views/curator/CuratorHomeView.vue'
import CuratorView from '@/views/curator/CuratorView.vue'
import DocsView from '@/views/misc/DocsView.vue'
import FaqView from '@/views/misc/FaqView.vue'
import HomeView from '@/views/HomeView.vue'
import MyProjectBibliographyView from '@/views/project/MyProjectBibliographyView.vue'
import MyProjectHomeView from '@/views/project/MyProjectHomeView.vue'
import MyProjectMatrixView from '@/views/project/MyProjectMatrixView.vue'
import MyProjectMediaView from '@/views/project/MyProjectMediaView.vue'
import MyProjectMediaViewsView from '@/views/project/MyProjectMediaViewsView.vue'
import MyProjectSpecimensView from '@/views/project/MyProjectSpecimensView.vue'
import MyProjectTaxaView from '@/views/project/MyProjectTaxaView.vue'
import MyProjectDocumentsView from '@/views/project/MyProjectDocumentsView.vue'
import MyProjectsView from '@/views/project/MyProjectsView.vue'
import NewsView from '@/views/misc/NewsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ProjectAuthorView from '@/views/project/ProjectAuthorView.vue'
import ProjectBibliographyView from '@/views/project/ProjectBibliographyView.vue'
import ProjectDocumentView from '@/views/project/ProjectDocumentView.vue'
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
import UserLogin from '@/views/users/UserLogin.vue'
import UserProfileView from '@/views/users/UserProfileView.vue'
import UserRegistrationView from '@/views/users/UserRegistrationView.vue'
import UserView from '@/views/users/UserView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
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
      path: '/docs',
      name: 'DocsView',
      component: DocsView,
    },
    {
      path: '/faq',
      name: 'FaqView',
      component: FaqView,
    },
    {
      path: '/news',
      name: 'MewsView',
      component: NewsView,
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
          path: 'myprofile',
          name: 'UserProfileView',
          component: UserProfileView,
          beforeEnter: (to, from) => {
            const authStore = useAuthStore()
            if (!authStore.user?.authToken && to.name !== 'UserLogin') {
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
        if (!authStore.user?.authToken && to.name !== 'UserLogin') {
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
            if (!authStore.user?.authToken && to.name !== 'UserLogin') {
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
        if (!authStore.user?.authToken && to.name !== 'UserLogin') {
          return { name: 'UserLogin' }
        }
      },
      children: [
        {
          path: ':id',
          name: 'MyProjectHomeView',
          component: MyProjectHomeView,
        },
        {
          path: ':id/matrices',
          name: 'MyProjectMatrixView',
          component: MyProjectMatrixView,
        },
        {
          path: ':id/media',
          name: 'MyProjectMediaView',
          component: MyProjectMediaView,
        },
        {
          path: ':id/views',
          name: 'MyProjectMediaViewsView',
          component: MyProjectMediaViewsView,
        },
        {
          path: ':id/specimens',
          name: 'MyProjectSpecimensView',
          component: MyProjectSpecimensView,
        },
        {
          path: ':id/taxa',
          name: 'MyProjectTaxaView',
          component: MyProjectTaxaView,
        },
        {
          path: ':id/bibliography',
          name: 'MyProjectBibliographyView',
          component: MyProjectBibliographyView,
        },
        {
          path: ':id/documents',
          name: 'MyProjectDocumentsView',
          component: MyProjectDocumentsView,
        },
      ],
    },

    // Public view of Projects
    {
      path: '/project',
      component: ProjectView,
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
      ],
    },
    {
      path: '/:catchAll(.*)',
      component: NotFoundView,
    },
  ],
})

export default router
