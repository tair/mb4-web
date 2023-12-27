export enum TaxaColumns {
  SUPRASPECIFIC_CLADE = 'supraspecific_clade',
  KINGDOM = 'higher_taxon_kingdom',
  PHYLUM = 'higher_taxon_phylum',
  CLASS = 'higher_taxon_class',
  SUBCLASS = 'higher_taxon_subclass',
  INFRACLASS = 'higher_taxon_infraclass',
  COHORT = 'higher_taxon_cohort',
  SUPERORDER = 'higher_taxon_superorder',
  ORDER = 'higher_taxon_order',
  SUBORDER = 'higher_taxon_suborder',
  INFRAORDER = 'higher_taxon_infraorder',
  SUPERFAMILY = 'higher_taxon_superfamily',
  FAMILY = 'higher_taxon_family',
  SUBFAMILY = 'higher_taxon_subfamily',
  TRIBE = 'higher_taxon_tribe',
  SUBTRIBE = 'higher_taxon_subtribe',
  GENUS = 'genus',
  SUBGENUS = 'subgenus',
  SPECIFIC_EPITHET = 'specific_epithet',
  SUBSPECIFIC_EPITHET = 'subspecific_epithet',
}

export enum TaxaFriendlyNames {
  SUPRASPECIFIC_CLADE = 'supraspecific clade',
  KINGDOM = 'kingdom',
  PHYLUM = 'phylum',
  CLASS = 'class',
  SUBCLASS = 'subclass',
  INFRACLASS = 'infraclass',
  COHORT = 'cohort',
  SUPERORDER = 'superorder',
  ORDER = 'order',
  SUBORDER = 'suborder',
  INFRAORDER = 'infraorder',
  SUPERFAMILY = 'superfamily',
  FAMILY = 'family',
  SUBFAMILY = 'subfamily',
  TRIBE = 'tribe',
  SUBTRIBE = 'subtribe',
  GENUS = 'genus',
  SUBGENUS = 'subgenus',
  SPECIFIC_EPITHET = 'species',
  SUBSPECIFIC_EPITHET = 'subspecies',
}

export const nameColumnMap: Map<TaxaColumns, TaxaFriendlyNames> = new Map([
  [TaxaColumns.SUPRASPECIFIC_CLADE, TaxaFriendlyNames.SUPRASPECIFIC_CLADE],
  [TaxaColumns.KINGDOM, TaxaFriendlyNames.KINGDOM],
  [TaxaColumns.PHYLUM, TaxaFriendlyNames.PHYLUM],
  [TaxaColumns.CLASS, TaxaFriendlyNames.CLASS],
  [TaxaColumns.SUBCLASS, TaxaFriendlyNames.SUBCLASS],
  [TaxaColumns.INFRACLASS, TaxaFriendlyNames.INFRACLASS],
  [TaxaColumns.COHORT, TaxaFriendlyNames.COHORT],
  [TaxaColumns.SUPERORDER, TaxaFriendlyNames.SUPERORDER],
  [TaxaColumns.ORDER, TaxaFriendlyNames.ORDER],
  [TaxaColumns.SUBORDER, TaxaFriendlyNames.SUBORDER],
  [TaxaColumns.INFRAORDER, TaxaFriendlyNames.INFRAORDER],
  [TaxaColumns.SUPERFAMILY, TaxaFriendlyNames.SUPERFAMILY],
  [TaxaColumns.FAMILY, TaxaFriendlyNames.FAMILY],
  [TaxaColumns.SUBFAMILY, TaxaFriendlyNames.SUBFAMILY],
  [TaxaColumns.TRIBE, TaxaFriendlyNames.TRIBE],
  [TaxaColumns.SUBTRIBE, TaxaFriendlyNames.SUBTRIBE],
  [TaxaColumns.GENUS, TaxaFriendlyNames.GENUS],
  [TaxaColumns.SUBGENUS, TaxaFriendlyNames.SUBGENUS],
  [TaxaColumns.SPECIFIC_EPITHET, TaxaFriendlyNames.SPECIFIC_EPITHET],
  [TaxaColumns.SUBSPECIFIC_EPITHET, TaxaFriendlyNames.SUBSPECIFIC_EPITHET],
])

export function getTaxonName(
  taxon: { [key: string]: string },
  otu = TaxaColumns.GENUS,
  showExtinctMarker = true
): string {
  if (!taxon) {
    return ''
  }

  let gotOtu = false
  const names = []
  let lastName = ''
  for (const columnName of TAXA_COLUMN_NAMES) {
    if (columnName == otu) {
      gotOtu = true
    }
    const name = taxon[columnName]
    if (name?.length > 0) {
      lastName = name
      if (gotOtu) {
        names.push(name)
      }
    }
  }

  const name = names.length > 0 ? names.join(' ') : lastName
  return (showExtinctMarker && taxon.is_extinct ? '† ' : ' ') + name
}

export const TAXA_COLUMN_NAMES: string[] = Object.values(TaxaColumns)
