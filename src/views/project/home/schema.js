import Checkbox from '@/components/project/Checkbox.vue'
import NumberInput from '@/components/project/NumberInput.vue'
import SelectInput from '@/components/project/SelectInput.vue'
import TextArea from '@/components/project/TextArea.vue'
import TextInput from '@/components/project/TextInput.vue'

export const schema = {
  name: {
    label: 'Name',
    view: TextArea,
  },
  nsf_funded: {
    label:
      'Is your research project supported by the U.S. National Science Foundation?',
    view: SelectInput,
    args: {
      options: {
        No: 0,
        Yes: 1,
      },
    },
  },
  allow_reviewer_login: {
    label: 'Allow reviewer login?',
    view: Checkbox,
  },
  reviewer_login_password: {
    label: 'Reviewer login password (password not displayed for privacy)',
    view: TextInput,
  },
  published: {
    label:
      'Status (To publish your project change its status to "Published" and hit "save")',
    view: SelectInput,
    args: {
      options: {
        unpublished: 0,
        Published: 1,
      },
    },
  },
  user_id: {
    label: 'Change Project Admin',
    description:
      '(Select a user from the list to promote them to Project Administrator)',
    view: NumberInput,
  },
  description: {
    label: 'Abstract',
    view: TextArea,
  },
  article_authors: {
    label: 'Article authors',
    description:
      'separated by commas (example: H.-D. Sues, E. Frey, D. M. Martill, D. M. Scott)',
    view: TextArea,
  },
  article_title: {
    label: 'Article Title',
    view: TextArea,
  },
  journal_url: {
    label: 'Journal url (link to published article)',
    view: TextInput,
  },
  journal_volume: {
    label: 'Journal Volume',
    view: NumberInput,
  },
  journal_number: {
    label: 'Journal Number',
    view: NumberInput,
  },
  journal_year: {
    label: 'Journal Year',
    view: NumberInput,
  },
  article_pp: {
    label: 'Article pagination (example: 5-15)',
    view: TextInput,
  },
  article_doi: {
    label: 'Article DOI',
    view: TextInput,
  },
}
