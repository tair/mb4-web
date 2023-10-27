import TextContent from '@/components/project/TextContent.vue'
import TextInput from '@/components/project/TextInput.vue'
import { getUserName } from './utils'

export const schema = {
  name: {
    label: 'View Name',
    view: TextInput,
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
