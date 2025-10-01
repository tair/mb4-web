import Checkbox from '@/components/project/Checkbox.vue'
import DateText from '@/components/project/DateText.vue'
import FileInput from '@/components/project/FileInput.vue'
import MediaViewSelect from '@/views/project/common/MediaViewSelect.vue'
import SelectInput from '@/components/project/SelectInput.vue'
import SpecimenSearchInput from '@/views/project/common/SpecimenSearchInput.vue'
import TextArea from '@/components/project/TextArea.vue'
import TextContent from '@/components/project/TextContent.vue'
import { getUserName } from '@/views/project/utils'

export const schema = {
  file: {
    label: 'Media file to upload',
    view: FileInput,
    required: true,
  },
  is_sided: {
    label: 'Which side is represented',
    view: SelectInput,
    args: {
      options: {
        'Not entered': 0,
        'Not applicable': 0,
        'Left side': 1,
        'Right side': 1,
      },
    },
  },
  specimen_id: {
    label: 'Specimen',
    view: SpecimenSearchInput,
    type: Number,
    required: true,
  },
  view_id: {
    label: 'View',
    view: MediaViewSelect,
    type: Number,
    required: true,
  },
  is_copyrighted: {
    label: 'Is under copyright?',
    view: Checkbox,
  },
  copyright_permission: {
    label: 'Copyright permission',
    view: SelectInput,
    args: {
      options: {
        'Copyright permission not set': 0,
        'Person loading media owns copyright and grants permission for use of media on MorphoBank': 1,
        'Permission to use media on MorphoBank granted by copyright holder': 2,
        'Permission pending': 3,
        'Copyright expired or work otherwise in public domain': 4,
        'Copyright permission not yet requested': 5,
      },
      value: 4,
    },
  },
  copyright_license: {
    label: 'Media reuse license',
    view: SelectInput,
    args: {
      options: {
        'Media reuse policy not set': 0,
        'CC0 - relinquish copyright': 1,
        'Attribution CC BY - reuse with attribution': 2,
        'Attribution-NonCommercial CC BY-NC - reuse but noncommercial': 3,
        'Attribution-ShareAlike CC BY-SA - reuse here and applied to future uses ': 4,
        'Attribution- CC BY-NC-SA - reuse here and applied to future uses but noncommercial': 5,
        'Attribution-NoDerivs CC BY-ND - reuse but no changes': 6,
        'Attribution-NonCommercial-NoDerivs CC BY-NC-ND - reuse noncommerical no changes': 7,
        'Media released for onetime use, no reuse without permission': 8,
        'Unknown - Will set before project publication': 20,
      },
      value: 1,
    },
  },
  copyright_info: {
    label: 'Copyright holder',
    view: TextArea,
  },
  url: {
    label: 'URL of media',
    view: TextArea,
  },
  url_description: {
    label: 'URL description',
    view: TextArea,
  },
  notes: {
    label: 'Media notes',
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
  access: {
    label: 'Access granted to this media',
    view: SelectInput,
    args: {
      options: {
        'Anyone in my project may edit this media': 0,
        'Only the owner may edit this media': 1,
      },
    },
  },
  is_exemplar: {
    label: 'Make this image the project exemplar',
    view: Checkbox,
  },
  user_id: {
    label: 'Media loaded by',
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

export const createSchema = {
  ...schema,
  file: {
    label: 'Select media file',
    view: FileInput,
    required: true,
    args: {
      accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif',
    },
  },
}

export const editSchema = {
  ...schema,
  file: {
    label: 'Update media file with',
    view: FileInput,
    required: false, // Optional for editing
  },
}

export const batchSchema = {
  ...schema,
  file: {
    label: 'Choose a ZIP, TAR, TAR+gzip, TAR+bzip archive or individual file',
    view: FileInput,
    required: true,
  },
  specimen_id: {
    label: 'Specimen',
    view: SpecimenSearchInput,
    type: Number,
    required: false, // Not required for batch upload
  },
  view_id: {
    label: 'View',
    view: MediaViewSelect,
    type: Number,
    required: false, // Not required for batch upload
  },
}

export const videoSchema = {
  ...schema,
  file: {
    label: 'Choose a video file (MP4, MOV, AVI, WebM, MKV, WMV, FLV, M4V)',
    view: FileInput,
    required: true,
    args: {
      accept: '.mp4,.mov,.avi,.webm,.mkv,.wmv,.flv,.m4v,video/*',
    },
  },
}

export const schema3D = {
  ...schema,
  file: {
    label: 'Choose a 3D file (PLY, STL, OBJ, GLB, GLTF, FBX)',
    view: FileInput,
    required: true,
    args: {
      accept: '.ply,.stl,.obj,.glb,.gltf,.fbx,model/*',
    },
  },
}

export const stacksSchema = {
  ...schema,
  file: {
    label: 'Choose a ZIP archive containing CT scan stacks (DICOM, TIFF)',
    view: FileInput,
    required: true,
    args: {
      accept: '.zip,application/zip',
    },
  },
}
