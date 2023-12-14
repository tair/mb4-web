import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'

export const PUBLISHED_PROJECT_VIEWS = [
  {
    path: 'pub_date',
    name: 'ProjectPubDateView',
    component: () => import('@/views/project/published/HomeView.vue'),
  },
  {
    path: 'prj_no',
    name: 'ProjectNoView',
    component: () => import('@/views/project/published/HomeView.vue'),
  },
  {
    path: 'journal_year',
    name: 'ProjectJornalYearView',
    component: () => import('@/views/project/published/JournalView.vue'),
  },
  {
    path: 'title',
    name: 'ProjectTitleView',
    component: () => import('@/views/project/published/TitleView.vue'),
  },
  {
    path: 'popular',
    name: 'ProjectPopularView',
    component: () => import('@/views/project/published/PopularView.vue'),
  },
  {
    path: 'author',
    name: 'ProjectAuthorView',
    component: () => import('@/views/project/published/AuthorView.vue'),
  },
  {
    path: 'journal',
    name: 'ProjectJournalView',
    component: () => import('@/views/project/published/JournalView.vue'),
  },
  {
    path: 'institution',
    name: 'ProjectInstitutionView',
    component: () => import('@/views/project/published/InstitutionView.vue'),
  },
  {
    path: ':id/overview',
    name: 'ProjectOverviewView',
    component: () => import('@/views/project/published/OverviewView.vue'),
  },
  {
    path: ':id/matrices',
    name: 'ProjectMatrixView',
    component: () => import('@/views/project/published/MatrixView.vue'),
  },
  {
    path: ':id/media',
    name: 'ProjectMediaView',
    component: () => import('@/views/project/published/MediaView.vue'),
  },
  {
    path: ':id/views',
    name: 'ProjectMediaViewsView',
    component: () => import('@/views/project/published/MediaViewsView.vue'),
  },
  {
    path: ':id/specimens',
    name: 'ProjectSpecimenView',
    component: () => import('@/views/project/published/SpecimenView.vue'),
  },
  {
    path: ':id/taxa',
    name: 'ProjectTaxaView',
    component: () => import('@/views/project/published/TaxaView.vue'),
  },
  {
    path: ':id/bibliography',
    name: 'ProjectBibliographyView',
    component: () => import('@/views/project/published/BibliographyView.vue'),
  },
  {
    path: ':id/documents',
    name: 'ProjectDocumentView',
    component: () => import('@/views/project/published/DocumentView.vue'),
  },
  {
    path: ':id/download',
    name: 'ProjectDownloadView',
    component: () => import('@/views/project/published/DocumentView.vue'),
    beforeEnter: (to, from) => {
      const projectDetailStore = usePublicProjectDetailsStore()
      const id = to.params.id
      if (!projectDetailStore.isDownloadValid(id)) {
        return { name: 'ProjectOverviewView', params: { id } }
      }
    },
  },
]
