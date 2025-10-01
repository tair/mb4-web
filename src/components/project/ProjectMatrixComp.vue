<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useFileTransferStore } from '@/stores/FileTransferStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useNotifications } from '@/composables/useNotifications'
import { apiService } from '@/services/apiService.js'
import { logDownload, DOWNLOAD_TYPES } from '@/lib/analytics.js'
import Tooltip from '@/components/main/Tooltip.vue'
import { getTaxonomicUnitOptions } from '@/utils/taxa'
import { serializeMatrix } from '@/lib/MatrixSerializer.ts'
import { mergeMatrix } from '@/lib/MatrixMerger.js'
import { useCharactersStore } from '@/stores/CharactersStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import TntAnalysisComp from '@/components/project/TntAnalysisComp.vue'

const props = defineProps({
  matrix: {
    type: Object,
    required: true,
  },
  partitions: {
    type: Object,
    required: true,
  },
  canEditMatrix: {
    type: Boolean,
    required: true,
  },
  jobs: {
    type: Object,
    required: false,
  },
})

const documentsStore = useDocumentsStore()

const formats = new Map()
const matrix = props.matrix
if (!matrix.counts.continuous_character) {
  formats.set('nexus', 'NEXUS')
}
if (!matrix.counts.continuous_character && matrix.type != 1) {
  formats.set('nexml', 'NeXML')
}
if (matrix.type != 1) {
  formats.set('tnt', 'TNT')
}

const route = useRoute()
const router = useRouter()
const matricesStore = useMatricesStore()
const fileTransferStore = useFileTransferStore()
const taxaStore = useTaxaStore()
const charactersStore = useCharactersStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()
const notes = ref(true)
const format = ref(formats.keys()?.next()?.value)
const partitionId = ref('')

// Merge file functionality
const matrixFileData = ref({
  file: null,
  notes: '',
  otu: 'genus',
})
const isUploading = ref(false)
const uploadErrors = ref({})
const taxonomicUnits = getTaxonomicUnitOptions()
const parsedMatrix = ref(null)

const projectId = route.params.id
const matrixId = props.matrix.matrix_id
const taxonNames = props.matrix.taxonNames
const baseUrl = apiService.buildUrl(`/projects/${projectId}/matrices/${matrixId}`)

const tools = new Map()
tools.set('PAUPRAT', 'PAUP Ratchet')
tools.set('MRBAYES_XSEDE', 'Mr Bayes')
//tools.set('RAXMLHPC8_REST_XSEDE', 'RaXML')
const toolvalue = route.query.toolvalue
let tool = ref(tools.keys()?.next()?.value)
let clickedRun = 0
const jobName = ref('')
const jobNote = ref('')
const jobNameShouldValidate = ref(false)

const jobNumIterations = ref(200)
const jobCharsToPermute = ref('')
const jobBranchSwappingAlgorithms = new Map()
jobBranchSwappingAlgorithms.set('tbr', 'tbr - tree bisection and reconnection')
jobBranchSwappingAlgorithms.set('spr', 'spr - subtree pruning and grafting')
jobBranchSwappingAlgorithms.set('nni', 'nni - nearest neighbor interchange')
const jobBranchSwappingAlgorithm = ref(
  jobBranchSwappingAlgorithms.keys()?.next()?.value
)

// MrBayes specific variables
const SEP = '^'
const BLOCK_BEGIN = 'begin mrbayes;'
const mrbayesblockquery = ref('1')
const entermrbayesblock = ref('1')
const nruns_specified = ref(2)
const nchains_specified = ref(4)
const outgroups = new Map()
outgroups.set('', 'None')
for (const taxonName of taxonNames) {
  outgroups.set(taxonName, taxonName)
}
const set_outgroup = ref(outgroups.keys()?.next()?.value)
const runtime = ref(4.0)
const ngenval = ref(20000)
const nrunsval = ref(2)
const nchainsval = ref(4)
const samplefreqval = ref(1000)
const specify_diagnfreqval = ref(5000)
const burninfracval = ref(0.25)

const mrbayesblock = ref('begin mrbayes;\n\nend;')

// RaXML specific variables
const nchar = ref(1000)
const outsuffix = ref('output')
const mlsearch_cat = ref('-F')
const outgroup = ref('')
const number_cats = ref(25)
const disable_ratehet = ref('-V')
const treetops = new Map()
if (!documentsStore.isLoaded) {
  documentsStore.fetchDocuments(projectId)
}
for (const doc of documentsStore.uncategorizedDocuments) {
  treetops.set(doc.documentId, doc.title)
}
const treetop = ref(treetops.keys()?.next()?.value)
let validateMsg = ''

const jobstatuses = new Map()
jobstatuses.set('NEW', 'A new job with specified parameters has created')
jobstatuses.set('READY', 'The newly created job is ready to be put in queue')
jobstatuses.set(
  'QUEUE',
  'The new job has been created and queued within CIPRES, waiting for further processing'
)
jobstatuses.set(
  'INPUTCHECK',
  'The input file(s) and parameters are being checked'
)
jobstatuses.set(
  'COMMANDRENDERING',
  'A commandline is being generated according to the parameters specified'
)
jobstatuses.set(
  'INPUTSTAGING',
  'The input file(s) and other related files are being transferred to the working directory on HPC side'
)
jobstatuses.set('SUBMITTING', 'The job is being submitted to HPC')
jobstatuses.set('SUBMITTED', 'The job has been submitted to HPC')
jobstatuses.set('RUNNING', 'The job has been started and is running on HPC')
jobstatuses.set(
  'LOAD_RESULTS',
  'The job has finished running and the results are being transferred back to CIPRES'
)
jobstatuses.set(
  'COMPLETED',
  'The job is done and resluts have been transferred back and stored on CIPRES'
)

const currentMatrixJobs = props.jobs?.filter((job) => job.matrix_id == matrixId)
const refresh = route.query.refresh
const refreshId = route.query.refreshid
const homeButtonClass =
  refresh != 'true'
    ? 'nav-link active'
    : refresh == 'true' && refreshId == matrixId
    ? 'nav-link'
    : 'nav-link active'
const buildatreeButtonClass =
  refresh == 'true' && refreshId == matrixId ? 'nav-link active' : 'nav-link'
const homePanelClass =
  refresh != 'true'
    ? 'tab-pane fade show active'
    : refresh == 'true' && refreshId == matrixId
    ? 'tab-pane fade'
    : 'tab-pane fade show active'
const buildatreePanelClass =
  refresh == 'true' && refreshId == matrixId
    ? 'tab-pane fade show active'
    : 'tab-pane fade'

