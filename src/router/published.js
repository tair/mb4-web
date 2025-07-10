import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'

const PUBLISHED_PROJECT_VIEWS = [
  {
    path: 'pub_date',
    name: 'ProjectPubDateView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/HomeView.vue'
      ),
  },
  {
    path: 'prj_no',
    name: 'ProjectNoView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/HomeView.vue'
      ),
  },
  {
    path: 'journal_year',
    name: 'ProjectJornalYearView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/HomeView.vue'
      ),
  },
  {
    path: 'title',
    name: 'ProjectTitleView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/TitleView.vue'
      ),
  },
  {
    path: 'popular',
    name: 'ProjectPopularView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/PopularView.vue'
      ),
  },
  {
    path: 'author',
    name: 'ProjectAuthorView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/AuthorView.vue'
      ),
  },
  {
    path: 'journal',
    name: 'ProjectJournalView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/JournalView.vue'
      ),
  },
  {
    path: 'institution',
    name: 'ProjectInstitutionView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/InstitutionView.vue'
      ),
  },
]

const PUBLISHED_PROJECT_DETAIL_VIEWS = [
  {
    path: 'overview',
    name: 'ProjectOverviewView',
    meta: { itemName: 'overview' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/OverviewView.vue'
      ),
  },
  {
    path: 'matrices',
    name: 'ProjectMatrixView',
    meta: { itemName: 'matrices' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/MatrixView.vue'
      ),
  },
  {
    path: 'media',
    name: 'ProjectMediaView',
    meta: { itemName: 'media' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/MediaView.vue'
      ),
  },
  {
    path: 'folios',
    name: 'ProjectFoliosView',
    meta: { itemName: 'folios' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/FoliosView.vue'
      ),
  },
  {
    path: 'folios/:folioId',
    name: 'ProjectFolioDetailView',
    meta: { itemName: 'folioDetail' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/FolioDetailView.vue'
      ),
  },
  {
    path: 'views',
    name: 'ProjectMediaViewsView',
    meta: { itemName: 'media_views' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/MediaViewsView.vue'
      ),
  },
  {
    path: 'specimens',
    name: 'ProjectSpecimenView',
    meta: { itemName: 'specimens' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/SpecimenView.vue'
      ),
  },
  {
    path: 'taxa',
    name: 'ProjectTaxaView',
    meta: { itemName: 'taxa' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/TaxaView.vue'
      ),
  },
  {
    path: 'bibliography',
    name: 'ProjectBibliographyView',
    meta: { itemName: 'bibliography' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/BibliographyView.vue'
      ),
  },
  {
    path: 'documents',
    name: 'ProjectDocumentView',
    meta: { itemName: 'documents' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/DocumentView.vue'
      ),
  },
  {
    path: 'download',
    name: 'ProjectDownloadView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/DownloadView.vue'
      ),
    beforeEnter: (to, from) => {
      const projectDetailStore = usePublicProjectDetailsStore()
      const id = to.params.id
      if (!projectDetailStore.isDownloadValid(id)) {
        return { name: 'ProjectOverviewView', params: { id } }
      }
    },
  },
]

export { PUBLISHED_PROJECT_VIEWS, PUBLISHED_PROJECT_DETAIL_VIEWS }
