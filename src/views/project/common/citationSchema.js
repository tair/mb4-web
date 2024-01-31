import BibliographySearchInput from '@/views/project/common/BibliographySearchInput.vue'
import TextArea from '@/components/project/TextArea.vue'
import TextContent from '@/components/project/TextContent.vue'
import TextInput from '@/components/project/TextInput.vue'
import { getUserName } from '@/views/project/utils'

export const schema = {
  reference_id: {
    label: 'Citation',
    view: BibliographySearchInput,
    type: Number,
  },
  pp: {
    label: 'Pages',
    view: TextInput,
  },
  notes: {
    label: 'Notes',
    view: TextArea,
  },
  user_id: {
    label: 'Created by',
    view: TextContent,
    existed: true,
    args: {
      getText: getUserName,
    },
  },
}
