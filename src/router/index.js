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
import { requireMatrixEditAccess, requireProjectOwnerOrCurator } from '@/lib/route-guards.js'

// Helper function to create redirects with project_id query parameter extraction
function createProjectRedirect(newPathTemplate, fallbackPath = null) {
  return (to) => {
    const projectId = to.query.project_id
    if (projectId && /^\d+$/.test(projectId)) {
      return newPathTemplate.replace(':projectId', projectId)
    }
    return fallbackPath || newPathTemplate.replace('/:projectId', '')
  }
}

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
          beforeEnter: [requireSignInAndProfileConfirmation, requireProjectOwnerOrCurator],
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

        // ============================================
        // LEGACY URL REDIRECTS (Old PHP URLs)
        // ============================================

        // Handle /index.php/ prefix - strip it and redirect to the clean URL
        {
          path: '/index.php/:pathMatch(.*)*',
          redirect: (to) => {
            const cleanPath = '/' + to.params.pathMatch
            return {
              path: cleanPath,
              query: to.query,
            }
          },
        },

        // 1. Public Pages
        {
          path: '/Home/index',
          redirect: '/',
        },
        {
          path: '/Search/index',
          redirect: '/search',
        },
        {
          path: '/Contact/index',
          redirect: '/askus',
        },
        {
          path: '/Press/index',
          redirect: '/news',
        },
        {
          path: '/TermsOfUse/index',
          redirect: '/terms',
        },
        {
          path: '/TermsOfUse/Form',
          redirect: '/terms',
        },

        // About page - redirect to external wiki
        {
          path: '/About/index',
          beforeEnter: () => {
            window.location.href = 'https://phoenixbioinformatics.atlassian.net/wiki/spaces/MD/pages/42230791/About+MorphoBank'
          },
        },

        // Unimplemented public pages - redirect to homepage
        {
          path: '/Documentation/index',
          redirect: '/',
        },
        {
          path: '/FAQ/index',
          redirect: '/',
        },

        // 2. Authentication Pages
        {
          path: '/LoginReg/form',
          redirect: '/users/login',
        },
        {
          path: '/LoginReg/resetSend',
          redirect: '/users/resetpassword',
        },
        {
          path: '/LoginReg/resetSave',
          redirect: '/users/set-new-password',
        },

        // 3. User Projects (MyProjects) - with query parameter extraction
        {
          path: '/MyProjects/List/index',
          redirect: '/myprojects',
        },
        {
          path: '/MyProjects/List/ProjectOverview',
          redirect: createProjectRedirect('/myprojects/:projectId/overview', '/myprojects'),
        },
        {
          path: '/MyProjects/List/DownloadProjectPage',
          redirect: createProjectRedirect('/myprojects/:projectId/download', '/myprojects'),
        },
        {
          path: '/MyProjects/Media/index',
          redirect: createProjectRedirect('/myprojects/:projectId/media', '/myprojects'),
        },
        {
          path: '/MyProjects/Media/form',
          redirect: createProjectRedirect('/myprojects/:projectId/media/create', '/myprojects'),
        },
        {
          path: '/MyProjects/Media/View',
          redirect: createProjectRedirect('/myprojects/:projectId/media', '/myprojects'),
        },
        {
          path: '/MyProjects/Media/BatchForm',
          redirect: createProjectRedirect('/myprojects/:projectId/media/create/batch', '/myprojects'),
        },
        {
          path: '/MyProjects/Taxa/index',
          redirect: createProjectRedirect('/myprojects/:projectId/taxa', '/myprojects'),
        },
        {
          path: '/MyProjects/Taxa/form',
          redirect: createProjectRedirect('/myprojects/:projectId/taxa/create', '/myprojects'),
        },
        {
          path: '/MyProjects/Taxa/AddTaxa',
          redirect: createProjectRedirect('/myprojects/:projectId/taxa/create', '/myprojects'),
        },
        {
          path: '/MyProjects/Specimens/index',
          redirect: createProjectRedirect('/myprojects/:projectId/specimens', '/myprojects'),
        },
        {
          path: '/MyProjects/Specimens/form',
          redirect: createProjectRedirect('/myprojects/:projectId/specimens/create', '/myprojects'),
        },
        {
          path: '/MyProjects/Matrices/index',
          redirect: createProjectRedirect('/myprojects/:projectId/matrices', '/myprojects'),
        },
        {
          path: '/MyProjects/Matrices/form',
          redirect: createProjectRedirect('/myprojects/:projectId/matrices/create', '/myprojects'),
        },
        {
          path: '/MyProjects/Matrices/choose',
          redirect: createProjectRedirect('/myprojects/:projectId/matrices/create/choose', '/myprojects'),
        },
        {
          path: '/MyProjects/Bibliography/index',
          redirect: createProjectRedirect('/myprojects/:projectId/bibliography', '/myprojects'),
        },
        {
          path: '/MyProjects/Views/index',
          redirect: createProjectRedirect('/myprojects/:projectId/views', '/myprojects'),
        },
        {
          path: '/MyProjects/Views/form',
          redirect: createProjectRedirect('/myprojects/:projectId/views/create', '/myprojects'),
        },
        {
          path: '/MyProjects/Project/form',
          redirect: createProjectRedirect('/myprojects/:projectId/edit', '/myprojects'),
        },
        {
          path: '/MyProjects/Members/index',
          redirect: createProjectRedirect('/myprojects/:projectId/members', '/myprojects'),
        },
        {
          path: '/MyProjects/MemberGroups/index',
          redirect: createProjectRedirect('/myprojects/:projectId/members/groups', '/myprojects'),
        },
        {
          path: '/MyProjects/Publishing/publishForm',
          redirect: createProjectRedirect('/myprojects/:projectId/publish', '/myprojects'),
        },
        {
          path: '/MyProjects/Publishing/pubPrefForm',
          redirect: createProjectRedirect('/myprojects/:projectId/publish/preferences', '/myprojects'),
        },

        // Unimplemented MyProjects pages
        {
          path: '/MyProjects/Members/find',
          redirect: '/myprojects',
        },
        {
          path: '/MyProjects/Members/invite_member',
          redirect: '/myprojects',
        },

        // 4. Published Projects (Public View) - with query parameter extraction
        {
          path: '/Projects/index',
          redirect: '/projects/journal_year',
        },
        {
          path: '/Projects/ProjectOverview',
          redirect: createProjectRedirect('/project/:projectId/overview', '/projects/journal_year'),
        },
        {
          path: '/Projects/matrices',
          redirect: createProjectRedirect('/project/:projectId/matrices', '/projects/journal_year'),
        },
        {
          path: '/Projects/media',
          redirect: createProjectRedirect('/project/:projectId/media', '/projects/journal_year'),
        },
        {
          path: '/Projects/Taxa',
          redirect: createProjectRedirect('/project/:projectId/taxa', '/projects/journal_year'),
        },
        {
          path: '/Projects/Specimens',
          redirect: createProjectRedirect('/project/:projectId/specimens', '/projects/journal_year'),
        },
        {
          path: '/Projects/MediaViews',
          redirect: createProjectRedirect('/project/:projectId/views', '/projects/journal_year'),
        },
        {
          path: '/Projects/ProjectDocuments',
          redirect: createProjectRedirect('/project/:projectId/documents', '/projects/journal_year'),
        },
        {
          path: '/Projects/BibliographicReferences',
          redirect: createProjectRedirect('/project/:projectId/bibliography', '/projects/journal_year'),
        },
        {
          path: '/Projects/FoliosList',
          redirect: createProjectRedirect('/project/:projectId/folios', '/projects/journal_year'),
        },

        // Unimplemented published project pages
        {
          path: '/Projects/ProjectPreview',
          redirect: '/',
        },
        {
          path: '/Projects/viewMatrix',
          redirect: '/',
        },
        {
          path: '/Projects/MediaViewer',
          redirect: '/',
        },
        {
          path: '/Projects/HTML5Labels',
          redirect: '/',
        },
        {
          path: '/Projects/HTML5ViewerHelp',
          redirect: '/',
        },

        // 5. Admin Pages - redirect all to admin home
        {
          path: '/Administration/:pathMatch(.*)*',
          redirect: '/admin',
        },

        // 6. Curator Pages
        {
          path: '/Curator/Projects/index',
          redirect: '/curator',
        },
        {
          path: '/Curator/Dashboard/index',
          redirect: '/curator',
        },
        {
          path: '/Curator/InstitutionRequests/index',
          redirect: '/curator',
        },
        {
          path: '/Curator/:pathMatch(.*)*',
          redirect: '/curator',
        },

        // 7. User Preferences
        {
          path: '/system/Preferences/EditProfilePrefs',
          redirect: '/users/myprofile',
        },

        // 8. System/Log Pages - redirect to homepage
        {
          path: '/system/Error/Show',
          redirect: '/',
        },
        {
          path: '/logs/:pathMatch(.*)*',
          redirect: '/',
        },

        // ============================================
        // END LEGACY URL REDIRECTS
        // ============================================

        {
          path: '/:catchAll(.*)*',
          name: 'NotFoundView',
          component: NotFoundView,
        },
      ],
    },
    // Routes related to matrix editor
    {
      path: '/myprojects/:projectId/matrices/:matrixId/view',
      name: 'MyProjectMatrixViewerView',
      component: () => import('@/views/project/matrices/MatrixViewerView.vue'),
      beforeEnter: async (to, from, next) => {
        to.meta.published = false
        next()
      },
    },
    {
      path: '/myprojects/:projectId/matrices/:matrixId/edit',
      name: 'MyProjectMatrixEditView',
      component: () => import('@/views/project/matrices/MatrixEditorView.vue'),
      beforeEnter: requireMatrixEditAccess,
    },
    {
      path: '/myprojects/:projectId/matrices/:matrixId/characters',
      name: 'MyProjectCharacterEditorView',
      component: () =>
        import('@/views/project/matrices/CharacterEditorView.vue'),
      beforeEnter: requireMatrixEditAccess,
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
  // Display toast errors passed via query (?error=...)
  const maybeError = to.query && to.query.error
  if (maybeError) {
    // Support both string and array values
    const message = Array.isArray(maybeError) ? maybeError[0] : maybeError
    // Dynamically import notifications to avoid early Pinia usage
    import('@/composables/useNotifications.ts')
      .then(({ useNotifications }) => {
        const { showError } = useNotifications()
        if (message && String(message).trim().length > 0) {
          showError(String(message), 'Permission Denied')
        }
      })
      .catch(() => {})

    // Clean the error param from URL to prevent repeat toasts
    const newQuery = { ...to.query }
    delete newQuery.error
    // Avoid triggering navigation if nothing changed
    if (to.query.error !== undefined) {
      router.replace({ name: to.name, params: to.params, query: newQuery })
    }
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

  // Skip profile confirmation for anonymous reviewer sessions
  if (authStore.isAnonymousReviewer) {
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
