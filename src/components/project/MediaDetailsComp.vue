<script setup>
import { toDateString } from '@/utils/date'
import Tooltip from '@/components/main/Tooltip.vue'

const props = defineProps({
  media_file: {
    type: Object,
  },
})

const viewTooltipText = "Project download and view statistics are available since August 2012.  Views and downloads pre August 2012 are not reflected in the statistics."

function buildImageProps(mediaObj, type) {
  try {
    // console.log(mediaObj)
    let media = mediaObj
    if (type) media = mediaObj[type]

    if (!media.HASH || !media.MAGIC || !media.FILENAME) return null

    const url =
      `https://morphobank.org/media/morphobank3/` +
      `images/${media.HASH}/${media.MAGIC}_${media.FILENAME}`

    return url
  } catch (e) {
    console.log('VV: ' + mediaObj)
    console.error(e)
    return null
  }
}

function getAncestorMessage(mediaObj) {
  let message = 'This media file was first entered in MorphoBank as M' + mediaObj.ancestor.media_id + ' in P' + mediaObj.ancestor.project_id
  if (mediaObj.ancestor.deleted) {
    message += '. This project which the media file was first entered has since been deleted.'
  }
  return message
}

function getSibilingMessage(mediaObj) {
  let message = "It has also been used in: "
  message += mediaObj.ancestor.child_siblings.map(obj => `P${obj.project_id} as M${obj.media_id}`).join(', ');
  message += "."
  return message
}

function getHitsMessage(mediaObj) {
  let message =" This media record has been viewed " + mediaObj.hits + " time" + ((mediaObj.hits == 1) ? "" : "s")
  if (mediaObj.downloads) {
    message += " and downloaded " + mediaObj.downloads + " time" + ((mediaObj.downloads == 1) ? "" : "s");
  }
  return message
}
</script>

<template>
  <div v-if="!media_file">Please select a media from the list.</div>

  <div v-else class="row p-2">
    <div class="col">
      <div class="card shadow">
        <img
          :src="buildImageProps(media_file.media['medium'])"
          :style="{
            width: media_file.media['medium'].WIDTH + 'px',
            height: media_file.media['medium'].HEIGHT + 'px',
            backgroundSize: '20px',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(' + '/images/loader.png' + ')',
            backgroundPosition: '10px 10px',
          }"
          class="card-img-top"
        />

        <div class="card-body">
          <h5 class="card-title">Original filename: Amostra_3.15_foto4.jpg</h5>
          <div class="card-text">
            <div class="nav">
              <a class="nav-link" href="#">Zoom</a>
              <a class="nav-link" href="#">Download</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col">
      <div>
        <strong>Morphobank media number</strong>
        <p>{{ 'M' + media_file.media_id }}</p>
      </div>
      <div>
        <strong>Taxonomic name</strong>
        <p v-html="media_file.taxa_name"></p>
      </div>
      <div v-if="media_file.specimen_name">
        <strong>Specimen</strong>
        <p v-html="media_file.specimen_name"></p>
      </div>
      <div v-if="media_file.specimen_notes">
        <strong>Specimen notes</strong>
        <p v-html="media_file.specimen_notes"></p>
      </div>
      <div v-if="media_file.view_name">
        <strong>View</strong>
        <p>{{ media_file.view_name }}</p>
      </div>
      <div v-if="media_file.side_represented">
        <strong>Side represented</strong>
        <p>{{ media_file.side_represented }}</p>
      </div>
      <div v-if="media_file.user_name">
        <strong>Media loaded by</strong>
        <p>{{ media_file.user_name }}</p>
      </div>
      <div v-if="media_file.copyright_holder">
        <strong>Copyright holder</strong>
        <p>{{ media_file.copyright_holder }}</p>
      </div>
      <div v-if="media_file.copyright_permission">
        <strong>Copyright information</strong>
        <p>{{ media_file.copyright_permission }}</p>
      </div>
      <div v-if="media_file.references">
        <strong>{{ media_file.references.length > 1 ? "Bibliographic References" : "Bibliographic Reference" }}</strong>
        <p v-html="media_file.references.join('<br/>')"></p>
      </div>
      <div v-if="media_file.notes">
        <strong>Media Notes</strong>
        <p v-html="media_file.notes"></p>
      </div>
      <div v-if="media_file.url">
        <strong>Web source of media</strong>
        <p><a href="media_file.url" target="_blank">View media online &raquo;</a></p>
      </div>
      <div v-if="media_file.url_description">
        <strong>Web source description</strong>
        <p v-html="media_file.url_description"></p>
      </div>
      <div v-if="media_file.created_on">
        <strong>Media loaded on</strong>
        <p>{{ toDateString(media_file.created_on) }}</p>
      </div>
      <div v-if="media_file.ancestor">
        <strong>{{ getAncestorMessage(media_file) }}</strong>
        <p v-if="media_file.ancestor.child_siblings"><i v-html="getSibilingMessage(media_file)"></i></p>
      </div>
      <div class="mb-4">
        {{ getHitsMessage(media_file) }} <Tooltip :content="viewTooltipText"></Tooltip>
      </div>
    </div>
  </div>
</template>
