import SelectInput from '@/components/project/SelectInput.vue'
import GroupCheckboxList from '@/components/project/GroupCheckboxListComp.vue'

export const userSchema = {
  membership_type: {
    label: 'Membership Type',
    view: SelectInput,
    args: {
      options: {
        'Full membership (can edit everything)': 0,
        'Observer (cannot edit)': 1,
        'Matrix scorer (cannot edit character or state names, can edit other data)': 2,
        'Bibliography maintainer (can edit bibliography only)': 3,
      },
    },
  },
  group_ids: {
    label: 'Belongs to member group(s)',
    view: GroupCheckboxList,
  },
}
