import MyProjectMediaView from '@/views/project/MyProjectMediaView.vue'
import MyProjectOverView from '@/views/project/MyProjectOverView.vue'
import MyProjectSpecimensView from '@/views/project/MyProjectSpecimensView.vue'

export const MY_PROJECT_VIEWS = [
  {
    path: '',
    name: 'MyProjectListView',
    component: () => import('@/views/project/home/ListView.vue'),
  },
  {
    path: 'create',
    name: 'MyProjectCreateView',
    component: () => import('@/views/project/home/CreateView.vue'),
  },
  {
    path: ':id/overview',
    name: 'MyProjectOverView',
    component: MyProjectOverView,
  },
  {
    path: ':id/matrices',
    name: 'MyProjectMatrixView',
    component: () => import('@/views/project/matrices/ListView.vue'),
  },
  {
    path: ':id/matrices/create/choose',
    name: 'MyProjectMatrixChooseView',
    component: () => import('@/views/project/matrices/ChooseView.vue'),
  },
  {
    path: ':id/matrices/create',
    name: 'MyProjectMatrixCreateView',
    component: () => import('@/views/project/matrices/CreateView.vue'),
  },
  {
    path: ':id/media',
    name: 'MyProjectMediaView',
    component: MyProjectMediaView,
  },
  {
    path: ':id/views',
    name: 'MyProjectMediaViewsView',
    component: () => import('@/views/project/views/ListView.vue'),
  },
  {
    path: ':id/views/create',
    name: 'MyProjectMediaViewsCreateView',
    component: () => import('@/views/project/views/CreateView.vue'),
  },
  {
    path: ':id/views/:viewId/edit',
    name: 'MyProjectMediaViewEditView',
    component: () => import('@/views/project/views/EditView.vue'),
  },
  {
    path: ':id/specimens',
    name: 'MyProjectSpecimensView',
    component: MyProjectSpecimensView,
  },
  {
    path: ':id/bibliography',
    name: 'MyProjectBibliographyListView',
    component: () => import('@/views/project/bibliographies/ListView.vue'),
  },
  {
    path: ':id/bibliography/create',
    name: 'MyProjectBibliographyCreateView',
    component: () => import('@/views/project/bibliographies/CreateView.vue'),
  },
  {
    path: ':id/bibliography/:referenceId/edit',
    name: 'MyProjectBibliographyEditView',
    component: () => import('@/views/project/bibliographies/EditView.vue'),
  },
  {
    path: ':id/documents',
    name: 'MyProjectDocumentsView',
    component: () => import('@/views/project/documents/ListView.vue'),
  },
  {
    path: ':id/documents/create',
    name: 'MyProjectDocumentCreateView',
    component: () => import('@/views/project/documents/CreateView.vue'),
  },
  {
    path: ':id/documents/:documentId/edit',
    name: 'MyProjectDocumentEditView',
    component: () => import('@/views/project/documents/EditView.vue'),
  },
  {
    path: ':id/documents/folders/create',
    name: 'MyProjectDocumentFolderCreateView',
    component: () => import('@/views/project/documents/FolderCreateView.vue'),
  },
  {
    path: ':id/documents/folders/:folderId/edit',
    name: 'MyProjectDocumentFolderEditView',
    component: () => import('@/views/project/documents/FolderEditView.vue'),
  },
  {
    path: ':id/taxa',
    name: 'MyProjectTaxaView',
    component: () => import('@/views/project/taxa/ListView.vue'),
  },
  {
    path: ':id/taxa/create',
    name: 'MyProjectTaxaCreateView',
    component: () => import('@/views/project/taxa/CreateView.vue'),
  },
  {
    path: ':id/taxa/create/batch',
    name: 'MyProjectTaxaBatchCreateView',
    component: () => import('@/views/project/taxa/BatchCreateView.vue'),
  },
  {
    path: ':id/taxa/upload',
    name: 'MyProjectTaxaUploadView',
    component: () => import('@/views/project/taxa/UploadView.vue'),
  },
  {
    path: ':id/taxa/:taxonId/edit',
    name: 'MyProjectTaxaEditView',
    component: () => import('@/views/project/taxa/EditView.vue'),
  },
]
