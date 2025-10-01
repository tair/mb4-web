import {
  requireTaxonEditAccess,
  requireSpecimenEditAccess,
  requireMediaEditAccess,
  requireDocumentEditAccess,
  requireDocumentFolderEditAccess,
  requireMediaViewEditAccess,
  requireFolioEditAccess,
  requireMatrixEditAccess,
  createEntityCreateGuard,
  requireBibliographyEditAccess,
  requireProjectAdmin,
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
    beforeEnter: createEntityCreateGuard('matrix'),
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
    beforeEnter: createEntityCreateGuard('matrix'),
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
    beforeEnter: createEntityCreateGuard('matrix'),
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
    beforeEnter: createEntityCreateGuard('media'),
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
    beforeEnter: createEntityCreateGuard('media'),
  },
  {
    path: 'media/create/3d',
    name: 'MyProjectMediaCreate3DView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/media/Create3DView.vue'
      ),
    beforeEnter: createEntityCreateGuard('media'),
  },
  {
    path: 'media/create/video',
    name: 'MyProjectMediaCreateVideoView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/media/CreateVideoView.vue'
      ),
    beforeEnter: createEntityCreateGuard('media'),
  },
  {
    path: 'media/create/stacks',
    name: 'MyProjectMediaCreateStacksView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/media/CreateStacksView.vue'
      ),
    beforeEnter: createEntityCreateGuard('media'),
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
    beforeEnter: createEntityCreateGuard('media'),
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
    beforeEnter: createEntityCreateGuard('media'),
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
    beforeEnter: createEntityCreateGuard('media'),
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
    beforeEnter: requireProjectAdmin,
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
    beforeEnter: requireProjectAdmin,
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
    beforeEnter: requireProjectAdmin,
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
    beforeEnter: requireProjectAdmin,
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
    beforeEnter: requireProjectAdmin,
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
    beforeEnter: requireProjectAdmin,
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
    beforeEnter: createEntityCreateGuard('media_view'),
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
    beforeEnter: requireMediaViewEditAccess,
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
    beforeEnter: createEntityCreateGuard('folio'),
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
        beforeEnter: requireFolioEditAccess,
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
    beforeEnter: createEntityCreateGuard('specimen'),
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
    beforeEnter: createEntityCreateGuard('specimen'),
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
    beforeEnter: createEntityCreateGuard('bibliographic_reference'),
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
    beforeEnter: createEntityCreateGuard('bibliographic_reference'),
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
    beforeEnter: requireBibliographyEditAccess,
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
    beforeEnter: createEntityCreateGuard('project_document'),
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
    beforeEnter: createEntityCreateGuard('project_document_folder'),
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
    beforeEnter: requireDocumentFolderEditAccess,
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
    beforeEnter: createEntityCreateGuard('taxon'),
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
    beforeEnter: createEntityCreateGuard('taxon'),
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
    beforeEnter: createEntityCreateGuard('taxon'),
  },
  {
    path: 'taxa/extinct/edit',
    name: 'MyProjectTaxaExtinctEditView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/ExtinctTaxaEditView.vue'
      ),
    beforeEnter: requireTaxonEditAccess,
  },
  {
    path: 'taxa/pbdb/import',
    name: 'MyProjectTaxaPbdbImportView',
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
        /* webpackChunkName: "unpublished" */ '@/views/project/taxa/PbdbImportView.vue'
      ),
    beforeEnter: createEntityCreateGuard('taxon'),
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
    beforeEnter: requireProjectAdmin,
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
    beforeEnter: requireProjectAdmin,
  },
  {
    path: 'download',
    name: 'MyProjectDownloadView',
    meta: {
      itemName: 'download',
      breadcrumbs: [
        {
          label: 'Download Project',
          to: 'MyProjectDownloadView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/DownloadView.vue'
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
    beforeEnter: requireProjectAdmin,
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
    beforeEnter: requireProjectAdmin,
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
    beforeEnter: requireProjectAdmin,
  },
  // Publication workflow routes
  {
    path: 'publish',
    name: 'MyProjectPublishView',
    meta: {
      itemName: 'publish',
      breadcrumbs: [
        {
          label: 'Publish Project',
          to: 'MyProjectPublishView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/publish/PrerequisiteView.vue'
      ),
    beforeEnter: requireProjectAdmin,
  },

  {
    path: 'publish/preferences',
    name: 'MyProjectPublishPreferencesView',
    meta: {
      itemName: 'publish',
      breadcrumbs: [
        {
          label: 'Publish Project',
          to: 'MyProjectPublishView',
        },
        {
          label: 'Publishing Preferences',
          to: 'MyProjectPublishPreferencesView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/publish/PreferencesView.vue'
      ),
    beforeEnter: requireProjectAdmin,
  },
  {
    path: 'publish/final',
    name: 'MyProjectPublishFinalView',
    meta: {
      itemName: 'publish',
      breadcrumbs: [
        {
          label: 'Publish Project',
          to: 'MyProjectPublishView',
        },
        {
          label: 'Final Publishing',
          to: 'MyProjectPublishFinalView',
        },
      ],
    },
    component: () =>
      import(
        /* webpackChunkName: "unpublished" */ '@/views/project/publish/FinalView.vue'
      ),
    beforeEnter: requireProjectAdmin,
  },
]
