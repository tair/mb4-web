import axios from 'axios'
import { defineStore } from 'pinia'

export const useCharactersStore = defineStore({
  id: 'characters',
  state: () => ({
    isLoaded: false,
    characters: null,
  }),
  getters: {},
  actions: {
    async fetchCharactersByProjectId(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/characters`
      const response = await axios.get(url)
      this.characters = response.data.characters
      this.isLoaded = true
    },
  },
})
