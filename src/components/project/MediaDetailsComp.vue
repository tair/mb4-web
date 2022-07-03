<script setup>
const props = defineProps({
  media_file: {
    type: Object,
  },
});

function buildImageProps(mediaObj, type) {
  try {
    // console.log(mediaObj)
    let media = mediaObj;
    if (type) media = mediaObj[type];

    if (!media.HASH || !media.MAGIC || !media.FILENAME) return null;

    const url =
      `https://morphobank.org/media/morphobank3/` +
      `images/${media.HASH}/${media.MAGIC}_${media.FILENAME}`;

    return url;
  } catch (e) {
    console.log("VV: " + mediaObj);
    console.error(e);
    return null;
  }
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
        <p>M681423</p>
      </div>
      <div>
        <strong>Taxonomic name</strong>
        <p>Garypus cf. saxicola</p>
      </div>
      <div>
        <strong>Specimen</strong>
        <p>Garypus cf. saxicola (InBio/Tg_ra_07.80)</p>
      </div>
      <div>
        <strong>Specimen notes</strong>
        <p>
          Collector: Biosfera I Collection date: 29.07.2016 Location: Cabo
          Verde, Raso Islet, Chã Branca
        </p>
      </div>
      <div>
        <strong>View</strong>
        <p>dorsal</p>
      </div>
      <div>
        <strong>Media loaded by</strong>
        <p>Raquel Vasconcelos</p>
      </div>
      <div>
        <strong>Copyright holder</strong>
        <p>Raquel Vasconcelos</p>
      </div>
      <div>
        <strong>Copyright information</strong>
        <p>
          Person loading media owns copyright and grants permission for use of
          media on MorphoBank
        </p>
      </div>
      <div>
        <strong>Media notes</strong>
        <p>
          Collector: Biosfera I Collection date: 29.07.2016 Location: Cabo
          Verde, Raso islet, Chã Branca
        </p>
      </div>
      <div>
        <strong>Media loaded on</strong>
        <p>October 10 2019 at 11:56:07</p>
      </div>
    </div>
  </div>

  <!-- 
  <div class="card shadow">

    <div class="m-1">
      <img
        :src="buildImageProps(media_file.media.thumbnail)"
        :style="{
          width: media_file.media.thumbnail.WIDTH + 'px',
          height: media_file.media.thumbnail.HEIGHT + 'px',
          backgroundSize: '20px',
          backgroundRepeat: 'no-repeat',
          backgroundImage: 'url(' + '/images/loader.png' + ')',
          backgroundPosition: '10px 10px',
        }"
        class="card-img-top"
      />
    </div>


    <div class="card-body">
      <p class="card-text">
        {{ media_file.notes }}
      </p>
    </div>
  </div> -->
</template>
