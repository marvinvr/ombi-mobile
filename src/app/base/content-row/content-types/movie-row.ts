import { ContentClass, Movie, Tag } from 'src/models/content';
import { RequestType } from 'src/models/requests';

export class MovieContent implements ContentClass {
    public type: RequestType = RequestType.MOVIE;
    public buttons = [];

    constructor(
        private movie: Movie
    ) { }

    public get id(): number {
      return this.movie.id;
    }

    public get title(): string {
        return this.movie.title;
    }

    public get description(): string {
        return this.movie.description;
    }

    public get posterUrl(): string {
        return this.movie.posterUrl;
    }

    public get genres(): string[] {
        return this.movie.genres;
    }

    public get releaseYear(): number {
        return this.movie.releaseDate.getFullYear();
    }

    public get approved(): boolean {
        return this.movie.request?.approved;
    }

    public set approved(approved: boolean) {
      this.movie.request.approved = approved;
    }

    public get denied(): boolean {
      return this.movie.request.denied;
    }

    public get available(): boolean {
        return this.movie.available;
    }

    public get requested(): boolean {
        return this.movie.request?.requested;
    }

    public set requested(requested: boolean) {
      this.movie.request.requested = requested;
    }

    public disable(): void {
      this.movie.request.requested = true;
    }
}
