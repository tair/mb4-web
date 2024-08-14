import TextArea from '@/components/project/TextArea.vue'
import TextInput from '@/components/project/TextInput.vue'

export const groupSchema = {
  group_name: {
    label: 'Group Name',
    view: TextInput,
  },
  description: {
    label: 'Description',
    view: TextArea,
  },
}
