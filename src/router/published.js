import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'

export const PUBLISHED_PROJECT_VIEWS = [
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
        /* webpackChunkName: "published" */ '@/views/project/published/JournalView.vue'
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
  {
    path: ':id/overview',
    name: 'ProjectOverviewView',
    meta: { itemName: 'overview' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/OverviewView.vue'
      ),
  },
  {
    path: ':id/matrices',
    name: 'ProjectMatrixView',
    meta: { itemName: 'matrices' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/MatrixView.vue'
      ),
  },
  {
    path: ':id/media',
    name: 'ProjectMediaView',
    meta: { itemName: 'media' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/MediaView.vue'
      ),
  },
  {
    path: ':id/folios',
    name: 'ProjectFoliosView',
    meta: { itemName: 'folios' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/FoliosView.vue'
      ),
  },
  {
    path: ':id/views',
    name: 'ProjectMediaViewsView',
    meta: { itemName: 'media_views' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/MediaViewsView.vue'
      ),
  },
  {
    path: ':id/specimens',
    name: 'ProjectSpecimenView',
    meta: { itemName: 'specimens' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/SpecimenView.vue'
      ),
  },
  {
    path: ':id/taxa',
    name: 'ProjectTaxaView',
    meta: { itemName: 'taxa' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/TaxaView.vue'
      ),
  },
  {
    path: ':id/bibliography',
    name: 'ProjectBibliographyView',
    meta: { itemName: 'bibliography' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/BibliographyView.vue'
      ),
  },
  {
    path: ':id/documents',
    name: 'ProjectDocumentView',
    meta: { itemName: 'documents' },
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/DocumentView.vue'
      ),
  },
  {
    path: ':id/download',
    name: 'ProjectDownloadView',
    component: () =>
      import(
        /* webpackChunkName: "published" */ '@/views/project/published/DocumentView.vue'
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
