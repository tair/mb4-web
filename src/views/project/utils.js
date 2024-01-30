import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'

export function getUserName(userId) {
  const projectUserStore = useProjectUsersStore()
  const user = projectUserStore.getUserById(userId)
  if (user) {
    return ` ${user.fname} ${user.lname} (${user.email})`
  }
  return ' Unknown User'
}

export function getTaxonForMediaId(media) {
  const specimensStore = useSpecimensStore()
  const taxaStore = useTaxaStore()
  if (media.specimen_id) {
    const specimen = specimensStore.getSpecimenById(media.specimen_id)
    if (specimen && specimen.taxon_id) {
      return taxaStore.getTaxonById(specimen.taxon_id)
    }
  }
  return null
}
