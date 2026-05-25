import type { MovieCardResponse } from '~/services/api/movies'

export const buildMoviePosterUrl = (
  apiBase: string,
  movie: Pick<MovieCardResponse, 'id' | 'posterUrl'> | null,
) => {
  if (!movie?.posterUrl) {
    return null
  }

  return `${apiBase.replace(/\/$/, '')}/movies/${encodeURIComponent(movie.id)}/poster`
}
