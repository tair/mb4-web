import {
  requireTaxonEditAccess,
  requireSpecimenEditAccess,
  requireMediaEditAccess,
  requireDocumentEditAccess,
} from '@/lib/route-guards.js'

export const MY_PROJECT_VIEWS = [
  {
    path: 'overview',
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
    path: 'matrices',
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
    path: 'matrices/create/choose',
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
    path: 'matrices/create',
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
    path: 'matrices/create-manual',
    name: 'MyProjectMatrixCreateManualView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/CreateManualView.vue'
      ),
  },
  {
    path: 'matrices/:matrixId(\\d+)/settings',
    name: 'MyProjectMatrixSettingsView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/matrices/SettingsView.vue'
      ),
  },
  {
    path: 'media',
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
    path: 'media/create',
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
    path: 'media/create/batch',
    name: 'MyProjectMediaCreateBatchView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/media/CreateBatchView.vue'
      ),
  },
  {
    path: 'media/curate',
    name: 'MyProjectMediaCurateView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/media/CurateView.vue'
      ),
  },
  {
    path: 'media/import/eol',
    name: 'MyProjectMediaEolImportView',
    meta: {
      itemName: 'media',
      importType: 'eol',
      breadcrumbs: [
        {
          label: 'Media',
          to: 'MyProjectMediaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/media/ImportView.vue'
      ),
  },
  {
    path: 'media/import/idigbio',
    name: 'MyProjectMediaiDigBioImportView',
    meta: {
      itemName: 'media',
      importType: 'idigbio',
      breadcrumbs: [
        {
          label: 'Media',
          to: 'MyProjectMediaView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/media/ImportView.vue'
      ),
  },
  {
    path: 'media/:mediaId(\\d+)',
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
        beforeEnter: requireMediaEditAccess,
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
    path: 'members',
    name: 'MyProjectMembersView',
    meta: {
      itemName: 'members',
      breadcrumbs: [
        {
          label: 'Project Members',
          to: 'MyProjectMembersView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/members/ListView.vue'
      ),
  },
  {
    path: 'members/groups',
    name: 'MyProjectMembersGroupsView',
    meta: {
      itemName: 'members',
      breadcrumbs: [
        {
          label: 'Project Members Groups',
          to: 'MyProjectMembersGroupsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/membersGroups/ListView.vue'
      ),
  },
  {
    path: 'members/:userId(\\d+)/edit',
    name: 'MyProjectMembersEditView',
    meta: {
      itemName: 'members',
      breadcrumbs: [
        {
          label: 'Project Members',
          to: 'MyProjectMembersView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/members/EditView.vue'
      ),
  },
  {
    path: 'members/groups/:groupId(\\d+)/edit',
    name: 'MyProjectMembersGroupsEditView',
    meta: {
      itemName: 'members',
      breadcrumbs: [
        {
          label: 'Project Members Groups',
          to: 'MyProjectMembersGroupsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/membersGroups/EditView.vue'
      ),
  },
  {
    path: 'members/groups/create',
    name: 'MyProjectMembersGroupsCreateView',
    meta: {
      itemName: 'members',
      breadcrumbs: [
        {
          label: 'Project Members Groups',
          to: 'MyProjectMembersGroupsView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/membersGroups/CreateView.vue'
      ),
  },
  {
    path: 'members/create',
    name: 'MyProjectMembersCreateView',
    meta: {
      itemName: 'members',
      breadcrumbs: [
        {
          label: 'Project Members',
          to: 'MyProjectMembersView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/members/CreateView.vue'
      ),
  },
  {
    path: 'views',
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
    path: 'views/create',
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
    path: 'views/:viewId(\\d+)/edit',
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
    path: 'folios',
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
    path: 'folios/create',
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
    path: 'folios/:folioId(\\d+)',
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
    path: 'specimens',
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
    path: 'specimens/create',
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
    path: 'specimens/:specimenId(\\d+)',
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
        beforeEnter: requireSpecimenEditAccess,
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
    path: 'specimens/upload',
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
    path: 'bibliography',
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
    path: 'bibliography/upload',
    name: 'MyProjectBibliographyUploadView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/bibliographies/UploadView.vue'
      ),
  },
  {
    path: 'bibliography/create',
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
    path: 'bibliography/:referenceId(\\d+)/edit',
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
    path: 'documents',
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
    path: 'documents/create',
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
    path: 'documents/:documentId(\\d+)/edit',
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
    beforeEnter: requireDocumentEditAccess,
  },
  {
    path: 'documents/folders/create',
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
    path: 'documents/folders/:folderId(\\d+)/edit',
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
    path: 'taxa',
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
    path: 'taxa/create',
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
    path: 'taxa/create/batch',
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
    path: 'taxa/upload',
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
    path: 'taxa/:taxonId(\\d+)/',
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
        beforeEnter: requireTaxonEditAccess,
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
    path: 'institutions/',
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
    path: 'institutions/create',
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
    path: 'duplication/request',
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
  {
    path: 'publish/partition',
    name: 'MyProjectPublishPartitionView',
    meta: {
      itemName: 'Publish Partition',
      breadcrumbs: [
        {
          label: 'Publish Partition',
          to: 'MyProjectPublishPartitionView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/publishPartition/PublishPartitionView.vue'
      ),
  },
  {
    path: 'publish/partition/:partitionId',
    name: 'MyProjectPublishPartitionSummaryView',
    meta: {
      itemName: 'Publish Partition',
      breadcrumbs: [
        {
          label: 'Publish Partition',
          to: 'MyProjectPublishPartitionView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/publishPartition/SummaryView.vue'
      ),
  },
]
