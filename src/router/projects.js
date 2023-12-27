import MyProjectMediaView from '@/views/project/MyProjectMediaView.vue'

export const MY_PROJECT_VIEWS = [
  {
    path: '',
    name: 'MyProjectListView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/home/ListView.vue'
      ),
  },
  {
    path: 'create',
    name: 'MyProjectCreateView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/home/CreateView.vue'
      ),
  },
  {
    path: ':id/overview',
    name: 'MyProjectOverviewView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/overview/OverviewView.vue'
      ),
  },
  {
    path: ':id/matrices',
    name: 'MyProjectMatrixView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/ListView.vue'
      ),
  },
  {
    path: ':id/matrices/create/choose',
    name: 'MyProjectMatrixChooseView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/ChooseView.vue'
      ),
  },
  {
    path: ':id/matrices/create',
    name: 'MyProjectMatrixCreateView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/CreateView.vue'
      ),
  },
  {
    path: ':id/media',
    name: 'MyProjectMediaView',
    component: MyProjectMediaView,
  },
  {
    path: ':id/views',
    name: 'MyProjectMediaViewsView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/views/ListView.vue'
      ),
  },
  {
    path: ':id/views/create',
    name: 'MyProjectMediaViewsCreateView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/views/CreateView.vue'
      ),
  },
  {
    path: ':id/views/:viewId/edit',
    name: 'MyProjectMediaViewEditView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/views/EditView.vue'
      ),
  },
  {
    path: ':id/specimens',
    name: 'MyProjectSpecimensListView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/ListView.vue'
      ),
  },
  {
    path: ':id/specimens/create',
    name: 'MyProjectSpecimensCreateView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/CreateView.vue'
      ),
  },
  {
    path: ':id/specimens/:specimenId/edit',
    name: 'MyProjectSpecimensEditView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/EditView.vue'
      ),
  },
  {
    path: ':id/specimens/upload',
    name: 'MyProjectSpecimensUploadView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/specimens/UploadView.vue'
      ),
  },
  {
    path: ':id/bibliography',
    name: 'MyProjectBibliographyListView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/ListView.vue'
      ),
  },
  {
    path: ':id/bibliography/create',
    name: 'MyProjectBibliographyCreateView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/CreateView.vue'
      ),
  },
  {
    path: ':id/bibliography/:referenceId/edit',
    name: 'MyProjectBibliographyEditView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/EditView.vue'
      ),
  },
  {
    path: ':id/documents',
    name: 'MyProjectDocumentsView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/ListView.vue'
      ),
  },
  {
    path: ':id/documents/create',
    name: 'MyProjectDocumentCreateView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/CreateView.vue'
      ),
  },
  {
    path: ':id/documents/:documentId/edit',
    name: 'MyProjectDocumentEditView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/EditView.vue'
      ),
  },
  {
    path: ':id/documents/folders/create',
    name: 'MyProjectDocumentFolderCreateView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/FolderCreateView.vue'
      ),
  },
  {
    path: ':id/documents/folders/:folderId/edit',
    name: 'MyProjectDocumentFolderEditView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/documents/FolderEditView.vue'
      ),
  },
  {
    path: ':id/taxa',
    name: 'MyProjectTaxaView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/ListView.vue'
      ),
  },
  {
    path: ':id/taxa/create',
    name: 'MyProjectTaxaCreateView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/CreateView.vue'
      ),
  },
  {
    path: ':id/taxa/create/batch',
    name: 'MyProjectTaxaBatchCreateView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/BatchCreateView.vue'
      ),
  },
  {
    path: ':id/taxa/upload',
    name: 'MyProjectTaxaUploadView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/UploadView.vue'
      ),
  },
  {
    path: ':id/taxa/:taxonId/edit',
    name: 'MyProjectTaxaEditView',
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/EditView.vue'
      ),
  },
]
