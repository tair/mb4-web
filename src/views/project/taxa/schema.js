import Checkbox from '@/components/project/Checkbox.vue'
import DateText from '@/components/project/DateText.vue'
import NumberInput from '@/components/project/NumberInput.vue'
import SelectInput from '@/components/project/SelectInput.vue'
import TextArea from '@/components/project/TextArea.vue'
import TextContent from '@/components/project/TextContent.vue'
import TextInput from '@/components/project/TextInput.vue'
import { getUserName } from '@/views/project/utils'

export const schema = {
  is_extinct: {
    label: 'Is extinct?',
    view: Checkbox,
  },
  genus: {
    label: 'Genus',
    view: TextInput,
  },
  specific_epithet: {
    label: 'Species',
    view: TextInput,
  },
  supraspecific_clade: {
    label: 'Supraspecific clade (no rank specified)',
    view: TextInput,
  },
  higher_taxon_kingdom: {
    label: 'Kingdom',
    view: TextInput,
  },
  higher_taxon_phylum: {
    label: 'Phylum',
    view: TextInput,
  },
  higher_taxon_class: {
    label: 'Class',
    view: TextInput,
  },
  higher_taxon_subclass: {
    label: 'Subclass',
    view: TextInput,
  },
  higher_taxon_infraclass: {
    label: 'Infraclass',
    view: TextInput,
  },
  higher_taxon_cohort: {
    label: 'Cohort',
    view: TextInput,
  },
  higher_taxon_superorder: {
    label: 'Superorder',
    view: TextInput,
  },
  higher_taxon_order: {
    label: 'Order',
    view: TextInput,
  },
  higher_taxon_suborder: {
    label: 'Suborder',
    view: TextInput,
  },
  higher_taxon_infraorder: {
    label: 'Infraorder',
    view: TextInput,
  },
  higher_taxon_superfamily: {
    label: 'Superfamily',
    view: TextInput,
  },
  higher_taxon_family: {
    label: 'Family',
    view: TextInput,
  },
  higher_taxon_subfamily: {
    label: 'Subfamily',
    view: TextInput,
  },
  higher_taxon_tribe: {
    label: 'Tribe',
    view: TextInput,
  },
  higher_taxon_subtribe: {
    label: 'Subtribe',
    view: TextInput,
  },
  subgenus: {
    label: 'Subgenus',
    view: TextInput,
  },
  subspecific_epithet: {
    label: 'Subspecies',
    view: TextInput,
  },
  scientific_name_author: {
    label: 'Scientific name author',
    view: TextInput,
  },
  scientific_name_year: {
    label: 'Scientific name year',
    view: NumberInput,
  },
  use_parens_for_author: {
    label: 'Use parenthesis for author?',
    view: Checkbox,
  },
  notes: {
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
    label: 'Access granted to this taxon',
    view: SelectInput,
    args: {
      options: {
        'Anyone in my project may edit this taxon': 0,
        'Only the owner may edit this taxon': 1,
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
