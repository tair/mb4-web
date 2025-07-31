import DateText from '@/components/project/DateText.vue'
import FileInput from '@/components/project/FileInput.vue'
import TextArea from '@/components/project/TextArea.vue'
import TextInput from '@/components/project/TextInput.vue'
import SelectInput from '@/components/project/SelectInput.vue'
import { getFolderNames } from './utils.js'

export const documentSchema = {
  title: {
    label: 'Title',
    view: TextInput,
  },
  description: {
    label: 'Description',
    view: TextArea,
  },
  file: {
    label: 'Document file to upload',
    view: FileInput,
  },
  folder_id: {
    label: 'Folder',
    view: SelectInput,
    args: {
      options: getFolderNames,
    },
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
  access: {
    label: 'Access',
    view: SelectInput,
    args: {
      options: {
        'Anyone may edit this item': 0,
        'Only the owner may edit this item': 1,
      },
    },
  },
  uploaded_on: {
    label: 'Uploaded on',
    view: DateText,
    existed: true,
  },
}

export const folderSchema = {
  title: {
    label: 'Title',
    view: TextInput,
  },
  description: {
    label: 'Description',
    view: TextArea,
  },
  access: {
    label: 'Access granted to this document',
    view: SelectInput,
    args: {
      options: {
        'Anyone in my project may edit this document': 0,
        'Only the owner may edit this document': 1,
      },
    },
  },
}
