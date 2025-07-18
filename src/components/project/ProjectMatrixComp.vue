<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { logDownload, DOWNLOAD_TYPES } from '@/lib/analytics.js'

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
const notes = ref(true)
const format = ref(formats.keys()?.next()?.value)
const partitionId = ref('')

const projectId = route.params.id
const matrixId = props.matrix.matrix_id
const taxonNames = props.matrix.taxonNames
const baseUrl = `${
  import.meta.env.VITE_API_URL
}/projects/${projectId}/matrices/${matrixId}`

const tools = new Map()
tools.set('PAUPRAT', 'PAUP Ratchet')
tools.set('MRBAYES_XSEDE', 'Mr Bayes')
const toolvalue = route.query.toolvalue
let tool = toolvalue == null? ref(tools.keys()?.next()?.value) : toolvalue
const jobName = ref('')
const jobNote = ref('')

const jobNumIterations = ref(200)
const jobCharsToPermute = ref('')
const jobBranchSwappingAlgorithms = new Map()
jobBranchSwappingAlgorithms.set('tbr', 'tree bisection and reconnection')
jobBranchSwappingAlgorithms.set('spr', 'subtree pruning and grafting')
jobBranchSwappingAlgorithms.set('nni', 'nearest neighbor interchange')
const jobBranchSwappingAlgorithm = ref(jobBranchSwappingAlgorithms.keys()?.next()?.value)

const mrbayesblockquery = ref('1')
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

const currentMatrixJobs = props.jobs?.filter(job => job.matrix_id == matrixId)
const refresh = route.query.refresh
const refreshId = route.query.refreshid
const homeButtonClass = (refresh != 'true')? 'nav-link active' : ((refresh == 'true' && refreshId == matrixId)? 'nav-link' : 'nav-link active')
const buildatreeButtonClass = (refresh == 'true' && refreshId == matrixId)? 'nav-link active' : 'nav-link'
const homePanelClass = (refresh != 'true')? 'tab-pane fade show active' : ((refresh == 'true' && refreshId == matrixId)? 'tab-pane fade' : 'tab-pane fade show active')
const buildatreePanelClass = (refresh == 'true' && refreshId == matrixId)? 'tab-pane fade show active' : 'tab-pane fade'

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
  logDownload({ project_id: projectStore.project_id, download_type: DOWNLOAD_TYPES.MATRIX, row_id: matrixId })
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
  logDownload({ project_id: projectStore.project_id, download_type: DOWNLOAD_TYPES.MATRIX, row_id: matrixId })
}

async function onDownloadOntology() {
  const url = new URL(`${baseUrl}/download/ontology`)
  window.location.href = url
  logDownload({ project_id: projectId, download_type: DOWNLOAD_TYPES.MATRIX, row_id: matrixId })
}

async function toggleMatrixStreaming() {
  const url = new URL(`${baseUrl}/setPreference`)
  const value = !matrix.preferences?.ENABLE_STREAMING | 0
  const response = await axios.post(url, {
    name: 'ENABLE_STREAMING',
    value: value,
  })
  if (response.status == 200) {
    matrix.preferences.ENABLE_STREAMING = value
  } else {
    alert(response.data?.message || 'Failed to set preferences')
  }
}

async function onRun() {
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
        if (jobCharsToPermute.value ) {
          searchParams.append('jobCharsToPermute', jobCharsToPermute.value)
        }
        if (jobBranchSwappingAlgorithm.value ) {
          searchParams.append('jobBranchSwappingAlgorithm', jobBranchSwappingAlgorithm.value)
        }
      }
      else if (tool.value == 'MRBAYES_XSEDE') {
        searchParams.append('mrbayesblockquery', mrbayesblockquery.value)
        if (mrbayesblockquery.value == '1') {
          searchParams.append('nruns_specified', nruns_specified.value)
          searchParams.append('nchains_specified', nchains_specified.value)
          searchParams.append('runtime', runtime.value)
        }
        if (mrbayesblockquery.value == '0') {
          if (set_outgroup != '') {
            searchParams.append('set_outgroup', set_outgroup.value)
          }
          searchParams.append('ngenval', ngenval.value)
          searchParams.append('nrunsval', nrunsval.value)
          searchParams.append('nchainsval', nchainsval.value)
          searchParams.append('samplefreqval', samplefreqval.value)
          searchParams.append('specify_diagnfreqval', specify_diagnfreqval.value)
          searchParams.append('burninfracval', burninfracval.value)
        }
      }
      sendCipresRequest(url)
}

