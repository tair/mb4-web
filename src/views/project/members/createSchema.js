import TextArea from '@/components/project/TextArea.vue'
import TextInput from '@/components/project/TextInput.vue'
import SelectInput from '@/components/project/SelectInput.vue'

export const schema = {
  email: {
    label: 'Email address of new workgroup member',
    view: TextInput,
  },
  fname: {
    label: 'First name',
    view: TextInput,
  },
  lname: {
    label: 'Last name',
    view: TextInput,
  },
  message: {
    label: 'Please provide a message to be emailed to the new workgroup member',
    view: TextArea,
  },
  membership_type: {
    label: 'Membership Type',
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
}
