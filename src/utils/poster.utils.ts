export const getPoster = (path: string): string => path
        ? `https://image.tmdb.org/t/p/w300/${path}`
        : '/assets/backdrop.png';
