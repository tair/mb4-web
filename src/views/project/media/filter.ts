import axios from 'axios'
import { useSpecimensStore } from '@/stores/SpecimensStore'

const specimensStore = useSpecimensStore()

export type MediaFilter = {
  filterTaxa: number[]
  filterView: number[]
  filterSubmitter: number[]
  filterCopyrightLicense: number[]
  filterCopyrightPermission: number[]
  filterSpecimenRepository: string[]
  filterStatus: number[]
  filterOther: { [key: string]: boolean }
}

type OtherFilterOption = {
  [key: string]: {
    label: string
    filter: (media: any, ids?: any) => boolean
    requiresFetch?: boolean
  }
}

async function fetchFilterMediaIds(projectId: number) {
  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/media/filter/ids`
  const response = await axios.get(url)
  return response.data
}

export const otherFiltersOptions: OtherFilterOption = {
  characterExemplar: {
    label: 'in use as character exemplar',
    requiresFetch: true,
    filter: (media: any, ids: any) => ids?.characters?.includes(media.media_id),
  },
  notCharacterExemplar: {
    label: 'not in use as a character exemplar',
    requiresFetch: true,
    filter: (media: any, ids: any) => !ids?.character?.includes(media.media_id),
  },
  unusedInCells: {
    label: 'not in use in a cell',
    requiresFetch: true,
    filter: (media: any, ids: any) => ids?.cells?.includes(media.media_id),
  },
  usedInCells: {
    label: 'in use in a cell',
    requiresFetch: true,
    filter: (media: any, ids: any) => ids?.cells?.includes(media.media_id),
  },
  taxonExemplar: {
    label: 'in use as a taxon exemplar',
    requiresFetch: true,
    filter: (media: any, ids: any) => ids?.taxa?.includes(media.media_id),
  },
  notTaxonExemplar: {
    label: 'not in use as a taxon exemplar',
    requiresFetch: true,
    filter: (media: any, ids: any) => !ids?.taxa?.includes(media.media_id),
  },
  withUrl: {
    label: 'with url',
    filter: (media: any) => !!media.url,
  },
  coprightUndefined: {
    label:
      'copyright undefined (this will find all legacy media with the Is Under Copyright? checkbox UNCHECKED)',
    filter: (media: any) => media.is_copyrighted != null,
  },
  notCopyrighted: {
    label:
      'copyright box unchecked - No re-use restrictions (This will find media with the Is Under Copyright?)',
    filter: (media: any) => media.is_copyrighted == 0,
  },
  unaffiliatedSpecimen: {
    label: 'not affiliated with a specimen',
    filter: (media: any) => !media.specimen_id,
  },
  copyrightDocumentMissing: {
    label: 'copyright document missing',
    requiresFetch: true,
    filter: (media: any, ids: any) =>
      media.copyright_permission == 2 &&
      !ids?.documents?.includes(media.media_id),
  },
  noView: {
    label: 'no view specified',
    filter: (media: any) => !media.view_id,
  },
  withUnvoucheredSpecimen: {
    label: 'associated with an unvouchered specimen',
    filter: (media: any) => {
      if (media.specimen_id == null) {
        return false
      }

      const specimen = specimensStore.getSpecimenById(media.specimen_id)
      if (specimen == null) {
        return false
      }
      return specimen.reference_source == 1
    },
  },
}

export async function applyFilter(
  projectId: number,
  filter: any,
  setFilter: (key: string, value: (media: any) => boolean) => void,
  clearFilter: (key: string) => void
) {
  if (filter.filterTaxa.length) {
    setFilter('filterTaxa', (media: any) => {
      if (media.specimen_id == null) {
        return false
      }

      const specimen = specimensStore.getSpecimenById(media.specimen_id)
      if (specimen == null) {
        return false
      }
      return filter.filterTaxa.includes(specimen.taxon_id)
    })
  } else {
    clearFilter('filterTaxa')
  }

  if (filter.filterView.length) {
    setFilter('filterView', (media: any) => {
      if (media.view_id == null) {
        return false
      }
      return filter.filterView.includes(media.view_id)
    })
  } else {
    clearFilter('filterView')
  }

  if (filter.filterSubmitter.length) {
    setFilter('filterSubmitter', (media: any) => {
      if (media.user_id == null) {
        return false
      }
      return filter.filterSubmitter.includes(media.user_id)
    })
  } else {
    clearFilter('filterSubmitter')
  }

  if (filter.filterCopyrightLicense.length) {
    setFilter('filterCopyrightLicense', (media: any) => {
      return filter.filterCopyrightLicense.includes(media.copyright_license)
    })
  } else {
    clearFilter('filterCopyrightLicense')
  }

  if (filter.filterCopyrightPermission.length) {
    setFilter('filterCopyrightPermission', (media: any) => {
      return filter.filterCopyrightPermission.includes(
        media.copyright_permission
      )
    })
  } else {
    clearFilter('filterCopyrightPermission')
  }

  if (filter.filterSpecimenRepository.length) {
    setFilter('filterSpecimenRepository', (media: any) => {
      if (media.specimen_id == null) {
        return false
      }

      const specimen = specimensStore.getSpecimenById(media.specimen_id)
      if (specimen == null) {
        return false
      }
      return filter.filterSpecimenRepository.includes(specimen.institution_code)
    })
  } else {
    clearFilter('filterSpecimenRepository')
  }

  if (filter.filterStatus.length) {
    setFilter('filterStatus', (media: any) =>
      filter.filterStatus.includes(media.published)
    )
  } else {
    clearFilter('filterStatus')
  }

  const otherKeys = Object.keys(filter.filterOther)

  const requiresFetch = otherKeys.some(
    (key) => otherFiltersOptions[key].requiresFetch
  )
  const ids = requiresFetch ? await fetchFilterMediaIds(projectId) : []

  if (otherKeys.length) {
    const otherFilters = otherKeys
      .filter((key) => otherKeys.includes(key))
      .map((key) => otherFiltersOptions[key].filter)
    setFilter('filterOther', (media: any) => {
      return otherFilters.every((func) => func(media, ids))
    })
  } else {
    clearFilter('filterOther')
  }
}