async function onDownloadMatrix() {
  const url = new URL(`${baseUrl}/download`)
  const searchParams = url.searchParams
  if (notes.value) {
    searchParams.append('notes', notes.value)
  }
  if (format.value) {
    searchParams.append('format', format.value)
  }
  if (partitionId.value) {
    searchParams.append('partitionId', partitionId.value)
  }
  window.location.href = url
  logDownload({
    project_id: projectId,
    download_type: DOWNLOAD_TYPES.MATRIX,
    row_id: matrixId,
  })
}

async function onDownloadCharacters() {
  const url = new URL(`${baseUrl}/download/characters`)
  const searchParams = url.searchParams
  if (notes.value) {
    searchParams.append('notes', notes.value)
  }
  if (partitionId.value) {
    searchParams.append('partitionId', partitionId.value)
  }
  window.location.href = url
  logDownload({
    project_id: projectId,
    download_type: DOWNLOAD_TYPES.MATRIX,
    row_id: matrixId,
  })
}

async function onDownloadOntology() {
  const url = new URL(`${baseUrl}/download/ontology`)
  window.location.href = url
  logDownload({
    project_id: projectId,
    download_type: DOWNLOAD_TYPES.MATRIX,
    row_id: matrixId,
  })
}

let nruns_specified_parsed = 0
let nchains_specified_parsed = 0

function validateJobParameters() {
  nruns_specified_parsed = 0
  nchains_specified_parsed = 0
  validateMsg = ''
  if (jobName) {
    if (!jobName.value.trim()) {
      return false
    }
  } else return false
  if (tool.value == 'PAUPRAT') {
    if (jobCharsToPermute.value) {
      const numberRegex = /^\d+(\%)?$/
      if (!numberRegex.test(jobCharsToPermute.value)) {
        validateMsg +=
          '# or % chars to permute must be an integer or integer with percentage sign \n'
        return false
      }
      if (jobCharsToPermute.value.endsWith('%')) {
        if (
          Number(
            jobCharsToPermute.value.substring(
              0,
              jobCharsToPermute.value.length - 1
            )
          ) > 100
        ) {
          validateMsg += '% chars to permute must not be bigger than 100% \n'
          return false
        }
      }
    }
  }
  if (tool.value == 'MRBAYES_XSEDE') {
    if (mrbayesblockquery.value == '1') {
      if (!checkNumber(runtime, 0.1, 'Maximum hours to run')) return false
      if (
        (parseInt(nruns_specified.value) * parseInt(nchains_specified.value)) %
          2 !=
        0
      ) {
        validateMsg += 'nruns x nchains must be a multiple of 2 \n'
        return false
      }
    } else {
      if (entermrbayesblock.value == '0') {
        if (!checkNumber(ngenval, 5000, 'MCMC number of generations'))
          return false
        if (!checkNumber(nrunsval, 1, 'Number of runs')) return false
        if (!checkNumber(nchainsval, 1, 'Heated chains')) return false
        if (!checkNumber(samplefreqval, 1, 'Samplig frequency')) return false
        if (!checkNumber(specify_diagnfreqval, 1, 'Diagnostic run frequency'))
          return false
        if (!checkNumber(burninfracval, 0, 'Burnin')) return false
        if ((parseInt(nrunsval.value) * parseInt(nchainsval.value)) % 2 != 0) {
          validateMsg += 'nruns x nchains must be a multiple of 2 \n'
          return false
        }
      }
      if (entermrbayesblock.value == '1') {
        if (mrbayesblock) {
          if (!mrbayesblock.value.trim()) {
            return false
          }
          let hasError = false
          const lines = mrbayesblock.value.split('\n')
          let i = 0
          if (lines[i].trim() != 'begin mrbayes;') {
            validateMsg +=
              'MrBayes block (line ' +
              (i + 1) +
              "): first line should be 'begin mrbayes;' \n"
            hasError = true
          }
          const middleLineRegex =
            /^(set |prset |lset |outgroup |mcmcp |mcmc |log |constrain |sumt |sump |charset |partition |unlink |append=).*?;$/
          i++
          let endLine = lines.length - 1
          for (endLine; endLine >= 0; endLine--) {
            if (lines[endLine].trim() != '') break
          }
          for (i; i < endLine; i++) {
            if (lines[i].trim() == '') continue
            if (
              !middleLineRegex.test(lines[i].trim()) &&
              lines[i].trim() != 'mcmc;' &&
              lines[i].trim() != 'sumt;' &&
              !lines[i].trim().startsWith('[')
            ) {
              validateMsg +=
                'MrBayes block (line ' +
                (i + 1) +
                "): must start with 'set', 'prset', 'lset', outgroup', 'mcmcp', 'log', 'constrain', 'sumt' or  'sump'  and end with ';' \n"
              hasError = true
            } else {
              if (lines[i].trim().startsWith('outgroup ')) {
                const params = lines[i].trim().split(' ')
                if (params.length > 1) {
                  const numberOnlyRegex = /^\d+$/
                  let og = params[1]
                  if (params[1].endsWith(';')) {
                    og = params[1].substring(0, params[1].length - 1)
                  }
                  if (!outgroups.has(og) && !numberOnlyRegex.test(og)) {
                    validateMsg +=
                      'MrBayes block (Line ' +
                      (i + 1) +
                      "): outgroup must be either a taxon's name or a number to indicate the location in the taxon list \n"
                    hasError = true
                  }
                } else {
                  validateMsg +=
                    'MrBayes block (Line ' +
                    (i + 1) +
                    "): outgroup must be followed by either a taxon's name or a number to indicate the location in the taxon list \n"
                  hasError = true
                }
              }
              if (
                lines[i].trim().startsWith('mcmcp ') ||
                lines[i].trim().startsWith('mcmc ')
              ) {
                const shrink = lines[i]
                  .trim()
                  .replace(/ =/g, '=')
                  .replace(/= /g, '=')
                const params = shrink.split(' ')
                for (let j = 0; j < params.length; j++) {
                  let isnrun = params[j].startsWith('nruns=')
                  if (isnrun || params[j].startsWith('nchains=')) {
                    const ns = params[j].split('=')
                    if (ns != null && ns.length > 1) {
                      if (isnrun) nruns_specified_parsed = parseInt(ns[1])
                      else nchains_specified_parsed = parseInt(ns[1])
                    }
                  }
                }
                if (
                  nruns_specified_parsed < 1 ||
                  nchains_specified_parsed < 1
                ) {
                  validateMsg +=
                    'MrBayes block (Line ' +
                    (i + 1) +
                    '): nruns and nchains must be specified and bigger than 0 \n'
                  hasError = true
                }
                if (
                  (nruns_specified_parsed * nchains_specified_parsed) % 2 !=
                  0
                ) {
                  validateMsg +=
                    'MrBayes block (Line ' +
                    (i + 1) +
                    '): nruns x nchains must be a multiple of 2 \n'
                  hasError = true
                }
              }
            }
          }
          if (lines[i].trim() != 'end;') {
            validateMsg +=
              'MrBayes block (Line ' +
              (i + 1) +
              "): last line should be 'end;' \n"
            hasError = true
          }
          if (hasError) return false
        } else return false
      }
    }
  }
  return true
}

