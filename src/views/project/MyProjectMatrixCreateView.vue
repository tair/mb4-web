<script setup>
import { useRoute } from 'vue-router'

import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'

const route = useRoute()
const projectId = route.params.id

async function uploadMatrix(event) {
  const parser = await import('@/lib/matrix-parser/index.ts')
  const input = event.target
  debugger;
  if (input.files == null || input.files.length == 0) {
    return;
  }

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    const matrixObject = parser.parseMatrixFile(reader.result);
    console.log(matrixObject);
  };

  reader.onerror = function () {
    console.log(reader.error);
  };

  reader.readAsBinaryString(file);
}

</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    basePath="myprojects"
    itemName="matrices"
  >
    <div class="nav-link mb-1 d-flex fw-bold small m-0 p-0 mb-3">
      <i class="bi bi-chevron-double-left me-1"></i>
      <a class="nav-link m-0 p-0" @click="$router.go(-1)">Back</a>
    </div>
    <div>
      <form>
        <div class="form-group">
          <label for="matrix-title">Title</label>
          <input type="email" class="form-control" id="matrix-title" />
        </div>
        <div class="form-group">
          <label for="matrix-notes">Notes</label>
          <textarea class="form-control" id="matrix-notes"></textarea>
        </div>
        <div class="form-group">
          <label for="matrix-notes">Operational taxonomic unit</label>
          <select name="otu" class="form-control">
            <option value="supraspecific_clade">Supraspecific Clade</option>
            <option value="higher_taxon_class">Class</option>
            <option value="higher_taxon_subclass">Subclass</option>
            <option value="higher_taxon_order">Order</option>
            <option value="higher_taxon_superfamily">Superfamily</option>
            <option value="higher_taxon_family">Family</option>
            <option value="higher_taxon_subfamily">Subfamily</option>
            <option value="genus" selected="selected">Genus</option>
            <option value="specific_epithet">Species</option>
            <option value="subspecific_epithet">Subspecies</option>
          </select>
        </div>
        <div class="form-group">
          <label for="matrix-notes">Publishing Status</label>
          <select name="published" class="form-control">
            <option value="0">Publish when project is published</option>
            <option value="1">Never publish to project</option>
          </select>
        </div>

        <fieldset class="form-group border p-3">
          <legend class="w-auto px-2">
            Upload an existing NEXUS or TNT file as the basis of your matrix
          </legend>
          <p>
            Note - your matrix must have character names for all the characters
            and these character names must each be different. If this is a file
            with combined molecular and morphological data, or molecular data
            only, it must be submitted to the Documents area.
          </p>
          <div class="form-group">
            <label for="matrix-notes">NEXUS or TNT file to add to matrix</label>
            <input type="file" name="upload" class="form-control" @change="uploadMatrix"/>
          </div>
          <div class="form-group">
            <label for="matrix-notes"
              >Descriptive text to add to each character and taxon added to the
              project from this file</label
            >
            <textarea class="form-control" id="item-notes"></textarea>
          </div>
        </fieldset>
        <button type="submit" class="btn btn-primary">Create</button>
        <button type="reset" class="btn btn-secondary">Cancel</button>
      </form>
    </div>
  </ProjectContainerComp>
</template>
<style scoped>
.form-group legend {
  float: none;
  font-size: inherit;
}
</style>