async function sendCipresRequest(url) {
      const response = await axios.post(url)
      const msg = response.data?.message || 'Failed to submit job to CIPRES'
      alert(msg)
      if (!msg.includes('fail') && !msg.includes('Fail')) {
        let urlNew = window.location.href    
        if (urlNew.indexOf('?') > -1){
          if (urlNew.indexOf('refresh=true') < 0)
            urlNew += '&refresh=true&refreshid=' + matrixId + "&toolvalue=" + tool.value
        } else {
          urlNew += '?refresh=true&refreshid=' + matrixId + "&toolvalue=" + tool.value
        }
        window.location.href = urlNew
      }
}

async function onDelete(jobName, cipresJobId) {
      const url = new URL(`${baseUrl}/deleteJob`)
      const searchParams = url.searchParams
      searchParams.append('jobName', jobName)
      searchParams.append('cipresJobId', cipresJobId)
      sendCipresRequest(url)
}

async function onDownloadJob(userId, jobName, cipresJobId, requestId, cu, ck, cr, ca) {
      const cipresURL= `${cu}/job/${ca}/${cipresJobId}/outputbyname/mbank_X${matrixId}_${userId}_${jobName}.zip`
      await onDownloadJobResults(cipresURL, `mbank_X${matrixId}_${userId}_${jobName}.zip`, ck, cr)
      // logDownload({ project_id: projectId, download_type: DOWNLOAD_TYPES.CIPRES, row_id: requestId })
}

