<template>
  <div class="media-view-panel">
    <div
      class="media-container"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
      @wheel="onWheel"
    >
      <img
        v-if="isImageFormat(imgSrc)"
        :src="imgSrc"
        :style="{
          transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
        }"
        class="media-image"
        ref="image"
      />
      <canvas
        v-else
        ref="canvas"
        :style="{
          transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
        }"
        class="media-image"
      ></canvas>
    </div>
    <div class="controls">
      <div class="zoom-controls">
        <button @click="zoomIn" title="zoomIn">
          <i class="fa-solid fa-magnifying-glass-plus"></i>
        </button>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          v-model="zoom"
          title="zoomRange"
          class="vertical-range"
        />
        <button @click="zoomOut" title="zoomOut">
          <i class="fa-solid fa-magnifying-glass-minus"></i>
        </button>
      </div>
      <div class="rotate-controls">
        <button @click="rotateLeft" title="rotateLeft">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
        <button @click="rotateRight" title="rotateRight">
          <i class="fa-solid fa-rotate-right"></i>
        </button>
      </div>
      <div class="drag-control">
        <button
          @click="flipIsDragging"
          :style="{ backgroundColor: isDragging ? '#e0e0e0' : '#fff' }"
          title="drag"
        >
          <i class="fa-solid fa-arrows-up-down-left-right"></i>
        </button>
      </div>
      <div class="thumbnail-control">
        <button
          @click="flipThumbnailView"
          :style="{ backgroundColor: isThumbnailVisible ? '#e0e0e0' : '#fff' }"
          title="thumbnail"
        >
          <i class="fa-regular fa-image"></i>
        </button>
      </div>
      <div class="reset-control">
        <button @click="resetView" title="reset">Reset</button>
      </div>
    </div>
    <div v-if="isThumbnailVisible" class="thumbnail">
      <img :src="imgSrc" class="thumbnail-image" />
    </div>
  </div>
</template>

<script>
import 'tiff.js'

export default {
  props: {
    imgSrc: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      zoom: 1,
      offset: { x: 0, y: 0 },
      rotation: 0,
      isDragging: false,
      startDragOffset: { x: 0, y: 0 },
      isThumbnailVisible: false,
    }
  },
  watch: {
    imgSrc: 'renderImage',
  },
  methods: {
    isImageFormat(src) {
      return /\.(jpe?g|png|gif|bmp|webp)$/i.test(src)
    },
    renderImage() {
      if (!this.isImageFormat(this.imgSrc)) {
        const canvas = this.$refs.canvas
        const ctx = canvas.getContext('2d')

        fetch(this.imgSrc)
          .then((response) => response.arrayBuffer())
          .then((buffer) => {
            const tiff = new Tiff({
              buffer: buffer,
            })
            const image = tiff.toCanvas()

            canvas.width = image.width
            canvas.height = image.height
            ctx.drawImage(image, 0, 0)
          })
          .catch((error) => {
            console.error('Error loading TIFF image:', error)
          })
      }
    },
    zoomIn() {
      if (this.zoom < 3) this.zoom += 0.1
    },
    zoomOut() {
      if (this.zoom > 0.1) this.zoom -= 0.1
    },
    rotateLeft() {
      this.rotation -= 15
    },
    rotateRight() {
      this.rotation += 15
    },
    resetView() {
      this.zoom = 1
      this.offset = { x: 0, y: 0 }
      this.rotation = 0
      this.isThumbnailVisible = false
    },
    startDrag(event) {
      this.isDragging = true
      this.startDragOffset = {
        x: event.clientX - this.offset.x,
        y: event.clientY - this.offset.y,
      }
    },
    onDrag(event) {
      if (this.isDragging) {
        this.offset = {
          x: event.clientX - this.startDragOffset.x,
          y: event.clientY - this.startDragOffset.y,
        }
      }
    },
    endDrag() {
      this.isDragging = false
    },
    onWheel(event) {
      if (event.deltaY > 0) {
        this.zoomOut()
      } else {
        this.zoomIn()
      }
    },
    flipThumbnailView() {
      this.isThumbnailVisible = !this.isThumbnailVisible
    },
    flipIsDragging() {
      this.isDragging = !this.isDragging
    },
  },
  mounted() {
    this.renderImage()
  },
}
</script>

<style scoped>
.media-view-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  background-color: #f0f0f0;
}

.media-container {
  position: relative;
  width: 80%;
  height: 80%;
  border: 1px solid #ccc;
  overflow: hidden;
  cursor: grab;
  background-color: #fff;
}

.media-container:active {
  cursor: all-scroll;
}

.media-image {
  transition: transform 0.1s;
  transform-origin: center;
  width: 100%;
  height: auto;
}

.controls {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.zoom-controls,
.rotate-controls,
.drag-control,
.reset-control {
  margin: 5px 0;
}

.zoom-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Align items to the left */
}

.zoom-controls button {
  margin: 5px 0; /* Add margin to ensure the range input is between the buttons */
}

.rotate-controls {
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
}

button {
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 5px;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover {
  background-color: #e0e0e0;
}

.vertical-range {
  width: 100px;
  height: 15px;
  transform: rotate(-90deg);
  margin: 10px 0;
}

.thumbnail-control button {
  background-color: #e0e0e0;
}

.thumbnail {
  position: absolute;
  top: 40px;
  right: 40px;
  border: 1px solid #ccc;
  background-color: #fff;
  padding: 5px;
  z-index: 1000;
}

.thumbnail-image {
  width: 200px;
  height: auto;
}
</style>
