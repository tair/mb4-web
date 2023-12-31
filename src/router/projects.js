export const MY_PROJECT_VIEWS = [
  {
    path: 'create',
    name: 'MyProjectCreateView',
    meta: { itemName: 'overview' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/home/CreateView.vue'
      ),
  },
  {
    path: ':id/overview',
    name: 'MyProjectOverviewView',
    meta: { itemName: 'overview' },
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
    meta: { itemName: 'matrices' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/ListView.vue'
      ),
  },
  {
    path: ':id/matrices/create/choose',
    name: 'MyProjectMatrixChooseView',
    meta: { itemName: 'matrices' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/ChooseView.vue'
      ),
  },
  {
    path: ':id/matrices/create',
    name: 'MyProjectMatrixCreateView',
    meta: { itemName: 'matrices' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/CreateView.vue'
      ),
  },
  {
    path: ':id/media',
    name: 'MyProjectMediaView',
    meta: { itemName: 'media' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/media/ListView.vue'
      ),
  },
  {
    path: ':id/views',
    name: 'MyProjectMediaViewsView',
    meta: { itemName: 'media_views' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/views/ListView.vue'
      ),
  },
  {
    path: ':id/views/create',
    name: 'MyProjectMediaViewsCreateView',
    meta: { itemName: 'media_views' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/views/CreateView.vue'
      ),
  },
  {
    path: ':id/views/:viewId/edit',
    name: 'MyProjectMediaViewEditView',
    meta: { itemName: 'media_views' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/views/EditView.vue'
      ),
  },
  {
    path: ':id/folios',
    name: 'MyProjectFoliosView',
    meta: { itemName: 'folios' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/folios/ListView.vue'
      ),
  },
  {
    path: ':id/specimens',
    name: 'MyProjectSpecimensListView',
    meta: { itemName: 'specimens' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/ListView.vue'
      ),
  },
  {
    path: ':id/specimens/create',
    name: 'MyProjectSpecimensCreateView',
    meta: { itemName: 'specimens' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/CreateView.vue'
      ),
  },
  {
    path: ':id/specimens/:specimenId/edit',
    name: 'MyProjectSpecimensEditView',
    meta: { itemName: 'specimens' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/EditView.vue'
      ),
  },
  {
    path: ':id/specimens/upload',
    name: 'MyProjectSpecimensUploadView',
    meta: { itemName: 'specimens' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/UploadView.vue'
      ),
  },
  {
    path: ':id/bibliography',
    name: 'MyProjectBibliographyListView',
    meta: { itemName: 'bibliography' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/ListView.vue'
      ),
  },
  {
    path: ':id/bibliography/create',
    name: 'MyProjectBibliographyCreateView',
    meta: { itemName: 'bibliography' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/CreateView.vue'
      ),
  },
  {
    path: ':id/bibliography/:referenceId/edit',
    name: 'MyProjectBibliographyEditView',
    meta: { itemName: 'bibliography' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/EditView.vue'
      ),
  },
  {
    path: ':id/documents',
    name: 'MyProjectDocumentsView',
    meta: { itemName: 'documents' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/ListView.vue'
      ),
  },
  {
    path: ':id/documents/create',
    name: 'MyProjectDocumentCreateView',
    meta: { itemName: 'documents' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/CreateView.vue'
      ),
  },
  {
    path: ':id/documents/:documentId/edit',
    name: 'MyProjectDocumentEditView',
    meta: { itemName: 'documents' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/EditView.vue'
      ),
  },
  {
    path: ':id/documents/folders/create',
    name: 'MyProjectDocumentFolderCreateView',
    meta: { itemName: 'documents' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/FolderCreateView.vue'
      ),
  },
  {
    path: ':id/documents/folders/:folderId/edit',
    name: 'MyProjectDocumentFolderEditView',
    meta: { itemName: 'documents' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/FolderEditView.vue'
      ),
  },
  {
    path: ':id/taxa',
    name: 'MyProjectTaxaView',
    meta: { itemName: 'taxa' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/ListView.vue'
      ),
  },
  {
    path: ':id/taxa/create',
    name: 'MyProjectTaxaCreateView',
    meta: { itemName: 'taxa' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/CreateView.vue'
      ),
  },
  {
    path: ':id/taxa/create/batch',
    name: 'MyProjectTaxaBatchCreateView',
    meta: { itemName: 'taxa' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/BatchCreateView.vue'
      ),
  },
  {
    path: ':id/taxa/upload',
    name: 'MyProjectTaxaUploadView',
    meta: { itemName: 'taxa' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/UploadView.vue'
      ),
  },
  {
    path: ':id/taxa/:taxonId/edit',
    name: 'MyProjectTaxaEditView',
    meta: { itemName: 'taxa' },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/EditView.vue'
      ),
  },
]
