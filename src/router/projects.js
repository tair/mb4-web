import MyProjectBibliographyView from '@/views/project/MyProjectBibliographyView.vue'
import MyProjectHomeView from '@/views/project/MyProjectHomeView.vue'
import MyProjectMatrixChooseView from '@/views/project/MyProjectMatrixChooseView.vue'
import MyProjectMatrixCreateView from '@/views/project/MyProjectMatrixCreateView.vue'
import MyProjectMatrixView from '@/views/project/MyProjectMatrixView.vue'
import MyProjectMediaView from '@/views/project/MyProjectMediaView.vue'
import MyProjectMediaViewsView from '@/views/project/MyProjectMediaViewsView.vue'
import MyProjectSpecimensView from '@/views/project/MyProjectSpecimensView.vue'
import MyProjectTaxaView from '@/views/project/MyProjectTaxaView.vue'
import MyProjectDocumentsView from '@/views/project/MyProjectDocumentsView.vue'

export const MY_PROJECT_VIEWS = [
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
    name: 'MyProjectBibliographyView',
    component: MyProjectBibliographyView,
  },
  {
    path: ':id/documents',
    name: 'MyProjectDocumentsView',
    component: MyProjectDocumentsView,
  },
]
