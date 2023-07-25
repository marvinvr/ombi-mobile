export const getPoster = (path: string): string => {
        if (!path) {
                return '/assets/backdrop.png';
        }
        if (path.indexOf('http') !== -1) {
                return path;
        }
        return `https://image.tmdb.org/t/p/w300/${path}`;
};
