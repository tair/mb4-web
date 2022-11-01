import axios from "axios";
import { defineStore } from "pinia";

export const useProjectsStore = defineStore({
  id: "projects",
  state: () => ({
    loading: false,
    projects: null,
    err: null,

    /// browse data ////
    titles: null,
    authors: "",
    journals: "",
    ///////////////

    // pagination info //
    projectList: null,
    currentPage: 1,
    itemsPerPage: 25,
    totalPages: 0,
    /////////////////////
  }),
  getters: {
    isLoading(state) {
      return state.loading;
    },
  },
  actions: {
    fetchByPage() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.projectList = this.projects.slice(start, end);
    },

    recalculatePageInfo() {
      // calculate initial page sizes
      this.totalPages = Math.floor(this.projects.length / this.itemsPerPage);
      if (this.totalPages * this.itemsPerPage < this.projects.length) {
        this.totalPages++;
      }
    },

    async sortProjectsByPublishedDate(sort_by) {
      // load projects if not exists
      if (!this.projects) await this.fetchProjects();

      this.projects.sort((a, b) => {
        if (a.published_on < b.published_on) return sort_by == "asc" ? -1 : 1;
        if (a.published_on > b.published_on) return sort_by != "asc" ? -1 : 1;
        return 0;
      });

      this.recalculatePageInfo();
      this.fetchByPage(1);

      return this.projects;
    },

    async sortProjectsByNumber(sort_by) {
      // load projects if not exists
      if (!this.projects) await this.fetchProjects();

      this.projects.sort((a, b) => {
        if (a.project_id < b.project_id) return sort_by == "asc" ? -1 : 1;
        if (a.project_id > b.project_id) return sort_by != "asc" ? -1 : 1;
        return 0;
      });

      this.recalculatePageInfo();
      this.fetchByPage(1);

      return this.projects;
    },

    async fetchProjects() {
      // if already loaded, return them.
      if (this.projects) return this.projects;

      this.loading = true;
      this.err = null;

      try {
        // const url = `http://localhost:8080/projects`;
        const url = `https://mb4-data.s3.us-west-2.amazonaws.com/projects.json`;
        const res = await axios.get(url);
        this.projects = res.data;
        this.recalculatePageInfo();
        this.fetchByPage(1);
      } catch (e) {
        console.error(`store:projects:fetchProjects(): ${e}`);
        this.err = "Error fetching project list.";
      } finally {
        this.loading = false;
      }
    },

    async fetchProjectTitles(sort_by) {
      // if already loaded, return them.
      if (this.titles) {
        this.titles.sort((a, b) => {
          const nameA = a.name.trim().toUpperCase(); // ignore upper and lowercase
          const nameB = b.name.trim().toUpperCase(); // ignore upper and lowercase
          if (nameA < nameB) return sort_by == "asc" ? -1 : 1;
          if (nameA > nameB) return sort_by != "asc" ? -1 : 1;
          return 0;
        });

        return this.titles;
      }

      this.loading = true;
      this.err = null;

      try {
        const url = `${
          import.meta.env.VITE_API_URL
        }/public/projects/titles/${sort_by}`;
        const res = await axios.get(url);
        this.titles = res.data;
      } catch (e) {
        console.error(`store:projects:fetchProjectTitles()`);
        this.err = "Error fetching project titles.";
      } finally {
        this.loading = false;
      }
    },

    async fetchProjectAuthor() {
      // if already loaded, return them.
      if (this.authors) return this.authors;

      this.loading = true;
      this.err = null;

      try {
        const url = `${
          import.meta.env.VITE_API_URL
        }/public/projects/authors_projects`;
        const res = await axios.get(url);
        this.authors = res.data;
      } catch (e) {
        console.error(`store:projects:fetchProjectAuthor()`);
        this.err = "Error fetching project authors.";
      } finally {
        this.loading = false;
      }
    },

    async fetchProjectJournal() {
      // if already loaded, return them.
      if (this.journals) return this.journals;

      this.loading = true;
      this.err = null;

      try {
        const url = `${
          import.meta.env.VITE_API_URL
        }/public/projects/journals_projects`;
        const res = await axios.get(url);
        this.journals = res.data;
      } catch (e) {
        console.error(`store:projects:fetchProjectJournal()`);
        this.err = "Error fetching project journals.";
      } finally {
        this.loading = false;
      }
    },
  },
});
