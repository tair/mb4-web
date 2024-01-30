import DateText from '@/components/project/DateText.vue'
import SelectInput from '@/components/project/SelectInput.vue'
import TextArea from '@/components/project/TextArea.vue'
import TextContent from '@/components/project/TextContent.vue'
import TextInput from '@/components/project/TextInput.vue'
import { getUserName } from '@/views/project/utils'

export const schema = {
  name: {
    label: 'Folio Name',
    view: TextInput,
  },
  description: {
    label: 'Description',
    view: TextArea,
  },
  published: {
    label: 'Publishing Status',
    view: SelectInput,
    args: {
      options: {
        'Publish when project is published': 0,
        'Never publish to project': 1,
      },
    },
  },
  user_id: {
    label: 'This item is created by',
    view: TextContent,
    existed: true,
    args: {
      getText: getUserName,
    },
  },
  created_on: {
    label: 'Created on',
    view: DateText,
    existed: true,
  },
  last_modified_on: {
    label: 'Last modified on',
    view: DateText,
    existed: true,
  },
}
