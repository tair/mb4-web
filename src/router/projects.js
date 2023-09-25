import MyProjectBibliographyView from '@/views/project/MyProjectBibliographyView.vue'
import MyProjectDocumentCreateView from '@/views/project/MyProjectDocumentCreateView.vue'
import MyProjectDocumentEditView from '@/views/project/MyProjectDocumentEditView.vue'
import MyProjectDocumentFolderCreateView from '@/views/project/MyProjectDocumentFolderCreateView.vue'
import MyProjectDocumentFolderEditView from '@/views/project/MyProjectDocumentFolderEditView.vue'
import MyProjectDocumentsView from '@/views/project/MyProjectDocumentsView.vue'
import MyProjectHomeView from '@/views/project/MyProjectHomeView.vue'
import MyProjectMatrixChooseView from '@/views/project/MyProjectMatrixChooseView.vue'
import MyProjectMatrixCreateView from '@/views/project/MyProjectMatrixCreateView.vue'
import MyProjectMatrixEditView from '@/views/project/MyProjectMatrixEditView.vue'
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
    path: ':id/matrices/:matrixId/edit',
    name: 'MyProjectMatrixEditView',
    component: MyProjectMatrixEditView,
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
  {
    path: ':id/documents/create',
    name: 'MyProjectDocumentCreateView',
    component: MyProjectDocumentCreateView,
  },
  {
    path: ':id/documents/:documentId/edit',
    name: 'MyProjectDocumentEditView',
    component: MyProjectDocumentEditView,
  },
  {
    path: ':id/documents/folders/create',
    name: 'MyProjectDocumentFolderCreateView',
    component: MyProjectDocumentFolderCreateView,
  },
  {
    path: ':id/documents/folders/:folderId/edit',
    name: 'MyProjectDocumentFolderEditView',
    component: MyProjectDocumentFolderEditView,
  },
]
