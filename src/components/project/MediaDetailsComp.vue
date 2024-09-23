<script setup>
import { ref } from 'vue'
import { toDateString } from '@/utils/date'
import {
  getViewStatsTooltipText,
  getDownloadTooltipText,
} from '@/utils/util.js'
import Tooltip from '@/components/main/Tooltip.vue'
import CustomModal from './CustomModal.vue'
import MediaViewPanel from './MediaViewPanel.vue'

const props = defineProps({
  media_file: {
    type: Object,
  },
})

const showZoomModal = ref(false)
const showDownloadModal = ref(false)
const viewStatsTooltipText = getViewStatsTooltipText()
const downloadTooltipText = getDownloadTooltipText()

async function confirmDownload(mediaObj, fileName) {
  // if (!isCaptchaVerified) {
  //   alert("Please complete the CAPTCHA");
  //   return;
  // }
  // CAPTCHA is completed, proceed with the download
  const imageUrl = buildImageProps(mediaObj)
  let downloadFileName = fileName
  if (!downloadFileName) {
    downloadFileName = getLastElementFromUrl(imageUrl)
  }
  // TODO: create download blob after put the media file behind the API
  // const response = await fetch(imageUrl);
  // const blob = await response.blob();
  // const url = URL.createObjectURL(blob);
  const link = document.createElement('a')
  link.href = imageUrl
  link.download = downloadFileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // URL.revokeObjectURL(url);

  showDownloadModal.value = false
}

function getLastElementFromUrl(url) {
  const parts = url.split('/')
  return parts[parts.length - 1]
}

function buildImageProps(mediaObj, type) {
  try {
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
  let message =
    'This media file was first entered in MorphoBank as M' +
    mediaObj.ancestor.media_id +
    ' in P' +
    mediaObj.ancestor.project_id
  if (mediaObj.ancestor.deleted) {
    message +=
      '. This project which the media file was first entered has since been deleted.'
  }
  return message
}

function getSibilingMessage(mediaObj) {
  let message = 'It has also been used in: '
  message += mediaObj.ancestor.child_siblings
    .map((obj) => `P${obj.project_id} as M${obj.media_id}`)
    .join(', ')
  message += '.'
  return message
}

function getHitsMessage(mediaObj) {
  let message = ''
  if (mediaObj.hits) {
    message =
      ' This media record has been viewed ' +
      mediaObj.hits +
      ' time' +
      (mediaObj.hits == 1 ? '' : 's')
    if (mediaObj.downloads) {
      message +=
        ' and downloaded ' +
        mediaObj.downloads +
        ' time' +
        (mediaObj.downloads == 1 ? '' : 's')
    }
  } else {
    if (mediaObj.downloads) {
      message =
        'This media record has been downloaded ' +
        mediaObj.downloads +
        ' time' +
        (mediaObj.downloads == 1 ? '' : 's')
    }
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
          class="card-img"
        />

        <div class="card-body">
          <div class="card-text">
            <div class="nav">
              <a class="nav-link" href="#" @click="showZoomModal = true"
                >>> Zoom</a
              >
              <CustomModal
                :isVisible="showZoomModal"
                @close="showZoomModal = false"
              >
                <MediaViewPanel
                  :imgSrc="buildImageProps(media_file.media['original'])"
                />
              </CustomModal>
              <a class="nav-link" href="#" @click="showDownloadModal = true"
                >>> Download <Tooltip :content="downloadTooltipText"></Tooltip
              ></a>
              <CustomModal
                :isVisible="showDownloadModal"
                @close="showDownloadModal = false"
              >
                <div>
                  <h2>Copyright Warning</h2>
                  <p>
                    You are downloading media from MorphoBank. If you plan to
                    reuse this item you must check the copyright reuse policy in
                    place for this item.<br />
                    Please acknowledge that you have read and understood the
                    copyright warning before proceeding with the download.
                  </p>
                  <button
                    class="btn btn-primary"
                    @click="
                      confirmDownload(
                        media_file.media['original'],
                        media_file.media['ORIGINAL_FILENAME']
                      )
                    "
                  >
                    I Acknowledge and Proceed
                  </button>
                </div>
              </CustomModal>
            </div>
          </div>
          <div v-if="media_file.license && media_file.license.image">
            <img :src="`/images/${media_file.license.image}`" class="cc-icon" />
          </div>
          <div v-if="media_file.license && media_file.license.isOneTimeUse">
            <p>
              Copyright license for future use: Media released for onetime use,
              no reuse without permission
            </p>
          </div>
          <div>
            <p class="card-title" v-if="media_file.media['ORIGINAL_FILENAME']">
              Original filename: {{ media_file.media['ORIGINAL_FILENAME'] }}
            </p>
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
        <p v-html="media_file.taxon_name"></p>
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
        <strong>{{
          media_file.references.length > 1
            ? 'Bibliographic References'
            : 'Bibliographic Reference'
        }}</strong>
        <p v-html="media_file.references.join('<br/>')"></p>
      </div>
      <div v-if="media_file.notes">
        <strong>Media Notes</strong>
        <p v-html="media_file.notes"></p>
      </div>
      <div v-if="media_file.url">
        <strong>Web source of media</strong>
        <p>
          <a :href="media_file.url" target="_blank"
            >View media online &raquo;</a
          >
        </p>
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
        <p v-if="media_file.ancestor.child_siblings">
          <i v-html="getSibilingMessage(media_file)"></i>
        </p>
      </div>
      <div class="mb-4" v-if="getHitsMessage(media_file)">
        {{ getHitsMessage(media_file) }}
        <Tooltip :content="viewStatsTooltipText"></Tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cc-icon {
  width: 88;
  height: 31;
}

.card {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
}

.card-img {
  margin: 1rem;
}

.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.nav {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.nav-link {
  margin: 0 0.5rem;
  text-decoration: none;
  color: #007bff;
}

.nav-link:hover {
  text-decoration: underline;
}

.cc-icon {
  max-width: 100px;
  margin-bottom: 1rem;
}

.card-title,
p {
  margin: 0.5rem 0;
}
</style>
