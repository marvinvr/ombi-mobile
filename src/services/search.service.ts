import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { RequestParameters } from 'src/models/http';
import { OverviewContent } from 'src/models/content';
import { MovieService } from './movie.service';
import { TvService } from './tv.service';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    constructor(
        private api: ApiService,
        private movieService: MovieService,
        private tvService: TvService) { }

    public search(term: string, type: 'all' | 'movie' | 'tv' = 'all'): Promise<OverviewContent[]> {
        return this.api.post(
            `/search/multi/${term}`,
            {},
            this.getPayload(type))
            .then(this.toOverviewContent);
    }

    public getPopular(type: 'all' | 'movie' | 'tv' = 'all', force: boolean = false): Promise<OverviewContent[]> {
        return Promise.all([
            type === 'all' || type === 'movie' ? this.movieService.getPopular(force) : Promise.resolve(Array<OverviewContent>()),
            type === 'all' || type === 'tv' ? this.tvService.getPopular(force) : Promise.resolve(Array<OverviewContent>()),
        ]).then((result) => (
            [...result[0], ...result[1]].sort( () => .5 - Math.random() )
        ));
    }

    public toOverviewContent(results: any[]): OverviewContent[] {
        return results.map((result) => ({
            mediaType: result.mediaType,
            id: result.id,
            title: result.title,
            description: result.overview,
            posterUrl: result.poster ? `https://image.tmdb.org/t/p/w300/${result.poster}`
                : '/assets/backdrop.png'
        }));
    }

    private getPayload(type: 'all' | 'movie' | 'tv'): RequestParameters {
        return {
            music: false,
            people: false,
            movies: type === 'all' || type === 'movie',
            tvShows: type === 'all' || type === 'tv',
        } as RequestParameters;
    }
}