function checkNumber(numToCheck, limit, fieldName) {
  if (numToCheck) {
    if (numToCheck.value < limit) {
      validateMsg +=
        '\n' + fieldName + ' cannot be smaller than ' + limit + '\n'
      return false
    }
    return true
  } else return false
}

function validateJobName() {
  jobNameShouldValidate.value = true
  return jobName.value?.trim()
}

async function onRun() {
  if (!validateJobParameters()) {
    //if (validateMsg != null && validateMsg.startsWith("MrBayes block"))
    if (validateMsg) showWarning(validateMsg, 'Validation Error')
    else showWarning('Please fill out all the required fields', 'Missing Fields')
    return
  }
  const url = new URL(`${baseUrl}/run`)
  const searchParams = url.searchParams
  if (tool.value) {
    searchParams.append('tool', tool.value)
  }
  if (jobName.value) {
    searchParams.append('jobName', jobName.value)
  }
  if (jobNote.value) {
    searchParams.append('jobNote', jobNote.value)
  }
  if (tool.value == 'PAUPRAT') {
    if (jobNumIterations.value && jobNumIterations.value > 0) {
      searchParams.append('jobNumIterations', jobNumIterations.value)
    }
    if (jobCharsToPermute.value) {
      searchParams.append('jobCharsToPermute', jobCharsToPermute.value)
    }
    if (jobBranchSwappingAlgorithm.value) {
      searchParams.append(
        'jobBranchSwappingAlgorithm',
        jobBranchSwappingAlgorithm.value
      )
    }
  } else if (tool.value == 'MRBAYES_XSEDE') {
    let setmrbayesblockquery = mrbayesblockquery.value
    //searchParams.append('mrbayesblockquery', mrbayesblockquery.value)
    if (mrbayesblockquery.value == '1') {
      searchParams.append('nruns_specified', nruns_specified.value)
      searchParams.append('nchains_specified', nchains_specified.value)
      searchParams.append('runtime', runtime.value)
    }
    if (mrbayesblockquery.value == '0') {
      if (entermrbayesblock.value == '0') {
        if (set_outgroup.value != '') {
          searchParams.append('set_outgroup', set_outgroup.value)
        }
        searchParams.append('ngenval', ngenval.value)
        searchParams.append('nrunsval', nrunsval.value)
        searchParams.append('nchainsval', nchainsval.value)
        searchParams.append('samplefreqval', samplefreqval.value)
        searchParams.append('specify_diagnfreqval', specify_diagnfreqval.value)
        searchParams.append('burninfracval', burninfracval.value)
      }
      if (entermrbayesblock.value == '1') {
        setmrbayesblockquery = '1'
        if (nruns_specified_parsed > 0)
          searchParams.append('nruns_specified', nruns_specified_parsed)
        if (nchains_specified_parsed > 0)
          searchParams.append('nchains_specified', nchains_specified_parsed)
        searchParams.append('mrbayesblock', mrbayesblock.value)
      }
    }
    searchParams.append('mrbayesblockquery', setmrbayesblockquery)
  }
  sendCipresRequest(url)
}

async function sendCipresRequest(url) {
  try {
    document.body.style.cursor = 'wait'
    const response = await apiService.post(url)
    const data = await response.json()
    document.body.style.cursor = 'default'
    const msg = data?.message || 'Failed to submit job to CIPRES'
    showError(msg, 'Job Submission Failed')
    if (!msg.includes('fail') && !msg.includes('Fail')) {
      let urlNew = window.location.href
      if (urlNew.indexOf('?') > -1) {
        const beginIndex = urlNew.indexOf('refresh=true')
        if (beginIndex < 0)
          urlNew +=
            '&refresh=true&refreshid=' + matrixId + '&toolvalue=' + tool.value
        else {
          urlNew =
            urlNew.substring(0, beginIndex) +
            '&refresh=true&refreshid=' +
            matrixId +
            '&toolvalue=' +
            tool.value
        }
      } else {
        urlNew +=
          '?refresh=true&refreshid=' + matrixId + '&toolvalue=' + tool.value
      }
      window.location.href = urlNew
    }
  } finally {
    document.body.style.cursor = 'default'
  }
}

async function onDelete(jobName, cipresJobId) {
  const url = new URL(`${baseUrl}/deleteJob`)
  const searchParams = url.searchParams
  searchParams.append('jobName', jobName)
  searchParams.append('cipresJobId', cipresJobId)
  sendCipresRequest(url)
}

async function onDownloadJob(
  userId,
  jobName,
  cipresJobId,
  requestId,
  cu,
  ck,
  cr,
  ca
) {
  const cipresURL = `${cu}/job/${ca}/${cipresJobId}/outputbyname/mbank_X${matrixId}_${userId}_${jobName}.zip`
  await onDownloadJobResults(
    cipresURL,
    `mbank_X${matrixId}_${userId}_${jobName}.zip`,
    ck,
    cr
  )
  // logDownload({ project_id: projectId, download_type: DOWNLOAD_TYPES.CIPRES, row_id: requestId })
}

async function onDownloadJobResults(url, filename, ck, cr) {
  try {
    const response = await apiService.get(url, {
      headers: {
        'cipres-appkey': `${ck}`,
        Authorization: `Basic ${cr}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download results: ${response.statusText}`)
    }
    const blob = await response.blob()
    const contentType = response.headers.get('Content-Type')
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename || documentUrl.split('/').pop() // Fallback to original filename if none provided
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl) // Clean up
  } catch (error) {
    console.error('Error downloading the file:', error)
    showError(
      'Failed to download results for ' +
        (filename || documentUrl.split('/').pop()),
      'Download Failed'
    )
  }
}

function navigateToSettings() {
  router.push(`/myprojects/${projectId}/matrices/${matrixId}/settings`)
}

// Merge file functionality
function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) {
    matrixFileData.value.file = file
    // Parse the file when it's selected
    parseMatrixFile(file)
  }
}

