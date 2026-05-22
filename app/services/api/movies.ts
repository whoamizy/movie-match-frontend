import type { AxiosInstance } from 'axios'

export interface MovieGenre {
  id: number
  name: string
}

export interface MovieGenresResponse {
  genres: MovieGenre[]
}

export interface MovieCardResponse {
  id: string
  poiskinoId: string
  title: string
  originalTitle: string | null
  description: string | null
  posterUrl: string | null
  rating: number | null
  releaseYear: number | null
  durationMinutes: number | null
  genres: string[]
}

type NextMovieApiResponse = MovieCardResponse | null | ''

export const createMoviesApi = (api: AxiosInstance) => ({
  async getGenres() {
    const response = await api.get<MovieGenresResponse>('/movies/genres')

    return response.data
  },

  async getNextMovie(sessionId: string) {
    const response = await api.get<NextMovieApiResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/movies/next`,
    )

    return response.status === 204 || response.data === ''
      ? null
      : response.data
  },
})

export type MoviesApi = ReturnType<typeof createMoviesApi>
