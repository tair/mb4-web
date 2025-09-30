import { useAuthStore } from '@/stores/AuthStore.js'
import { invalidateOnProjectChange } from '@/stores/utils.js'
import { createRouter, createWebHistory } from 'vue-router'
import { MY_PROJECT_VIEWS } from '@/router/projects.js'
import {
  PUBLISHED_PROJECT_DETAIL_VIEWS,
  PUBLISHED_PROJECT_VIEWS,
} from '@/router/published.js'
import AdminHomeView from '@/views/admin/AdminHomeView.vue'
import AdminView from '@/views/admin/AdminView.vue'
import ApiView from '@/views/misc/ApiView.vue'
import AskUsView from '@/views/misc/AskUsView.vue'
import CuratorHomeView from '@/views/curator/CuratorHomeView.vue'
import CuratorView from '@/views/curator/CuratorView.vue'
import HomeView from '@/views/HomeView.vue'
import PermalinkView from '@/views/PermalinkView.vue'
import MyProjectsView from '@/views/project/MyProjectsView.vue'
import NewsView from '@/views/misc/NewsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ProjectView from '@/views/project/published/ProjectView.vue'
import RootView from '@/views/RootView.vue'
import TermsView from '@/views/misc/TermsView.vue'
import UserLoginView from '@/views/users/UserLoginView.vue'
import UserAuthView from '@/views/users/UserAuthView.vue'
import UserProfileView from '@/views/users/UserProfileView.vue'
import UserRegistrationByORCIDView from '@/views/users/UserRegistrationByORCIDView.vue'
import UserResetPasswordView from '@/views/users/UserResetPasswordView.vue'
import UserSetNewPasswordView from '@/views/users/UserSetNewPasswordView.vue'
import UserView from '@/views/users/UserView.vue'
import SearchView from '@/views/SearchView.vue'
import { apiService } from '@/services/apiService.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
        {
          path: '/search',
          name: 'SearchView',
          component: SearchView,
        },

        //permalink
        {
          path: '/permalink',
          name: 'Permalink',
          component: PermalinkView,
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
              component: UserLoginView,
            },
            {
              path: 'auth',
              name: 'UserAuth',
              component: UserAuthView,
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
              beforeEnter: requireSignIn,
            },
            {
              path: 'register',
              name: 'UserRegistrationView',
              component: UserRegistrationByORCIDView,
            },
            {
              path: 'resetpassword',
              name: 'UserResetPassword',
              component: UserResetPasswordView,
            },
            {
              path: 'set-new-password',
              name: 'UserSetNewPassword',
              component: UserSetNewPasswordView,
            },
          ],
        },
        // admin
        {
          path: '/admin',
          component: AdminView,
          beforeEnter: requireSignIn,
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
          beforeEnter: requireSignIn,
          children: [
            {
              path: '',
              name: 'CuratorHomeView',
              component: CuratorHomeView,
            },
            {
              path: 'duplication-requests',
              name: 'CuratorDuplicationRequestsList',
              component: () => import('@/views/curator/DuplicationRequestsListView.vue'),
            },
            {
              path: 'duplication-requests/:requestId',
              name: 'CuratorDuplicationRequestDetail',
              component: () => import('@/views/curator/DuplicationRequestDetailView.vue'),
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
          beforeEnter: requireSignInAndProfileConfirmation,
        },
        {
          path: '/myprojects/create',
          name: 'MyProjectCreateView',
          component: () =>
            import(
              /* webpackChunkName: "unpublished" */ '@/views/project/home/CreateView.vue'
            ),
          beforeEnter: requireSignInAndProfileConfirmation,
        },
        {
          path: '/myprojects/:id(\\d+)/edit',
          name: 'MyProjectEditView',
          component: () =>
            import(
              /* webpackChunkName: "unpublished" */ '@/views/project/home/EditProjectView.vue'
            ),
          beforeEnter: requireSignInAndProfileConfirmation,
        },
        {
          path: '/myprojects/:id(\\d+)',
          name: 'MyProjectsView',
          component: MyProjectsView,
          beforeEnter: [
            requireSignInAndProfileConfirmation,
            invalidateOnProjectChange,
            async (to, from, next) => {
              const projectId = to.params.id
              const isPublished = await checkUnpublishedProjectStatus(projectId)

              if (isPublished) {
                // Extract the sub-path from the full path
                const fullPath = to.fullPath
                const subPath = fullPath.replace(`/myprojects`, '')

                // Redirect to the published project path
                next(`/project${subPath}`)
              } else {
                next()
              }
            },
          ],
          children: MY_PROJECT_VIEWS,
        },

        // Public view of Projects
        {
          path: '/projects',
          component: ProjectView,
          // add default redirect to /projects/journal_year
          redirect: '/projects/journal_year',
          children: PUBLISHED_PROJECT_VIEWS,
        },
        {
          path: '/project/:id(\\d+)',
          component: ProjectView,
          beforeEnter: async (to, from, next) => {
            const projectId = to.params.id
            const { exists, published, message } =
              await checkProjectExistsAndPublished(projectId)
            if (!exists) {
              next({
                name: 'NotFoundView',
                query: {
                  message: message || 'This project does not exist.',
                },
              })
              return
            }

            if (!published) {
              next({
                name: 'NotFoundView',
                query: {
                  message:
                    message || 'This project is not yet publicly available.',
                },
              })
              return
            }

            next()
          },
          children: PUBLISHED_PROJECT_DETAIL_VIEWS,
        },
        {
          path: '/project',
          redirect: '/projects',
        },
        {
          path: '/:catchAll(.*)*',
          name: 'NotFoundView',
          component: NotFoundView,
        },
      ],
    },
    // Routes related to matrix editor
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
      beforeEnter: async (to, from, next) => {
        const projectId = to.params.projectId
        
        try {
          const { exists, published, message } = await checkProjectExistsAndPublished(projectId)
          
          // Security: Explicitly check that published is exactly true
          if (!exists || published !== true) {
            next({
              name: 'NotFoundView',
              query: {
                message: message || 'This project is not accessible.',
              },
            })
            return
          }

          // Only allow access if published is explicitly true
          to.meta.published = published
          next()
        } catch (error) {
          // Security: Any error in checking published status denies access
          console.error('Route Guard Error:', error)
          next({
            name: 'NotFoundView',
            query: {
              message: 'Unable to verify project access permissions.',
            },
          })
        }
      },
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

