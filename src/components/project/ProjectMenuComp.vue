<script setup>
const props = defineProps({
  menuItem: String,
});
</script>

<template>
  <div class="d-grid gap-2 d-md-flex mb-3">
    <RouterLink
      :to="`/project`"
      class="nav-link p-0"
      v-if="menuItem != 'pub-date'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Publication Date
      </button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">
        Publication Date
      </button>
    </div>

    <RouterLink
      :to="`/project`"
      class="nav-link p-0"
      v-if="menuItem != 'prj-no'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Project Number
      </button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">
        Project Number
      </button>
    </div>

    <RouterLink
      :to="`/project/title`"
      class="nav-link p-0"
      v-if="menuItem != 'prj-title'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Project title
      </button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">
        Project title
      </button>
    </div>

    <RouterLink
      :to="`/project/author`"
      class="nav-link p-0"
      v-if="menuItem != 'author'"
    >
      <button type="button" class="btn btn-secondary btn-sm">Author</button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">Author</button>
    </div>

    <RouterLink
      :to="`/project`"
      class="nav-link p-0"
      v-if="menuItem != 'publication'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Publication
      </button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">Publication</button>
    </div>

    <RouterLink
      :to="`/project`"
      class="nav-link p-0"
      v-if="menuItem != 'popular'"
    >
      <button type="button" class="btn btn-secondary btn-sm">Popular</button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">Popular</button>
    </div>
  </div>
</template>
