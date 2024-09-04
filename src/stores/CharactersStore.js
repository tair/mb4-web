import axios from 'axios'
import { defineStore } from 'pinia'

export const useCharactersStore = defineStore({
  id: 'characters',
  state: () => ({
    isLoaded: false,
    map: new Map(),
  }),
  getters: {
    characters: function () {
      return Array.from(this.map.values())
    },
  },
  actions: {
    async fetchCharactersByProjectId(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/characters`
      const response = await axios.get(url)
      const characters = response.data.characters
      this.map = new Map(characters.map((c) => [c.character_id, c]))
      this.isLoaded = true
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