function requireSignIn(to) {
  const authStore = useAuthStore()
  if (!authStore.hasValidAuthToken() && to.name !== 'UserLogin') {
    return { name: 'UserLogin' }
  }
}

async function requireProfileConfirmation(to) {
  const authStore = useAuthStore()
  
  // Skip profile confirmation check for profile page itself and auth-related pages
  if (to.name === 'myprofile' || to.name === 'UserLogin' || to.name === 'UserAuth') {
    return
  }
  
  // Only check for authenticated users
  if (!authStore.hasValidAuthToken()) {
    return
  }

  try {
    const confirmationStatus = await authStore.checkProfileConfirmation()
    
    if (confirmationStatus.profile_confirmation_required) {
      // Redirect to profile page with a query parameter indicating confirmation is needed
      return { 
        name: 'myprofile', 
        query: { 
          confirm_profile: '1',
          message: 'Please confirm your profile details to continue'
        }
      }
    }
  } catch (error) {
    console.error('Profile confirmation check failed:', error)
    // Continue without blocking if check fails
  }
}

// Combined guard for authentication and profile confirmation
async function requireSignInAndProfileConfirmation(to) {
  // First check authentication
  const authCheck = requireSignIn(to)
  if (authCheck) {
    return authCheck
  }
  
  // Then check profile confirmation
  return await requireProfileConfirmation(to)
}

// Add a function to check if a project is published
async function checkUnpublishedProjectStatus(projectId) {
  try {
    const response = await apiService.get(`/projects/${projectId}/overview`)
    const responseData = await response.json()
    return responseData.overview.published === 1
  } catch (error) {
    console.error('Error checking if project is published:', error)
    return false
  }
}

// Add a function to check if a project exists and is published
async function checkProjectExistsAndPublished(projectId) {
  try {
    // Check if the project exists on public projects
    const response = await apiService.get(`/public/projects/${projectId}`)
    const responseData = await response.json()
    return {
      exists: true,
      published: responseData.published === 1,
      message:
        responseData.published === 1
          ? null
          : 'This project is not yet publicly available.',
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        exists: false,
        published: false,
        message: error.response.data.message,
      }
    }
    console.error('Error checking project status:', error)
    return {
      exists: false,
      published: false,
      message: 'An error occurred while checking the project status.',
    }
  }
}

export default router
