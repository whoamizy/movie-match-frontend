import type { AxiosInstance } from 'axios'

export interface MovieGenre {
  name: string
  slug: string | null
}

export interface MovieGenresResponse {
  genres: MovieGenre[]
}

export const createMoviesApi = (api: AxiosInstance) => ({
  async getGenres() {
    const response = await api.get<MovieGenresResponse>('/movies/genres')

    return response.data
  },
})

export type MoviesApi = ReturnType<typeof createMoviesApi>
