import { getTaxonName } from '@/utils/taxa'

export function getSpecimenName(
  specimen: { [key: string]: any },
  taxon: { [key: string]: any }
): string {
  return getTaxonName(taxon) + getReference(specimen)
}

export function getReference(specimen: { [key: string]: any }): string {
  switch (specimen.reference_source) {
    case 0:
      let result = specimen.institution_code
      if (specimen.collection_code) {
        result += '/' + specimen.collection_code
      }
      if (specimen.catalog_number) {
        result += ':' + specimen.catalog_number
      }
      if (result) {
        return ' (' + result + ')'
      }
    case 1:
      return ' (unvouchered)'
  }
  return ''
}
