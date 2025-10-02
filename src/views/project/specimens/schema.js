import DateText from '@/components/project/DateText.vue'
import SelectInput from '@/components/project/SelectInput.vue'
import TaxaSearchInput from '@/views/project/common/TaxaSearchInput.vue'
import TextArea from '@/components/project/TextArea.vue'
import TextContent from '@/components/project/TextContent.vue'
import TextInput from '@/components/project/TextInput.vue'
import { getUserName } from '@/views/project/utils'

export const schema = {
  reference_source: {
    label: 'Type of specimen record',
    view: SelectInput,
    type: Number,
    args: {
      options: {
        Vouchered: 0,
        Unvouchered: 1,
      },
    },
  },
  taxon_id: {
    label: 'Taxonomic name',
    view: TaxaSearchInput,
    type: Number,
    args: {
      required: true,
    },
  },
  institution_code: {
    label: 'Institution code for specimens repository',
    view: TextInput,
  },
  collection_code: {
    label: 'Collection code for specimens repository',
    view: TextInput,
  },
  catalog_number: {
    label: 'Catalog number',
    view: TextInput,
  },
  occurrence_id: {
    label: 'Occurrence ID',
    view: TextInput,
  },
  description: {
    label: 'Notes',
    view: TextArea,
  },
  user_id: {
    label: 'This item is owned by',
    view: TextContent,
    existed: true,
    args: {
      getText: getUserName,
    },
  },
  access: {
    label: 'Access granted to this specimen',
    view: SelectInput,
    args: {
      options: {
        'Anyone in my project may edit this specimen': 0,
        'Only the owner may edit this specimen': 1,
      },
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
