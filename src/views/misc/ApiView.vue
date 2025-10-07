<template>
  <div class="api">
    <h1>MorphoBank API</h1>
    <div>
      The MorphoBank public API supports HTTP GET requests for published
      resources. The API is under development and currently supports a single
      List command to provide lists of:
      <br /><br />
      <b>
        All published projects<br />
        Media by project<br />
        Taxonomy by project
      </b>
    </div>
    <br />
    <h2>Using the API</h2>
    <div>
      All API functions are accessed using URLs in the form
      <blockquote class="ms-5">
        <b>
          {{ apiService.buildUrl("/service/[command]/[resourcetype]?[url-encoded parameter list]") }}
        </b>
      </blockquote>
    </div>
    <div>
      where <b>[command]</b> is an API function and <b>[resource type]</b> is
      one of the following: PublishedProjects, ProjectMedia, ProjectTaxonomy.
      <b>[url-encoded parameter list]</b> is an HTTP query string containing
      command options.
    </div>
    <div>
      The API presently includes a single command, List, that comprehensive
      lists of published MorphoBank data by project.
    </div>
    <br />
    <h2>The API response</h2>
    <div>
      The API List command will return a JSON object similar to this one:
    </div>
    <pre><code>{{ apiResponseExample }}</code></pre>
    <div>
      If the request was successful the <b>status</b> property will be set to
      ok, otherwise it will be set to err. When an error occurs the
      <b>error</b> property will include a description of the error. The
      <b>totalResults</b> property will indicate the total number of resources
      found. The <b>parameters</b> object includes a summary of any parameters
      passed to the command.
    </div>
    <div>
      The results property, contains a list of JSON objects representing each
      returned resource.
    </div>
    <br />
    <h1>Examples</h1>
    <h2>Return a list of all published MorphoBank projects</h2>
    <blockquote>
      <b>{{ apiService.buildUrl('/service/List/PublishedProjects') }}</b>
    </blockquote>
    <pre><code>{{ publishedProjectsExample }}</code></pre>
    <br />
    <h2>Return a list of project taxonomy</h2>
    <blockquote>
      <b
        >{{ apiService.buildUrl('/service/List/ProjectTaxonomy?project_id=44') }}</b
      >
    </blockquote>
    <div>
      ProjectTaxonomy requires the following parameter:<br />
      <b>project_id</b> is the unique, numberic identifier of the project to
      find media for
    </div>
    <pre><code>{{ projectTaxonomyExample }}</code></pre>
    <br />
    <h2>Return a list of project media</h2>
    <blockquote>
      <b>{{ apiService.buildUrl('/service/List/ProjectMedia?project_id=44') }}</b>
    </blockquote>
    <div>
      ProjectMedia requires the following parameter:<br />
      <b>project_id</b> is the unique, numberic identifier of the project to
      find media for
    </div>
    <pre><code>{{ projectMediaExample }}</code></pre>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { apiService } from '@/services/apiService.js'

// Get the API base URL from environment variable
const apiBaseUrl = computed(() => {
  return apiService.buildUrl('') || 'https://morphobank.org/services'
})

const frontendBaseUrl = computed(() => {
  return import.meta.env.VITE_HOST || 'https://morphobank.org'
})

// Computed properties for JSON examples with dynamic URLs
const apiResponseExample = computed(() => {
  return `{		
    "ok": true,
    "totalResults": 305,
    "parameters": {
        "project_id": "44"
    },
    "results": [
        {
            "media_id": "31",
            "view": "adenostyle",
            "taxon_id": "313",
            "taxonomy": "Parasiro minor",
            "specimen_id": "25",
            "specimen": "Parasiro minor (MHNG)",
            "is_copyrighted": "Yes",
            "copyright_permission": "Permission to use media on MorphoBank granted by copyright holder",
            "copyright_license": "Attribution- CC BY-NC-SA - reuse here and applied to future uses but noncommercial",
            "copyright_holder": "Gonzalo Giribet",
            "notes": "Image by Gonzalo Giribet\\r\\nImage edited by Jessica Tupper",
            "web_source": "",
            "web_source_description": "",
            "citation": "",
            "url": "${frontendBaseUrl.value}/project/44/media/31"
        },
        ...and 305 more...
    ]
}`
})