async function parseMatrixFile(file) {
  try {
    uploadErrors.value = {}
    const parser = await import('@/lib/matrix-parser/parseMatrix.ts')
    const reader = new FileReader()

    reader.onload = function () {
      try {
        const matrixObject = parser.parseMatrix(reader.result)
        if (matrixObject) {
          // Convert MatrixObject to serializable format for sessionStorage
          const convertedMatrix = {
            // Copy basic properties
            format: matrixObject.getFormat(),
            parameters: matrixObject.getParameters() || {},
            blocks: matrixObject.getBlocks() || [],

            // Convert characters to Map
            characters: new Map(),

            // Convert taxa to Map
            taxa: new Map(),

            // Convert cells to 2D array for backend
            cellsArray: [],
          }

          // Process characters
          const characters = matrixObject.getCharacters()
          characters.forEach((character, index) => {
            character.characterNumber = index
            convertedMatrix.characters.set(character.name, character)
          })

          // Process taxa
          const taxaNames = matrixObject.getTaxaNames()
          taxaNames.forEach((taxonName) => {
            // Get the actual taxon object from the MatrixObject
            const actualTaxon = Array.from(matrixObject.taxa.values()).find(
              (t) => t.name === taxonName
            )
            const taxon = {
              name: taxonName,
              note: actualTaxon?.note || '',
              extinct: actualTaxon?.extinct || false,
              duplicateTaxon: actualTaxon?.duplicateTaxon || '',
            }
            convertedMatrix.taxa.set(taxonName, taxon)
          })

          // Process cells - create 2D array structure for backend
          const charactersArray = matrixObject.getCharacters()
          const cellsArray = []

          // For each taxon (row)
          for (
            let taxonIndex = 0;
            taxonIndex < taxaNames.length;
            taxonIndex++
          ) {
            const taxonName = taxaNames[taxonIndex]
            const taxonCells = matrixObject.getCells(taxonName) || []
            const cellRow = []

            // For each character (column)
            for (
              let charIndex = 0;
              charIndex < charactersArray.length;
              charIndex++
            ) {
              const cell = taxonCells[charIndex]

              if (cell !== undefined && cell !== null) {
                // Convert Cell object to string value
                if (typeof cell === 'object' && cell.score !== undefined) {
                  // This is a Cell object, extract the score and ensure it's a string
                  const score = String(cell.score || '?')
                  cellRow.push(score)
                } else if (typeof cell === 'string' && cell.length > 0) {
                  // Already a string, but ensure it's not empty
                  cellRow.push(cell)
                } else {
                  // Convert to string, but handle empty/null values
                  const converted = String(cell)
                  cellRow.push(
                    converted === 'null' ||
                      converted === 'undefined' ||
                      converted === ''
                      ? '?'
                      : converted
                  )
                }
              } else {
                // Empty cell - use missing symbol
                cellRow.push('?')
              }
            }

            // Ensure the row has the correct number of columns
            while (cellRow.length < charactersArray.length) {
              cellRow.push('?')
            }

            cellsArray.push(cellRow)
          }

          // Add the 2D array structure for backend serialization
          convertedMatrix.cellsArray = cellsArray
          parsedMatrix.value = convertedMatrix
        } else {
          uploadErrors.value.general =
            'Failed to parse matrix file. Please check the file format.'
          parsedMatrix.value = null
        }
      } catch (error) {
        console.error('Error parsing matrix file:', error)
        uploadErrors.value.general =
          'Failed to parse matrix file: ' + error.message
        parsedMatrix.value = null
      }
    }

    reader.onerror = function () {
      uploadErrors.value.general = 'Failed to read file'
      parsedMatrix.value = null
    }

    reader.readAsBinaryString(file)
  } catch (error) {
    console.error('Error importing parser:', error)
    uploadErrors.value.general = 'Failed to load matrix parser'
    parsedMatrix.value = null
  }
}

async function handleMergeFileUpload() {
  if (!matrixFileData.value.file) {
    uploadErrors.value.general = 'Please select a file to upload.'
    return
  }

  if (!parsedMatrix.value) {
    uploadErrors.value.general =
      'Please wait for the file to be parsed or select a valid matrix file.'
    return
  }

  isUploading.value = true
  uploadErrors.value = {}

  try {
    // Load taxa and characters stores if not already loaded
    if (!taxaStore.isLoaded) {
      await taxaStore.fetch(projectId)
    }
    if (!charactersStore.isLoaded) {
      await charactersStore.fetchCharactersByProjectId(projectId)
    }

    // Merge the parsed matrix with existing project data
    mergeMatrix(
      parsedMatrix.value,
      matrixFileData.value.otu,
      matrixFileData.value.notes,
      taxaStore.taxa,
      charactersStore.characters
    )

    // Store the actual File object in the FileTransferStore
    fileTransferStore.setMergeFile(matrixFileData.value.file, {
      otu: matrixFileData.value.otu,
      itemNotes: matrixFileData.value.notes,
    })
    // console.log('File stored in FileTransferStore:', matrixFileData.value.file.name, matrixFileData.value.file.size, 'bytes')

    // Store the merge data in sessionStorage to pass to create matrix view
    const mergeData = {
      matrixId: matrixId,
      isEdit: true,
      importedMatrix: {
        // Copy basic properties
        format: parsedMatrix.value.format,
        parameters: parsedMatrix.value.parameters,
        blocks: parsedMatrix.value.blocks,
        // Convert Maps to arrays for JSON serialization
        characters: Array.from(parsedMatrix.value.characters.entries()),
        taxa: Array.from(parsedMatrix.value.taxa.entries()),
        cells: parsedMatrix.value.cellsArray,
      },
      formData: {
        otu: matrixFileData.value.otu,
        itemNotes: matrixFileData.value.notes,
      },
    }

    sessionStorage.setItem('matrixMergeData', JSON.stringify(mergeData))

    // Navigate to create matrix view at step 2 (characters page)
    router.push({
      path: `/myprojects/${projectId}/matrices/create`,
      query: {
        step: '2',
        merge: 'true',
        matrixId: matrixId,
      },
    })
  } catch (error) {
    console.error('Error processing matrix merge:', error)
    uploadErrors.value.general =
      'Failed to process matrix file. Please try again.'
  } finally {
    isUploading.value = false
  }
}

function resetMergeForm() {
  matrixFileData.value.file = null
  matrixFileData.value.notes = ''
  matrixFileData.value.otu = 'genus'
  uploadErrors.value = {}
  parsedMatrix.value = null

  // Clear file input
  const fileInput = document.getElementById(`upload-${matrixId}`)
  if (fileInput) {
    fileInput.value = ''
  }
}

