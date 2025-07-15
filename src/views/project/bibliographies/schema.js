import AuthorsListInput from '@/components/project/AuthorsListInput.vue'
import DateText from '@/components/project/DateText.vue'
import SelectInput from '@/components/project/SelectInput.vue'
import TextArea from '@/components/project/TextArea.vue'
import TextContent from '@/components/project/TextContent.vue'
import TextInput from '@/components/project/TextInput.vue'
import { getUserName } from '@/views/project/utils'

export const schema = {
  authors: {
    label: 'Authors',
    view: AuthorsListInput,
  },
  pubyear: {
    label: 'Year',
    view: TextInput,
  },
  article_title: {
    label: 'Article Title',
    view: TextArea,
  },
  journal_title: {
    label: 'Journal or Book Title',
    view: TextArea,
  },
  vol: {
    label: 'Volume',
    view: TextInput,
  },
  num: {
    label: 'Number',
    view: TextInput,
  },
  collation: {
    label: 'Pages',
    view: TextInput,
  },
  editors: {
    label: 'Editors',
    view: AuthorsListInput,
  },
  publisher: {
    label: 'Publisher',
    view: TextArea,
  },
  place_of_publication: {
    label: 'Place of Publication',
    view: TextInput,
  },
  reference_type: {
    label: 'Reference Type',
    view: SelectInput,
    args: {
      options: {
        Generic: 0,
        'Journal Article': 1,
        Book: 2,
        'Book Section': 3,
        Manuscript: 4,
        'Edited Book': 5,
        'Magazine Article': 6,
        'Newspaper Article': 7,
        'Conference Proceedings': 8,
        Thesis: 9,
        Report: 10,
        'Personal Communication': 11,
        'Electronic Source': 13,
        'Audiovisual Material': 14,
        Artwork: 16,
        Map: 17,
      },
    },
  },
  secondary_authors: {
    label: 'Secondary Authors',
    view: AuthorsListInput,
  },
  edition: {
    label: 'Edition',
    view: TextInput,
  },
  sect: {
    label: 'Section',
    view: TextInput,
  },
  isbn: {
    label: 'ISBN',
    view: TextInput,
  },
  lang: {
    label: 'Language',
    view: TextInput,
  },
  abstract: {
    label: 'Abstract',
    view: TextArea,
  },
  description: {
    label: 'Description',
    view: TextArea,
  },
  urls: {
    label: 'Urls',
    view: TextArea,
  },
  electronic_resource_num: {
    label: 'Electronic resource number',
    view: TextArea,
  },
  keywords: {
    label: 'Keywords (separate with commas or semicolons)',
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
  created_on: {
    label: 'Created on',
    view: DateText,
    existed: true,
  },
}
