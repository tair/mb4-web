import TextContent from '@/components/project/TextContent.vue'
import TextInput from '@/components/project/TextInput.vue'
import { getUserName } from '@/views/project/utils'

export const schema = {
  name: {
    label: 'View Name',
    view: TextInput,
    allowMultiple: true,
    args: {
      placeholder: 'Enter view names separated by semicolons',
    },
  },
  user_id: {
    label: 'Submitted by',
    view: TextContent,
    existed: true,
    args: {
      getText: getUserName,
    },
  },
}
