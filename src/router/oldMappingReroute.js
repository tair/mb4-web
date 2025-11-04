// ============================================
// LEGACY URL REDIRECTS (Old PHP URLs)
// ============================================
// This file contains all legacy URL redirects from the old PHP-based MorphoBank application
// to the new Vue.js application. These routes ensure backward compatibility with old URLs.

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

// Export legacy route configurations
export const legacyRoutes = [
  // Handle /index.php/ prefix - strip it and redirect to the clean URL
  {
    path: '/index.php/:pathMatch(.*)*',
    redirect: (to) => {
      // pathMatch can be an array when matching multiple path segments
      const pathMatch = to.params.pathMatch
      const cleanPath = Array.isArray(pathMatch) 
        ? '/' + pathMatch.join('/') 
        : '/' + pathMatch
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

  // API documentation page
  {
    path: '/About/api',
    redirect: '/api',
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
    path: '/MyProjects/List/ProjectOverview/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/overview`,
  },
  {
    path: '/MyProjects/List/ProjectOverview',
    redirect: createProjectRedirect('/myprojects/:projectId/overview', '/myprojects'),
  },
  {
    path: '/MyProjects/List/DownloadProjectPage/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/download`,
  },
  {
    path: '/MyProjects/List/DownloadProjectPage',
    redirect: createProjectRedirect('/myprojects/:projectId/download', '/myprojects'),
  },
  {
    path: '/MyProjects/Media/index/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/media`,
  },
  {
    path: '/MyProjects/Media/index',
    redirect: createProjectRedirect('/myprojects/:projectId/media', '/myprojects'),
  },
  {
    path: '/MyProjects/Media/form/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/media/create`,
  },
  {
    path: '/MyProjects/Media/form',
    redirect: createProjectRedirect('/myprojects/:projectId/media/create', '/myprojects'),
  },
  {
    path: '/MyProjects/Media/View/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/media`,
  },
  {
    path: '/MyProjects/Media/View',
    redirect: createProjectRedirect('/myprojects/:projectId/media', '/myprojects'),
  },
  {
    path: '/MyProjects/Media/BatchForm/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/media/create/batch`,
  },
  {
    path: '/MyProjects/Media/BatchForm',
    redirect: createProjectRedirect('/myprojects/:projectId/media/create/batch', '/myprojects'),
  },
  {
    path: '/MyProjects/Taxa/index/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/taxa`,
  },
  {
    path: '/MyProjects/Taxa/index',
    redirect: createProjectRedirect('/myprojects/:projectId/taxa', '/myprojects'),
  },
  {
    path: '/MyProjects/Taxa/form/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/taxa/create`,
  },
  {
    path: '/MyProjects/Taxa/form',
    redirect: createProjectRedirect('/myprojects/:projectId/taxa/create', '/myprojects'),
  },
  {
    path: '/MyProjects/Taxa/AddTaxa/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/taxa/create`,
  },
  {
    path: '/MyProjects/Taxa/AddTaxa',
    redirect: createProjectRedirect('/myprojects/:projectId/taxa/create', '/myprojects'),
  },
  {
    path: '/MyProjects/Specimens/index/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/specimens`,
  },
  {
    path: '/MyProjects/Specimens/index',
    redirect: createProjectRedirect('/myprojects/:projectId/specimens', '/myprojects'),
  },
  {
    path: '/MyProjects/Specimens/form/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/specimens/create`,
  },
  {
    path: '/MyProjects/Specimens/form',
    redirect: createProjectRedirect('/myprojects/:projectId/specimens/create', '/myprojects'),
  },
  {
    path: '/MyProjects/Matrices/index/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/matrices`,
  },
  {
    path: '/MyProjects/Matrices/index',
    redirect: createProjectRedirect('/myprojects/:projectId/matrices', '/myprojects'),
  },
  {
    path: '/MyProjects/Matrices/form/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/matrices/create`,
  },
  {
    path: '/MyProjects/Matrices/form',
    redirect: createProjectRedirect('/myprojects/:projectId/matrices/create', '/myprojects'),
  },
  {
    path: '/MyProjects/Matrices/choose/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/matrices/create/choose`,
  },
  {
    path: '/MyProjects/Matrices/choose',
    redirect: createProjectRedirect('/myprojects/:projectId/matrices/create/choose', '/myprojects'),
  },
  {
    path: '/MyProjects/Bibliography/index/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/bibliography`,
  },
  {
    path: '/MyProjects/Bibliography/index',
    redirect: createProjectRedirect('/myprojects/:projectId/bibliography', '/myprojects'),
  },
  {
    path: '/MyProjects/Views/index/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/views`,
  },
  {
    path: '/MyProjects/Views/index',
    redirect: createProjectRedirect('/myprojects/:projectId/views', '/myprojects'),
  },
  {
    path: '/MyProjects/Views/form/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/views/create`,
  },
  {
    path: '/MyProjects/Views/form',
    redirect: createProjectRedirect('/myprojects/:projectId/views/create', '/myprojects'),
  },
  {
    path: '/MyProjects/Project/form/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/edit`,
  },
  {
    path: '/MyProjects/Project/form',
    redirect: createProjectRedirect('/myprojects/:projectId/edit', '/myprojects'),
  },
  {
    path: '/MyProjects/Members/index/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/members`,
  },
  {
    path: '/MyProjects/Members/index',
    redirect: createProjectRedirect('/myprojects/:projectId/members', '/myprojects'),
  },
  {
    path: '/MyProjects/MemberGroups/index/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/members/groups`,
  },
  {
    path: '/MyProjects/MemberGroups/index',
    redirect: createProjectRedirect('/myprojects/:projectId/members/groups', '/myprojects'),
  },
  {
    path: '/MyProjects/Publishing/publishForm/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/publish`,
  },
  {
    path: '/MyProjects/Publishing/publishForm',
    redirect: createProjectRedirect('/myprojects/:projectId/publish', '/myprojects'),
  },
  {
    path: '/MyProjects/Publishing/pubPrefForm/project_id/:projectId',
    redirect: (to) => `/myprojects/${to.params.projectId}/publish/preferences`,
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
    path: '/Projects/ProjectOverview/project_id/:projectId',
    redirect: (to) => `/project/${to.params.projectId}/overview`,
  },
  {
    path: '/Projects/ProjectOverview',
    redirect: createProjectRedirect('/project/:projectId/overview', '/projects/journal_year'),
  },
  {
    path: '/Projects/matrices/project_id/:projectId',
    redirect: (to) => `/project/${to.params.projectId}/matrices`,
  },
  {
    path: '/Projects/matrices',
    redirect: createProjectRedirect('/project/:projectId/matrices', '/projects/journal_year'),
  },
  {
    path: '/Projects/media/project_id/:projectId',
    redirect: (to) => `/project/${to.params.projectId}/media`,
  },
  {
    path: '/Projects/media',
    redirect: createProjectRedirect('/project/:projectId/media', '/projects/journal_year'),
  },
  {
    path: '/Projects/Taxa/project_id/:projectId',
    redirect: (to) => `/project/${to.params.projectId}/taxa`,
  },
  {
    path: '/Projects/Taxa',
    redirect: createProjectRedirect('/project/:projectId/taxa', '/projects/journal_year'),
  },
  {
    path: '/Projects/Specimens/project_id/:projectId',
    redirect: (to) => `/project/${to.params.projectId}/specimens`,
  },
  {
    path: '/Projects/Specimens',
    redirect: createProjectRedirect('/project/:projectId/specimens', '/projects/journal_year'),
  },
  {
    path: '/Projects/MediaViews/project_id/:projectId',
    redirect: (to) => `/project/${to.params.projectId}/views`,
  },
  {
    path: '/Projects/MediaViews',
    redirect: createProjectRedirect('/project/:projectId/views', '/projects/journal_year'),
  },
  {
    path: '/Projects/ProjectDocuments/project_id/:projectId',
    redirect: (to) => `/project/${to.params.projectId}/documents`,
  },
  {
    path: '/Projects/ProjectDocuments',
    redirect: createProjectRedirect('/project/:projectId/documents', '/projects/journal_year'),
  },
  {
    path: '/Projects/BibliographicReferences/project_id/:projectId',
    redirect: (to) => `/project/${to.params.projectId}/bibliography`,
  },
  {
    path: '/Projects/BibliographicReferences',
    redirect: createProjectRedirect('/project/:projectId/bibliography', '/projects/journal_year'),
  },
  {
    path: '/Projects/FoliosList/project_id/:projectId',
    redirect: (to) => `/project/${to.params.projectId}/folios`,
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
]

