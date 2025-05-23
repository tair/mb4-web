<script setup>
const props = defineProps({
  menuItem: String,
})
</script>

<template>
  <div class="d-grid gap-2 d-sm-flex mb-3">
    <RouterLink
      :to="`/projects/pub_date`"
      class="nav-link p-0"
      v-if="menuItem != 'pub_date'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Project Publication Date
      </button>
    </RouterLink>
    <div v-else>
      <RouterLink :to="`/projects/pub_date`" class="nav-link p-0">
        <button type="button" class="btn btn-warning btn-sm">
          Project Publication Date
        </button>
      </RouterLink>
    </div>

    <RouterLink
      :to="`/projects/prj_no`"
      class="nav-link p-0"
      v-if="menuItem != 'prj_no'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Project Number
      </button>
    </RouterLink>
    <div v-else>
      <RouterLink :to="`/projects/prj_no`" class="nav-link p-0">
        <button type="button" class="btn btn-warning btn-sm">
          Project Number
        </button>
      </RouterLink>
    </div>

    <RouterLink
      :to="`/projects/title`"
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
      :to="`/projects/author`"
      class="nav-link p-0"
      v-if="menuItem != 'author'"
    >
      <button type="button" class="btn btn-secondary btn-sm">Author</button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">Author</button>
    </div>

    <RouterLink
      :to="`/projects/journal`"
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
      :to="`/projects/popular`"
      class="nav-link p-0"
      v-if="menuItem != 'popular'"
    >
      <button type="button" class="btn btn-secondary btn-sm">Popular</button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">Popular</button>
    </div>

    <RouterLink
      :to="`/projects/institution`"
      class="nav-link p-0"
      v-if="menuItem != 'institution'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Institution
      </button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">Institution</button>
    </div>

    <RouterLink
      :to="`/projects/journal_year`"
      class="nav-link p-0"
      v-if="menuItem != 'journal_year'"
    >
      <button type="button" class="btn btn-secondary btn-sm">
        Article Publication Year
      </button>
    </RouterLink>
    <div v-else>
      <button type="button" class="btn btn-warning btn-sm">
        Article Publication Year
      </button>
    </div>
  </div>
</template>
