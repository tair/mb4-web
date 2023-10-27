import MyProjectHomeView from '@/views/project/MyProjectHomeView.vue'
import MyProjectMatrixChooseView from '@/views/project/MyProjectMatrixChooseView.vue'
import MyProjectMatrixCreateView from '@/views/project/MyProjectMatrixCreateView.vue'
import MyProjectMatrixView from '@/views/project/MyProjectMatrixView.vue'
import MyProjectMediaView from '@/views/project/MyProjectMediaView.vue'
import MyProjectMediaViewsView from '@/views/project/MyProjectMediaViewsView.vue'
import MyProjectOverView from '@/views/project/MyProjectOverView.vue'
import MyProjectSpecimensView from '@/views/project/MyProjectSpecimensView.vue'
import MyProjectTaxaView from '@/views/project/MyProjectTaxaView.vue'

export const MY_PROJECT_VIEWS = [
  {
    path: '',
    name: 'MyProjectHomeView',
    component: MyProjectHomeView,
  },
  {
    path: ':id',
    component: MyProjectOverView,
  },
  {
    path: ':id/overview',
    name: 'MyProjectOverView',
    component: MyProjectOverView,
  },
  {
    path: ':id/matrices',
    name: 'MyProjectMatrixView',
    component: MyProjectMatrixView,
  },
  {
    path: ':id/matrices/create/choose',
    name: 'MyProjectMatrixChooseView',
    component: MyProjectMatrixChooseView,
  },
  {
    path: ':id/matrices/create',
    name: 'MyProjectMatrixCreateView',
    component: MyProjectMatrixCreateView,
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
]