async function onDownloadJobResults(url, filename, ck, cr) {
  try {
    const response = await fetch(url,
        {
          headers: {
            'cipres-appkey':`${ck}`,
            'Authorization': `Basic ${cr}`
          },
        }
    )
 
    if (!response.ok)
    {
      throw new Error(`Failed to download results: ${response.status}`)
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
    alert("Failed to download results for " + (filename || documentUrl.split('/').pop()))
  }
}

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
          target="_blank"
        >
          <button type="button" class="btn btn-sm btn-primary">Open</button>
        </RouterLink>
        <button
          v-if="canEditMatrix"
          type="button"
          class="btn btn-sm btn-secondary"
          tooltip="Click here to name this matrix, block the scoring, and use various automated features"
        >
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-sm btn-secondary dropdown-toggle"
            data-bs-toggle="dropdown"
          >
            <i class="fa-solid fa-gear"></i>
          </button>
          <div class="dropdown-menu">
            <h6 class="dropdown-header">Settings:</h6>
            <div class="dropdown-divider"></div>
            <button
              type="button"
              class="dropdown-item"
              @click="toggleMatrixStreaming"
            >
              <i
                class="fa-solid fa-check"
                :class="{ hidden: !matrix.preferences?.ENABLE_STREAMING }"
              ></i>
              Enable Streaming
            </button>
          </div>
        </div>
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
          Build a Tree
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
        <RouterLink
          :to="`/myprojects/${projectId}/matrices/${matrix.matrix_id}/characters`"
          target="_blank"
        >
          <button type="button" class="btn btn-sm btn-secondary">
            Edit Characters
          </button>
        </RouterLink>
      </div>
      <!--
      <div
        v-if="refresh != 'true'"
        class="tab-pane fade show active"
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
        <RouterLink
          :to="`/myprojects/${projectId}/matrices/${matrix.matrix_id}/characters`"
          target="_blank"
        >
          <button type="button" class="btn btn-sm btn-secondary">
            Edit Characters
          </button>
        </RouterLink>
      </div>
      -->
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
            class="btn btn-sm btn-secondary"
            @click="onDownloadMatrix"
          >
            Download Matrix
          </button>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            @click="onDownloadCharacters"
          >
            Download Characters
          </button>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            @click="onDownloadOntology"
          >
            Download Ontology
          </button>
        </div>
      </div>
      <div
        :class="buildatreePanelClass"
        :id="'build' + matrix.matrix_id"
        role="tabpanel"
      >
        <!-- TODO(kenzley): Create the text when working on the CIPRES integration. -->
        <h6 title="MorphoBank now offers the option to run your matrix without leaving the Web by sending it to the online algorithms at CIPRES. It doesn’t matter what computer you are using or where you are in the world.  CIPRES works by notifying you when your job is complete, so please check back on this page below for results.">Tree-building options:</h6>
        <h6>Please try this BETA tool and send any feedback to Contact Support</h6>
        <div class="tab-content">
          <div> 
            Run <b>{{ matrix.title }}</b> with
            <select v-model="tool">
              <option v-for="[tool, name] in tools" v-bind:value="tool">
                {{ name }}
              </option>
            </select>
            Job name: <input type="text" v-model="jobName" title="Enter a short name for this job, to make it easy to track over time."/>
          </div>
          <div>
            Notes for run: <input type="text" v-model="jobNote" size=54 title="You will see these notes displayed in MorphoBank below once your results file returns from CIPRES.  These are not written to your underlying Nexus file."/>&nbsp;
            <button
              type="button"
              class="btn btn-sm btn-secondary"
              @click="onRun">
              Run 
            </button> 
          </div>
          <div v-if="tool === 'PAUPRAT'" class="read-only">
             The Parsimony Ratchet (Kevin Nixon, 1999) improves the ability to find shortest trees during heuristic searches on larget database (it is ok to use on small ones too). You can use it to search for a tree or tree(s) based on your MorphoBank matrix. Set your parameters below and click "Run" and MorphoBank will write the commands for you to use the program PAUPRat (Sikes and Lewis, 2001) to execute the Parsimony Ratchet on in PAUP* via CIPRES<br>The commands tell PAUP* to to this:<br>
           <ol>
             <li>Conduct an heuristic search from scratch for a starting tree. This will use the Branch Swapping Algorithm that you select.</li>
             <li>Perform two tree searches for each Ratchet iteration, one in chich a subset of your characters is assigned a weight of 2, and a second in which all characters are equally weighted. The characters to be weighted are chosen randomly.</li>
             <li>The repeats for the number of iterations or replicates that you specify.</li>
             <li>The shortest trees and related files are returned to you from CIPRES here.</li>
           </ol>
           <br>You can learn more about the Parsimony Ratchet <a href="http://onlinelibrary.wiley.com/doi/10.1111/j.1096-0031.1999.tb00277.x/abstract">here</a> and <a href="http://www.iab.uaf.edu/people/derek_sikes/PAUPRat_manual.pdf">here</a>.<br>Two default parameters are set verbose defaults to "terse" and starting seed to 0.
          </div>
          <div v-if="tool === 'MRBAYES_XSEDE'" class="read-only">
           <ul>
             <li>MorphoBank runs Mr Bayes 3.2.7a at CIPRES</li>
             <li>Substitution Model: gamma-shaped rate variation with all substitution rates equal</li>
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
                <td title="This specifies the number of iterations to have PAUP* perform, i.e., the number of replicates that the Ratchet runs.">Number of Iterations:</td>
                <td title="Select how many characters you want to weight (the weight assigned is “2”).  You can either select a defined number of characters or a percentage of characters. <em>For percentages follow the quantity with a '%' sign.</em>  Typically less than ¼ of the characters are weighted."># or % chars to permute:</td>
                <td>Branch-swapping algorithm:</td>
              </tr>
              <tr>
                <td><input type="number" v-model="jobNumIterations" value=200 title="This specifies the number of iterations to have PAUP* perform, i.e., the number of replicates that the Ratchet runs."/></td>
                <td>
                  <input type="string" v-model="jobCharsToPermute" title="Select how many characters you want to weight (the weight assigned is “2”).  You can either select a defined number of characters or a percentage of characters. <em>For percentages follow the quantity with a '%' sign.</em>  Typically less than ¼ of the characters are weighted."/>
                </td>
                <td>
                  <select v-model="jobBranchSwappingAlgorithm">
                    <option v-for="[jobBranchSwappingAlgorithm, name] in jobBranchSwappingAlgorithms" v-bind:value="jobBranchSwappingAlgorithm">
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
                <input type="radio" v-model="mrbayesblockquery" value="1" name="blockRadioGroup">
                Yes 
              </label>
              <label>
                <input type="radio" v-model="mrbayesblockquery" value="0" name="blockRadioGroup">
                No 
              </label>
            </div>
            <div v-if="mrbayesblockquery === '1'">
              <table>
                <thead>
                  <tr>
                    <th>&nbsp;</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nruns in the MrBayes block of the Nexus file.  If you didn't specify a value for nruns, please leave this field at its default value of 2.">My Mr Bayes blcok specifies</td>
                    <td title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nruns in the MrBayes block of the Nexus file.  If you didn't specify a value for nruns, please leave this field at its default value of 2."><input type="number" v-model="nruns_specified" value=2 /> nruns</td>
                  </tr>
                  <tr>
                    <td title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nchains in the MrBayes block of the Nexus file.  If you didn't specify a value for nchains, please leave this field at its default value of 4.">My Mr Bayes blcok specifies</td>
                    <td title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nchains in the MrBayes block of the Nexus file.  If you didn't specify a value for nchains, please leave this field at its default value of 4."><input type="number" v-model="nchains_specified" value=2 /> nchains</td>
                  </tr>
                  <tr>
                    <td>Maximum hours to run<b class="red">*</b></td>
                    <td><input type="number" v-model="runtime" value=4 /></td>
                  </tr>
                </tbody>
              </table>
              <!--
              My Mr Bayes blcok specifies&nbsp;&nbsp;<input type="number" v-model="nruns_specified" value=2 title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nruns in the MrBayes block of the Nexus file.  If you didn't specify a value for nruns, please leave this field at its default value of 2."/> nruns<br>
              My Mr Bayes blcok specifies&nbsp;&nbsp;<input type="number" v-model="nchains_specified" value=4 title="The values entered for nruns and nchains influence the number of cpu's that can be used in parallel.  Please enter the value you specified for nchains in the MrBayes block of the Nexus file.  If you didn't specify a value for nchains, please leave this field at its default value of 4."/> nchains<br>
              Maximum hours to run<b class="red">*</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="number" v-model="runtime" value=4 />
              -->
            </div>
            <div v-if="mrbayesblockquery === '0'">
              <div>
                <b>Simple parameters</b>
              </div>
              Outgroup&nbsp;
              <select v-model="set_outgroup">
                <option v-for="[val, name] in outgroups" v-bind:value="val">
                  {{ name }}
                </option>
              </select>
              <br><br>
              <b>Parameters for MCMC</b>
              <table>
                <tbody>
                  <tr>
                    <td title="">MCMC number of generations<b class="red">*</b></td>
                    <td title=""><input type="number" v-model="ngenval" min="5000" stop="1" value=20000 /></td>
                  </tr>
                  <tr>
                    <td title="">Number of runs<b class="red">*</b></td>
                    <td title=""><input type="number" v-model="nrunsval" value=2 /></td>
                  </tr>
                  <tr>
                    <td title="">Heated chains<b class="red">*</b></td>
                    <td title=""><input type="number" v-model="nchainsval" value=4 /></td>
                  </tr>
                  <tr>
                    <td title="">Sampling frequency<b class="red">*</b>, every</td>
                    <td title=""><input type="number" v-model="samplefreqval" value=1000 /></td>
                  </tr>
                  <tr>
                    <td title="">Diagnostic run frequency<b class="red">*</b>, every</td>
                    <td title=""><input type="number" v-model="specify_diagnfreqval" value=5000 /></td>
                  </tr>
                  <tr>
                    <td title="">Burnin<b class="red">*</b></td>
                    <td title=""><input type="number" v-model="burninfracval" value=0.25 min="0" max="1" step="0.01" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <hr class="bold_hr" />
        <div v-if="currentMatrixJobs?.length > 0">
          <h6><b>Previous runs:</b></h6>
          <div v-for="job in currentMatrixJobs">
             <div v-if="job.cipres_tool == tool" style="display: flex; justify-content: space-between; align-items: center;">
                <p><b>Job name</b>:{{ job.jobname }} <b>Run on</b>: {{ job.created_on }} <b>Tool</b>: {{ job.cipres_tool }} <b>Status</b>: {{ job.cipres_last_status }}</p>
                <p><button v-if="job.cipres_last_status == 'COMPLETED'" type="button" class="btn btn-sm btn-secondary" title="To see the commands MorphoBank sent to CIPRES open the file .nex that CIPRES returned to you." @click="onDownloadJob(job.user_id, job.jobname, job.cipres_job_id, job.request_id, job.cu, job.ck, job.cr, job.ca)">Download</button>
                <button type="button" class="btn btn-sm btn-primary" @click="onDelete(job.jobname, job.cipres_job_id)">Delete</button></p>
             </div>
             <div v-if="job.cipres_tool == tool">
                <b>Notes</b>: {{ job.notes }}<br>
                <b>Parameters</b>: {{ job.cipres_settings }}
                <hr/>
             </div>
          </div>
        </div>
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

.hidden {
  visibility: hidden;
}

.red {
  color: red;
}

.read-only {
  background-color: silver;
}

textarea {
  width: 580px;
  height: 150px;
}
input[type='number']{
    width: 75px;
} 
th, td {
  padding-right: 25px;
}
.bold_hr {
    text-align:left;
    margin-left:0;
    height:5px;
    background-color: silver;
}
</style>


