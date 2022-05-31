import axios from "axios";
import { defineStore } from "pinia";

export const useProjectsStore = defineStore({
  id: "projects",
  state: () => ({
    loading: false,
    projects: null,
    err: null,

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
  },
});