const publishedProjectsExample = computed(() => {
  return `{
  
    "ok": true,
    "status": "ok",
    "totalResults": 515,
    "results": [
        {
            "project_id": "44",
            "name": "New genus of cyphophthalmid from the Iberian Peninsula with a phylogenetic analysis of the Sironidae (Arachnida: Opiliones: Cyphophthalmi) and a SEM database of external morphology",
            "media_count": 309,
            "taxonomy_count": 30,
            "matrices_count": 1,
            "url": "${frontendBaseUrl.value}/project/44/overview"
        },
        {
            "project_id": "45",
            "name": "Cretaceous Myliobatids from Mali",
            "media_count": 187,
            "taxonomy_count": 55,
            "matrices_count": 1,
            "url": "${frontendBaseUrl.value}/project/45/overview"
        },
        ...and 513 more...
    ]
}`
})

const projectTaxonomyExample = computed(() => {
  return `{

    "ok": true,
    "status": "ok",
    "totalResults": 30,
    "parameters": {
        "project_id": "44"
    },
    "results": [
        {
            "taxon_id": "300",
            "is_extinct": "0",
            "genus": "Stylocellus",
            "specific_epithet": "globosus",
            "supraspecific_clade": "",
            "higher_taxon_kingdom": "",
            "higher_taxon_phylum": "",
            "higher_taxon_class": "",
            "higher_taxon_subclass": "",
            "higher_taxon_infraclass": "",
            "higher_taxon_cohort": "",
            "higher_taxon_superorder": "",
            "higher_taxon_order": "",
            "higher_taxon_suborder": "",
            "higher_taxon_infraorder": "",
            "higher_taxon_superfamily": "",
            "higher_taxon_family": "",
            "higher_taxon_subfamily": "",
            "higher_taxon_tribe": "",
            "higher_taxon_subtribe": "",
            "subgenus": "",
            "subspecific_epithet": "",
            "scientific_name_author": "",
            "scientific_name_year": "0",
            "use_parens_for_author": "0",
            "notes": "",
            "scientific_name": "Stylocellus globosus",
            "usage": {
                "total": 17,
                "media": 15,
                "specimens": "1",
                "bibliographic_references": "0",
                "partitions": "0",
                "matrices": "1"
            },
            "citation": ""
        },
        ...and 29 more...
    ]
}`
})

const projectMediaExample = computed(() => {
  return `{

    "ok": true,
    "status": "ok",
    "totalResults": 305,
    "parameters": {
        "project_id": "44"
    },
    "results": [
        {
            "media_id": "31",
            "view": "adenostyle",
            "taxon_id": "313",
            "taxonomy": "Parasiro minor",
            "specimen_id": "25",
            "specimen": "Parasiro minor (MHNG)",
            "is_copyrighted": "Yes",
            "copyright_permission": "Permission to use media on MorphoBank granted by copyright holder",
            "copyright_license": "Attribution- CC BY-NC-SA - reuse here and applied to future uses but noncommercial",
            "copyright_holder": "Gonzalo Giribet",
            "notes": "Image by Gonzalo Giribet\\r\\nImage edited by Jessica Tupper",
            "web_source": "",
            "web_source_description": "",
            "citation": "",
            "url": "${frontendBaseUrl.value}/project/44/media/31"
        }
      ...and 304 more...
    ]
}`
})
</script>

<style scoped>
.api pre {
  background-color: #ededed;
  border: 2px solid #dedede;
  padding: 20px;
  overflow: auto;
}
</style>
