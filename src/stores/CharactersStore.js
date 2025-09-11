import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

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
      const response = await apiService.get(`/projects/${projectId}/characters`)
      const responseData = await response.json()
        const characters = responseData.characters
      this.map = new Map(characters.map((c) => [c.character_id, c]))
      this.isLoaded = true
    },
    invalidate() {
      this.map.clear()
      this.isLoaded = false
    },
  },
})
