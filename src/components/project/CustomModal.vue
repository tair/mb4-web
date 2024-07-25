<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="modal-close" @click="close"><i class="fa-regular fa-rectangle-xmark"></i></button>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600; /* z-index higher than header so it appears on top */
}

.modal-content {
  position: relative;
  background: white;
  padding: 20px;
  border-radius: 5px;
  position: relative;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  box-sizing: border-box;
  z-index: 601;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 30px;
  cursor: pointer;
  z-index: 602;
  color: #666666;
}
</style>
