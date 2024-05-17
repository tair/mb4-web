export const MY_PROJECT_VIEWS = [
  {
    path: ':id/overview',
    name: 'MyProjectOverviewView',
    meta: {
      itemName: 'overview',
      breadcrumbs: [
        {
          label: 'Project Overview',
          to: 'MyProjectOverviewView',
        },
      ],
    },
    components: {
      default: () =>
        import(
          /* webpackChunkName: "unpublished" */ '@/views/project/overview/OverviewView.vue'
        ),
      ContentFooter: () =>
        import(
          /* webpackChunkName: "unpublished" */ '@/views/project/overview/OverviewStatsView.vue'
        ),
    },
  },
  {
    path: ':id/matrices',
    name: 'MyProjectMatrixView',
    meta: {
      itemName: 'matrices',
      breadcrumbs: [
        {
          label: 'Matrices',
          to: 'MyProjectMatrixView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/ListView.vue'
      ),
  },
  {
    path: ':id/matrices/create/choose',
    name: 'MyProjectMatrixChooseView',
    meta: {
      itemName: 'matrices',
      breadcrumbs: [
        {
          label: 'Matrices',
          to: 'MyProjectMatrixView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/ChooseView.vue'
      ),
  },
  {
    path: ':id/matrices/create',
    name: 'MyProjectMatrixCreateView',
    meta: {
      itemName: 'matrices',
      breadcrumbs: [
        {
          label: 'Matrices',
          to: 'MyProjectMatrixView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/CreateView.vue'
      ),
  },
  {
    path: ':id/media',
    name: 'MyProjectMediaView',
    meta: {
      itemName: 'media',
      breadcrumbs: [
        {
          label: 'Media',
          to: 'MyProjectMediaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/media/ListView.vue'
      ),
  },
  {
    path: ':id/media/create',
    name: 'MyProjectMediaCreateView',
    meta: {
      itemName: 'media',
      breadcrumbs: [
        {
          label: 'Media',
          to: 'MyProjectMediaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/media/CreateView.vue'
      ),
  },
  {
    path: ':id/media/:mediaId',
    name: 'MyProjectMediaBaseView',
    meta: {
      itemName: 'media',
      breadcrumbs: [
        {
          label: 'Media',
          to: 'MyProjectMediaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/media/BaseView.vue'
      ),
    children: [
      {
        path: 'edit',
        name: 'MyProjectMediaEditView',
        component: () =>
          import(
            /* webpackChunkName: "unpublished" */ '@/views/project/media/EditView.vue'
          ),
      },
      {
        path: 'citations',
        name: 'MyProjectMediaCitationsView',
        component: () =>
          import(
            /* webpackChunkName: "unpublished" */ '@/views/project/media/CitationsView.vue'
          ),
      },
    ],
  },
  {
    path: ':id/views',
    name: 'MyProjectMediaViewsView',
    meta: {
      itemName: 'media_views',
      breadcrumbs: [
        {
          label: 'Media Views',
          to: 'MyProjectMediaViewsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/views/ListView.vue'
      ),
  },
  {
    path: ':id/views/create',
    name: 'MyProjectMediaViewsCreateView',
    meta: {
      itemName: 'media_views',
      breadcrumbs: [
        {
          label: 'Media Views',
          to: 'MyProjectMediaViewsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/views/CreateView.vue'
      ),
  },
  {
    path: ':id/views/:viewId/edit',
    name: 'MyProjectMediaViewEditView',
    meta: {
      itemName: 'media_views',
      breadcrumbs: [
        {
          label: 'Media Views',
          to: 'MyProjectMediaViewsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/views/EditView.vue'
      ),
  },
  {
    path: ':id/folios',
    name: 'MyProjectFoliosView',
    meta: {
      itemName: 'folios',
      breadcrumbs: [
        {
          label: 'Folios',
          to: 'MyProjectFoliosView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/folios/ListView.vue'
      ),
  },
  {
    path: ':id/folios/create',
    name: 'MyProjectFoliosCreateView',
    meta: {
      itemName: 'folios',
      breadcrumbs: [
        {
          label: 'Folios',
          to: 'MyProjectFoliosView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/folios/CreateView.vue'
      ),
  },
  {
    path: ':id/folios/:folioId',
    name: 'MyProjectFoliosBaseView',
    meta: {
      itemName: 'folios',
      breadcrumbs: [
        {
          label: 'Folios',
          to: 'MyProjectFoliosView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/folios/BaseView.vue'
      ),
    children: [
      {
        path: 'edit',
        name: 'MyProjectFoliosEditView',
        component: () =>
          import(
            /* webpackChunkName: "unpublished" */ '@/views/project/folios/EditView.vue'
          ),
      },
      {
        path: 'media',
        name: 'MyProjectFoliosMediaView',
        component: () =>
          import(
            /* webpackChunkName: "unpublished" */ '@/views/project/folios/MediaView.vue'
          ),
      },
    ],
  },
  {
    path: ':id/specimens',
    name: 'MyProjectSpecimensListView',
    meta: {
      itemName: 'specimens',
      breadcrumbs: [
        {
          label: 'Specimens',
          to: 'MyProjectSpecimensListView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/ListView.vue'
      ),
  },
  {
    path: ':id/specimens/create',
    name: 'MyProjectSpecimensCreateView',
    meta: {
      itemName: 'specimens',
      breadcrumbs: [
        {
          label: 'Specimens',
          to: 'MyProjectSpecimensListView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/CreateView.vue'
      ),
  },
  {
    path: ':id/specimens/:specimenId',
    name: 'MyProjectSpecimensBaseView',
    meta: {
      itemName: 'specimens',
      breadcrumbs: [
        {
          label: 'Specimens',
          to: 'MyProjectSpecimensListView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/BaseView.vue'
      ),
    children: [
      {
        path: 'edit',
        name: 'MyProjectSpecimensEditView',
        component: () =>
          import(
            /* webpackChunkName: "unpublished" */ '@/views/project/specimens/EditView.vue'
          ),
      },
      {
        path: 'citations',
        name: 'MyProjectSpecimenCitationsView',
        component: () =>
          import(
            /* webpackChunkName: "unpublished" */ '@/views/project/specimens/CitationsView.vue'
          ),
      },
    ],
  },
  {
    path: ':id/specimens/upload',
    name: 'MyProjectSpecimensUploadView',
    meta: {
      itemName: 'specimens',
      breadcrumbs: [
        {
          label: 'Specimens',
          to: 'MyProjectSpecimensListView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/UploadView.vue'
      ),
  },
  {
    path: ':id/bibliography',
    name: 'MyProjectBibliographyListView',
    meta: {
      itemName: 'bibliography',
      breadcrumbs: [
        {
          label: 'Bibliographies',
          to: 'MyProjectBibliographyListView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/ListView.vue'
      ),
  },
  {
    path: ':id/bibliography/create',
    name: 'MyProjectBibliographyCreateView',
    meta: {
      itemName: 'bibliography',
      breadcrumbs: [
        {
          label: 'Bibliographies',
          to: 'MyProjectBibliographyListView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/CreateView.vue'
      ),
  },
  {
    path: ':id/bibliography/:referenceId/edit',
    name: 'MyProjectBibliographyEditView',
    meta: {
      itemName: 'bibliography',
      breadcrumbs: [
        {
          label: 'Bibliographies',
          to: 'MyProjectBibliographyListView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/EditView.vue'
      ),
  },
  {
    path: ':id/documents',
    name: 'MyProjectDocumentsView',
    meta: {
      itemName: 'documents',
      breadcrumbs: [
        {
          label: 'Documents',
          to: 'MyProjectDocumentsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/ListView.vue'
      ),
  },
  {
    path: ':id/documents/create',
    name: 'MyProjectDocumentCreateView',
    meta: {
      itemName: 'documents',
      breadcrumbs: [
        {
          label: 'Documents',
          to: 'MyProjectDocumentsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/CreateView.vue'
      ),
  },
  {
    path: ':id/documents/:documentId/edit',
    name: 'MyProjectDocumentEditView',
    meta: {
      itemName: 'documents',
      breadcrumbs: [
        {
          label: 'Documents',
          to: 'MyProjectDocumentsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/EditView.vue'
      ),
  },
  {
    path: ':id/documents/folders/create',
    name: 'MyProjectDocumentFolderCreateView',
    meta: {
      itemName: 'documents',
      breadcrumbs: [
        {
          label: 'Documents',
          to: 'MyProjectDocumentsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/FolderCreateView.vue'
      ),
  },
  {
    path: ':id/documents/folders/:folderId/edit',
    name: 'MyProjectDocumentFolderEditView',
    meta: {
      itemName: 'documents',
      breadcrumbs: [
        {
          label: 'Documents',
          to: 'MyProjectDocumentsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/FolderEditView.vue'
      ),
  },
  {
    path: ':id/taxa',
    name: 'MyProjectTaxaView',
    meta: {
      itemName: 'taxa',
      breadcrumbs: [
        {
          label: 'Taxa',
          to: 'MyProjectTaxaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/ListView.vue'
      ),
  },
  {
    path: ':id/taxa/create',
    name: 'MyProjectTaxaCreateView',
    meta: {
      itemName: 'taxa',
      breadcrumbs: [
        {
          label: 'Taxa',
          to: 'MyProjectTaxaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/CreateView.vue'
      ),
  },
  {
    path: ':id/taxa/create/batch',
    name: 'MyProjectTaxaBatchCreateView',
    meta: {
      itemName: 'taxa',
      breadcrumbs: [
        {
          label: 'Taxa',
          to: 'MyProjectTaxaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/BatchCreateView.vue'
      ),
  },
  {
    path: ':id/taxa/upload',
    name: 'MyProjectTaxaUploadView',
    meta: {
      itemName: 'taxa',
      breadcrumbs: [
        {
          label: 'Taxa',
          to: 'MyProjectTaxaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/UploadView.vue'
      ),
  },
  {
    path: ':id/taxa/:taxonId/',
    name: 'MyProjectTaxaBaseEditView',
    meta: {
      itemName: 'taxa',
      breadcrumbs: [
        {
          label: 'Taxa',
          to: 'MyProjectTaxaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/BaseView.vue'
      ),
    children: [
      {
        path: 'edit',
        name: 'MyProjectTaxaEditView',
        component: () =>
          import(
            /* webpackChunkName: "unpublished" */ '@/views/project/taxa/EditView.vue'
          ),
      },
      {
        path: 'citations',
        name: 'MyProjectTaxaCitationsView',
        component: () =>
          import(
            /* webpackChunkName: "unpublished" */ '@/views/project/taxa/CitationsView.vue'
          ),
      },
    ],
  },
  {
    path: ':id/institutions/',
    name: 'MyProjectInstitutionsView',
    meta: {
      itemName: 'institutions',
      breadcrumbs: [
        {
          label: 'institutions',
          to: 'MyProjectInstitutionsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/institutions/ListView.vue'
      ),
  },
  {
    path: ':id/institutions/create',
    name: 'MyProjectInstitutionsCreateView',
    meta: {
      itemName: 'institutions',
      breadcrumbs: [
        {
          label: 'institutions',
          to: 'MyProjectInstitutionsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/institutions/CreateView.vue'
      ),
  },
  {
    path: ':id/duplication/request',
    name: 'MyProjectDuplicationRequestView',
    meta: {
      itemName: 'duplication',
      breadcrumbs: [
        {
          label: 'duplication',
          to: 'MyProjectDuplicationRequestView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/duplication/RequestView.vue'
      ),
  },
]
