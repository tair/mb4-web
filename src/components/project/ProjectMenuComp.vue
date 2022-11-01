<script setup>
const props = defineProps({
  menuItem: String,
});
</script>

<template>
  <div class="d-grid gap-2 d-md-flex mb-3">
    <RouterLink
      :to="`/project/pub_date`"
      class="nav-link p-0"
      v-if="menuItem != 'pub_date'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Publication Date
      </button>
    </RouterLink>
    <div v-else>
      <RouterLink :to="`/project/pub_date`" class="nav-link p-0">
        <button type="button" class="btn btn-warning btn-sm">
          Publication Date
        </button>
      </RouterLink>
    </div>

    <RouterLink
      :to="`/project/prj_no`"
      class="nav-link p-0"
      v-if="menuItem != 'prj_no'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Project Number
      </button>
    </RouterLink>
    <div v-else>
      <RouterLink :to="`/project/prj_no`" class="nav-link p-0">
        <button type="button" class="btn btn-warning btn-sm">
          Project Number
        </button>
      </RouterLink>
    </div>

    <RouterLink
      :to="`/project/title`"
      class="nav-link p-0"
      v-if="menuItem != 'prj_title'"
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
      :to="`/project/journal`"
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
      :to="`/project/pub_date`"
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