function formatDateWithTimezone(dateString) {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)

    // Format the date with timezone
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }

    return date.toLocaleString('en-US', options)
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString // Fallback to original string
  }
}

function getStatusClass(status) {
  if (!status) return 'status-unknown'

  const normalizedStatus = status.toLowerCase()
  const knownStatuses = ['completed', 'running', 'failed', 'pending']

  if (knownStatuses.includes(normalizedStatus)) {
    return `status-${normalizedStatus}`
  }

  // Return default class for unknown statuses
  return 'status-unknown'
}

function removeDoubleQuote(str) {
  if (str.endsWith('"')) {
    str = str.slice(0, -1)
  }
  if (str.length > 0 && str[0] === '"') {
    return str.slice(1)
  }
  return str
}

function formatText(text) {
  return removeDoubleQuote(text.replace(/(\\r\\n|\\n|\\r)+/g, '<br>'))
}
onMounted(() => {
  if (!documentsStore.isLoaded) {
    documentsStore.fetchDocuments(projectId)
  }
})
</script>
<template>
  <div class="p-2 card shadow matrix-card">
    <div class="title">
      <div class="header">
        {{ matrix.title }} (<i>matrix {{ matrix.matrix_id }}</i
        >)
      </div>
      <div class="buttons">
        <RouterLink
          :to="`/myprojects/${projectId}/matrices/${matrix.matrix_id}/edit`"
          @click.prevent="$router.push({ name: 'MyProjectMatrixEditView', params: { projectId, matrixId: matrix.matrix_id } })"
        >
          <button type="button" class="btn btn-sm btn-secondary pencil-btn">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
        </RouterLink>
        <button
          v-if="canEditMatrix"
          type="button"
          class="btn btn-sm btn-secondary"
          tooltip="Click here to name this matrix, enable streaming, block the scoring, and use various automated features"
          @click="navigateToSettings"
        >
          <i class="fa-solid fa-gear"></i>
        </button>
      </div>
    </div>
    <ul class="nav nav-tabs" id="myTab" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          :class="homeButtonClass"
          id="homeTab"
          data-bs-toggle="tab"
          :data-bs-target="'#home' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="home"
          aria-selected="true"
        >
          Home
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          :data-bs-target="'#download' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="profile"
          aria-selected="false"
        >
          Download
        </button>
      </li>
      <li v-if="canEditMatrix" class="nav-item" role="presentation">
        <button
          class="nav-link"
          data-bs-toggle="tab"
          :data-bs-target="'#merge' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="merge"
          aria-selected="false"
        >
          Merge File
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          :class="buildatreeButtonClass"
          id="buildTab"
          data-bs-toggle="tab"
          :data-bs-target="'#build' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="contact"
          aria-selected="false"
        >
          Tree Analysis at CIPRES
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="tntTab"
          data-bs-toggle="tab"
          :data-bs-target="'#tnt' + matrix.matrix_id"
          type="button"
          role="tab"
          aria-controls="tnt"
          aria-selected="false"
        >
          TNT Analysis
        </button>
      </li>
    </ul>
    <div class="tab-content">
      <div
        :class="homePanelClass"
        :id="'home' + matrix.matrix_id"
        role="tabpanel"
      >
        The matrix contains:
        <div class="description">
          {{ matrix.counts.cell ?? 0 }} scorings;
          {{ matrix.counts.taxa ?? 0 }} taxa;
          {{ matrix.counts.character ?? 0 }} characters;
          {{ matrix.counts.cell_media ?? 0 }} cell images;
          {{ matrix.counts.media_label ?? 0 }} labels attached to cell images;
          {{ matrix.counts.character_media ?? 0 }} character images;
        </div>
        <br />
        <div class="tab-content-buttons">
          <RouterLink
            :to="`/myprojects/${projectId}/matrices/${matrix.matrix_id}/characters`"
            @click.prevent="$router.push({ name: 'MyProjectCharacterEditorView', params: { projectId, matrixId: matrix.matrix_id } })"
          >
            <button type="button" class="btn btn-primary">
              Edit Characters
            </button>
          </RouterLink>
        </div>
      </div>
      <div
        class="tab-pane fade"
        :id="'download' + matrix.matrix_id"
        role="tabpanel"
      >
        <h6>Download options:</h6>
        <div class="downloadOptions">
          <div>
            <label>Format:</label>
            <select v-model="format">
              <option v-for="[format, name] in formats" v-bind:value="format">
                {{ name }}
              </option>
            </select>
          </div>
          <div>
            <label>Partition:</label>
            <select v-model="partitionId">
              <option value="" selected disabled>Entire Matrix</option>
              <option
                v-for="partition in partitions"
                v-bind:value="partition.partition_id"
              >
                Partition: {{ partition.name }}
              </option>
            </select>
          </div>
          <div class="form-check">
            <input
              v-model="notes"
              class="form-check-input"
              type="checkbox"
              value="1"
              id="flexCheckChecked"
              checked
            />
            <label class="form-check-label" for="flexCheckChecked">
              Include Notes
            </label>
          </div>
        </div>
        <em v-if="matrix.counts.continuous_character">
          NEXUS-format downloads are unavailable for this matrix because it
          contains continuous characters.
        </em>
        <br />
        <em v-if="matrix.counts.polymorphoric_cell">
          This matrix contains polymorphic scores for "-" and another state,
          e.g., (-,1). Thus, this matrix will not load in Mesquite.
        </em>
        <br />
        <div class="tab-content-buttons">
          <button
            type="button"
            class="btn btn-primary"
            @click="onDownloadMatrix"
          >
            Download Matrix
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="onDownloadCharacters"
          >
            Download Characters
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="onDownloadOntology"
          >
            Download Ontology
          </button>
        </div>
      </div>
      <div
        v-if="canEditMatrix"
        class="tab-pane fade"
        :id="'merge' + matrix.matrix_id"
        role="tabpanel"
      >
        <h6>Merge a NEXUS or TNT file with this matrix</h6>

        <!-- Error Messages -->
        <div v-if="uploadErrors.general" class="alert alert-danger mb-3">
          {{ uploadErrors.general }}
        </div>

        <div class="merge-file-section">
          <div class="alert alert-secondary mb-3">
            <strong>Note</strong> – your matrix must have character names for
            all the characters and these character names must each be different.
            If this is a file with combined molecular and morphological data, or
            molecular data only, it must be submitted to the Documents area.
          </div>

          <div class="form-group mb-3">
            <label class="form-label">NEXUS or TNT file to add to matrix</label>
            <input
              type="file"
              :id="'upload-' + matrix.matrix_id"
              class="form-control"
              accept=".nex,.nexus,.tnt"
              @change="handleFileChange"
            />
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Operational taxonomic unit</label>
            <select class="form-control" v-model="matrixFileData.otu">
              <option
                v-for="unit in taxonomicUnits"
                :key="unit.value"
                :value="unit.value"
              >
                {{ unit.label }}
              </option>
            </select>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">
              Descriptive text to add to each character and taxon added to the
              project from this file
            </label>
            <textarea
              rows="3"
              class="form-control"
              v-model="matrixFileData.notes"
              placeholder="Optional notes..."
            ></textarea>
          </div>

          <div class="tab-content-buttons">
            <button
              type="button"
              class="btn btn-primary"
              @click="handleMergeFileUpload"
              :disabled="isUploading || !matrixFileData.file"
            >
              <span
                v-if="isUploading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isUploading ? 'Processing...' : 'Review Characters' }}
            </button>
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="resetMergeForm"
              :disabled="isUploading"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      <div
        :class="buildatreePanelClass"
        :id="'build' + matrix.matrix_id"
        role="tabpanel"
      >
        <h6>
          Tree-building options
          <Tooltip
            content="MorphoBank now offers the option to run your matrix without leaving the Web by sending it to the online algorithms at CIPRES. It doesn't matter what computer you are using or where you are in the world.  CIPRES works by notifying you when your job is complete, so please check back on this page below for results. CIPRES will cease service March 31, 2026 and these tools will not be available after then."
          ></Tooltip
          >:
        </h6>
        <p>
          Please try this BETA tool and send any feedback to
          <router-link to="/askus">Contact Support</router-link>
        </p>
        <div class="tab-content">
          <div class="mb-3">
            <p>
              <strong
                >Run {{ matrix.title }} with the following parameters:</strong
              >
            </p>
          </div>
          <div class="form-row mb-3">
            <div class="col-md-6">
              <label class="form-label">Tool:</label>
              <select v-model="tool" class="form-control form-select-custom">
                <option v-for="[tool, name] in tools" v-bind:value="tool">
                  {{ name }}
                </option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label"
                >Job name<b class="red">*&nbsp;</b>
                <Tooltip
                  content="Enter a short name for this job, to make it easy to track over time."
                ></Tooltip
                >:</label
              >
              <input
                type="text"
                v-model="jobName"
                class="form-control"
                :class="{
                  'is-invalid': jobNameShouldValidate && !validateJobName(),
                }"
                @blur="jobNameShouldValidate = true"
                required
              />
            </div>
          </div>
          <div class="form-row mb-3">
            <div class="col-md-9">
              <label class="form-label"
                >Notes for run
                <Tooltip
                  content="You will see these notes displayed in MorphoBank below once your results file returns from CIPRES.  These are not written to your underlying Nexus file."
                ></Tooltip
                >:</label
              >
              <input type="text" v-model="jobNote" class="form-control" />
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <button type="button" class="btn btn-primary" @click="onRun">
                Run
              </button>
            </div>
          </div>
          <div v-if="tool === 'PAUPRAT'" class="read-only">
            The Parsimony Ratchet (Kevin Nixon, 1999) improves the ability to
            find shortest trees during heuristic searches on larget database (it
            is ok to use on small ones too). You can use it to search for a tree
            or tree(s) based on your MorphoBank matrix. Set your parameters
            below and click "Run" and MorphoBank will write the commands for you
            to use the program PAUPRat (Sikes and Lewis, 2001) to execute the
            Parsimony Ratchet on in PAUP* via CIPRES<br />The commands tell
            PAUP* to to this:<br />
            <ol>
              <li>
                Conduct an heuristic search from scratch for a starting tree.
                This will use the Branch Swapping Algorithm that you select.
              </li>
              <li>
                Perform two tree searches for each Ratchet iteration, one in
                chich a subset of your characters is assigned a weight of 2, and
                a second in which all characters are equally weighted. The
                characters to be weighted are chosen randomly.
              </li>
              <li>
                The repeats for the number of iterations or replicates that you
                specify.
              </li>
              <li>
                The shortest trees and related files are returned to you from
                CIPRES here.
              </li>
            </ol>
            <br />You can learn more about the Parsimony Ratchet
            <a
              href="http://onlinelibrary.wiley.com/doi/10.1111/j.1096-0031.1999.tb00277.x/abstract"
              >here</a
            >
            and
            <a
              href="http://www.iab.uaf.edu/people/derek_sikes/PAUPRat_manual.pdf"
              >here</a
            >.<br />Two default parameters are set verbose defaults to "terse"
            and starting seed to 0.
          </div>
          <div v-if="tool === 'MRBAYES_XSEDE'" class="read-only">
            <ul>
              <li>MorphoBank runs Mr Bayes 3.2.7a at CIPRES</li>
              <li>
                Substitution Model: gamma-shaped rate variation with all
                substitution rates equal
              </li>
            </ul>
          </div>
          <div v-if="tool === 'RAXMLHPC8_REST_XSEDE'" class="read-only">
            <ul>
              <li>MorphoBank runs RAxMLHPC v8.1.24 at CIPRES</li>
              <li>
                Phylogenetic tree inference using maximum likelihood/rapid
                bootstrapping
              </li>
            </ul>
          </div>
          <div v-if="tool === 'PAUPRAT'">
            <table>
              <thead>
                <tr>
                  <th>&nbsp;</th>
                  <th>&nbsp;</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    title="This specifies the number of iterations to have PAUP* perform, i.e., the number of replicates that the Ratchet runs."
                  >
                    Number of Iterations:
                  </td>
                  <td
                    title="Select how many characters you want to weight (the weight assigned is '2').  You can either select a defined number of characters or a percentage of characters. <em>For percentages follow the quantity with a '%' sign.</em>  Typically less than ¼ of the characters are weighted."
                  >
                    # or % chars to permute:
                  </td>
                  <td>Branch-swapping algorithm:</td>
                </tr>
                <tr>
                  <td>
                    <input
                      type="number"
                      v-model="jobNumIterations"
                      value="200"
                      title="This specifies the number of iterations to have PAUP* perform, i.e., the number of replicates that the Ratchet runs."
                    />
                  </td>
                  <td>
                    <input
                      type="string"
                      v-model="jobCharsToPermute"
                      title="Select how many characters you want to weight (the weight assigned is '2'). You can either select a defined number of characters or a percentage of characters. For percentages follow the quantity with a '%' sign. Typically less than ¼ of the characters are weighted."
                    />
                  </td>
                  <td>
                    <select v-model="jobBranchSwappingAlgorithm">
                      <option
                        v-for="[
                          jobBranchSwappingAlgorithm,
                          name,
                        ] in jobBranchSwappingAlgorithms"
                        v-bind:value="jobBranchSwappingAlgorithm"
                      >
                        {{ name }}
                      </option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="tool === 'MRBAYES_XSEDE'">
            <div class="red">*required</div>
            <div>
              Matrix contains a Mr Bayes block<b class="red">*&nbsp;&nbsp;</b>
              <label>
                <input
                  type="radio"
                  v-model="mrbayesblockquery"
                  value="1"
                  name="blockRadioGroup"
                />
                Yes
              </label>
              <label class="radio-spacing">
                <input
                  type="radio"
                  v-model="mrbayesblockquery"
                  value="0"
                  name="blockRadioGroup"
                />
                No
              </label>
            </div>
            <div v-if="mrbayesblockquery === '0'">
              Would you like to enter a Mr Bayes block?
              <label>
                <input
                  type="radio"
                  v-model="entermrbayesblock"
                  value="1"
                  name="blockRadioGroup2"
                />
                Yes
              </label>
              <label class="radio-spacing">
                <input
                  type="radio"
                  v-model="entermrbayesblock"
                  value="0"
                  name="blockRadioGroup2"
                />
                No
              </label>
            </div>
            <br />
            <div v-if="mrbayesblockquery === '1'">
              <table>
                <thead>
                  <tr>
                    <th>&nbsp;</th>
                    <th>&nbsp;</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nruns in the MrBayes block of the Nexus file.  If you didn't specify a value for nruns, please leave this field at its default value of 2."
                    >
                      My Mr Bayes block specifies
                    </td>
                    <td
                      title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nruns in the MrBayes block of the Nexus file.  If you didn't specify a value for nruns, please leave this field at its default value of 2."
                    >
                      <input
                        type="number"
                        v-model="nruns_specified"
                        value="2"
                      />
                    </td>
                    <td>nruns</td>
                  </tr>
                  <tr>
                    <td
                      title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nchains in the MrBayes block of the Nexus file.  If you didn't specify a value for nchains, please leave this field at its default value of 4."
                    >
                      My Mr Bayes block specifies
                    </td>
                    <td
                      title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nchains in the MrBayes block of the Nexus file.  If you didn't specify a value for nchains, please leave this field at its default value of 4."
                    >
                      <input
                        type="number"
                        v-model="nchains_specified"
                        value="2"
                      />
                    </td>
                    <td>nchains</td>
                  </tr>
                  <tr>
                    <td>Maximum hours to run<b class="red">*</b></td>
                    <td>
                      <input
                        type="number"
                        v-model="runtime"
                        :class="{ 'is-invalid': !runtime || runtime < 0.1 }"
                        value="4"
                        min="0.01"
                        step="0.1"
                        required
                      />
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="mrbayesblockquery === '0'">
              <div v-if="entermrbayesblock === '1'">
                <textarea
                  v-model="mrbayesblock"
                  class="form-control"
                  :class="{ 'is-invalid': !mrbayesblock }"
                  rows="9"
                  cols="80"
                />
              </div>
              <div v-if="entermrbayesblock === '0'">
                <div>
                  <b>Simple parameters</b>
                </div>
                Outgroup&nbsp;
                <select v-model="set_outgroup">
                  <option v-for="[val, name] in outgroups" v-bind:value="val">
                    {{ name }}
                  </option>
                </select>
                <br /><br />
                <b>Parameters for MCMC</b>
                <table>
                  <tbody>
                    <tr>
                      <td title="">
                        MCMC number of generations<b class="red">*</b>
                      </td>
                      <td title="">
                        <input
                          type="number"
                          v-model="ngenval"
                          class="form-control"
                          :class="{ 'is-invalid': !ngenval || ngenval < 5000 }"
                          min="5000"
                          step="1"
                          value="20000"
                          required
                        />
                      </td>
                    </tr>
                    <tr>
                      <td title="">Number of runs<b class="red">*</b></td>
                      <td title="">
                        <input
                          type="number"
                          v-model="nrunsval"
                          class="form-control"
                          :class="{ 'is-invalid': !nrunsval || nrunsval < 1 }"
                          value="2"
                          required
                        />
                      </td>
                    </tr>
                    <tr>
                      <td title="">Heated chains<b class="red">*</b></td>
                      <td title="">
                        <input
                          type="number"
                          v-model="nchainsval"
                          class="form-control"
                          :class="{
                            'is-invalid': !nchainsval || nchainsval < 1,
                          }"
                          value="4"
                          required
                        />
                      </td>
                    </tr>
                    <tr>
                      <td title="">
                        Sampling frequency<b class="red">*</b>, every
                      </td>
                      <td title="">
                        <input
                          type="number"
                          v-model="samplefreqval"
                          class="form-control"
                          :class="{
                            'is-invalid': !samplefreqval || samplefreqval < 1,
                          }"
                          value="1000"
                          required
                        />
                      </td>
                    </tr>
                    <tr>
                      <td title="">
                        Diagnostic run frequency<b class="red">*</b>, every
                      </td>
                      <td title="">
                        <input
                          type="number"
                          v-model="specify_diagnfreqval"
                          class="form-control"
                          :class="{
                            'is-invalid':
                              !specify_diagnfreqval || specify_diagnfreqval < 1,
                          }"
                          value="5000"
                          required
                        />
                      </td>
                    </tr>
                    <tr>
                      <td title="">Burnin<b class="red">*</b></td>
                      <td title="">
                        <input
                          type="number"
                          v-model="burninfracval"
                          value="0.25"
                          class="form-control"
                          :class="{
                            'is-invalid': !burninfracval || burninfracval < 0,
                          }"
                          min="0"
                          max="1"
                          step="0.01"
                          required
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div v-if="tool === 'RAXMLHPC8_REST_XSEDE'">
            <div class="red">*required</div>
            How many patterns in yuor data set?&nbsp;<input
              type="number"
              v-model="nchar"
            />
            <br />
            Set a name for output files(-n)&nbsp;<input
              type="text"
              v-model="outsuffix"
            />
            <br />
            Enable ML searches under CAT (-F)&nbsp;<input
              type="checkbox"
              v-model="mlsearch_cat"
            />
            <br />
            Outgroup (-o) ()one or more comma-separated outgroups, see comment
            for syntax)&nbsp;<input type="text" v-model="outgroup" />
            <br />
            Specify the number of distinct rate categories (-c)<b class="red"
              >*</b
            >&nbsp;<input type="number" v-model="number_cats" />
            <br />
            Disable Rate Heterogeneity (-V)<b class="red">*</b>&nbsp;<input
              type="checkbox"
              v-model="disable_ratehet"
            />
            <br />
            Supply a tree (Not available when doing rapid bootstrapping, -x)
            (-t)
            <select v-model="treetop">
              <option v-for="[val, name] in treetops" v-bind:value="val">
                {{ name }}
              </option>
            </select>
          </div>
        </div>
        <hr class="bold_hr" />
        <div v-if="currentMatrixJobs?.length > 0">
          <h6><b>Previous runs:</b></h6>
          <div
            v-for="job in currentMatrixJobs"
            :key="job.request_id"
            class="job-card"
          >
            <div class="job-header">
              <div class="job-info">
                <div class="job-title">
                  <strong>{{ job.jobname }}</strong>
                  <span
                    class="job-status"
                    :class="getStatusClass(job.cipres_last_status)"
                  >
                    {{ job.cipres_last_status }}
                  </span>
                  <Tooltip
                    :content="jobstatuses.get(job.cipres_last_status)"
                  ></Tooltip>
                </div>
                <div class="job-details">
                  <span
                    ><strong>Run on:</strong>
                    {{ formatDateWithTimezone(job.created_on) }}</span
                  >
                  <span><strong>Tool:</strong> {{ job.cipres_tool }}</span>
                </div>
              </div>
              <div class="job-actions">
                <button
                  v-if="job.cipres_last_status == 'COMPLETED'"
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="
                    onDownloadJob(
                      job.user_id,
                      job.jobname,
                      job.cipres_job_id,
                      job.request_id,
                      job.cu,
                      job.ck,
                      job.cr,
                      job.ca
                    )
                  "
                >
                  <i class="fa-solid fa-download"></i> Download
                  <Tooltip
                    content="To see the commands MorphoBank sent to CIPRES open the file .nex that CIPRES returned to you."
                  ></Tooltip>
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  @click="onDelete(job.jobname, job.cipres_job_id)"
                >
                  <i class="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </div>
            <div class="job-metadata">
              <div
                v-if="
                  job.notes && (!job.block || job.block.startsWith(BLOCK_BEGIN))
                "
                class="job-notes"
              >
                <strong>Notes:</strong> {{ job.notes }}
              </div>
              <div
                v-if="
                  job.notes && job.block && !job.block.startsWith(BLOCK_BEGIN)
                "
                class="job-notes"
              >
                <strong>Notes:</strong> {{ job.notes + SEP + job.block }}
              </div>
              <div v-if="job.cipres_settings" class="job-parameters">
                <strong>Parameters:</strong> {{ job.cipres_settings }}
              </div>
              <div
                v-if="
                  job.cipres_tool == 'MRBAYES_XSEDE' &&
                  job.block &&
                  job.block.startsWith(BLOCK_BEGIN)
                "
                class="job-notes"
              >
                <strong>MRBAYES block:</strong> {{ job.block }}
              </div>
              <div v-if="job.errors" class="read-only">
                <strong>Errors from job submission/analysis:</strong>
                <div v-html="formatText(job.errors)"></div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-runs-message">
          <i class="fa-solid fa-info-circle"></i>
          No previous runs found.
        </div>
      </div>
      <div class="tab-pane fade" :id="'tnt' + matrix.matrix_id" role="tabpanel">
        <TntAnalysisComp :projectId="projectId" :matrixId="matrixId.toString()" />
      </div>
    </div>
  </div>
