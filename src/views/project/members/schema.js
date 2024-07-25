import SelectInput from '@/components/project/SelectInput.vue'
import GroupCheckboxList from '@/components/project/GroupCheckboxListComp.vue'

export const userSchema = {
  membership_type: {
    label: 'Membership Type:',
    view: SelectInput,
    args: {
      options: {
        'Full membership (can edit everything)': 0,
        'Observer (cannot edit)': 1,
        'Character annotater (can edit everything but characters and states)': 2,
        'Bibliography maintainer (can edit bibliography only)': 3,
      },
    },
  },
  groups_membership: {
    label: 'Belongs to member group(s):',
    view: GroupCheckboxList
  }
}