</template>
<style scoped>
.matrix-card {
  margin-bottom: 12px;
}

.matrix-card .title {
  display: flex;
  font-weight: bold;
  margin-bottom: 8px;
}
.matrix-card .title .header {
  display: flex;
  flex: 1;
  margin: auto;
  text-overflow: ellipsis;
}

.matrix-card .title .buttons {
  display: flex;
  gap: 7px;
}

/* Orange themed pencil button */
.pencil-btn {
  background-color: var(--theme-orange, #ef782f) !important;
  border-color: var(--theme-orange, #ef782f) !important;
  color: white !important;
}

.pencil-btn:hover {
  background-color: var(--theme-orange-hover, #d9682a) !important;
  border-color: var(--theme-orange-hover, #d9682a) !important;
  color: white !important;
}

.pencil-btn:focus,
.pencil-btn:active {
  background-color: var(--theme-orange-active, #c35a25) !important;
  border-color: var(--theme-orange-active, #c35a25) !important;
  color: white !important;
  box-shadow: 0 0 0 0.2rem rgba(239, 120, 47, 0.25) !important;
}

.matrix-card .tab-content {
  padding: 20px;
}

.matrix-card .description {
  padding: 10px;
}

.tab-content-buttons {
  display: flex;
  gap: 8px;
}

.merge-file-section {
  max-width: 600px;
}

.merge-upload-section {
  margin-left: 20px;
  padding: 15px;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  background-color: #f8f9fa;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}

.downloadOptions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.downloadOptions > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.downloadOptions label {
  min-width: 80px;
  font-weight: 500;
}

.hidden {
  visibility: hidden;
}

.red {
  color: red;
}

.read-only {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
}

textarea {
  width: 780px;
  height: 150px;
}

input[type='number'] {
  width: 102px;
}

th,
td {
  padding-right: 25px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .col-md-3,
.form-row .col-md-4,
.form-row .col-md-6,
.form-row .col-md-9 {
  flex: 1;
}

.form-row .col-md-3 {
  flex: 0 0 25%;
}

.form-row .col-md-4 {
  flex: 0 0 33.333%;
}

.form-row .col-md-6 {
  flex: 0 0 50%;
}

.form-row .col-md-9 {
  flex: 0 0 75%;
}

.bold_hr {
  text-align: left;
  margin-left: 0;
  height: 5px;
  background-color: silver;
}

/* Previous runs styling */
.previous-runs-container {
  margin-top: 20px;
}

.job-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.job-info {
  flex: 1;
}

.job-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.job-title strong {
  font-size: 1.1em;
  color: #333;
}

.job-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
  text-transform: uppercase;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-running {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-failed {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-pending {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.status-unknown {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.job-details {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 0.9em;
}

.job-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.job-metadata {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.job-notes,
.job-parameters {
  margin-bottom: 8px;
  color: #555;
  font-size: 0.9em;
  line-height: 1.4;
}

.job-notes:last-child,
.job-parameters:last-child {
  margin-bottom: 0;
}

.no-runs-message {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-style: italic;
}

.no-runs-message i {
  margin-right: 8px;
  color: #999;
}

.radio-spacing {
  margin-left: 20px;
}

.input-cell {
  width: 200px;
}


</style>
