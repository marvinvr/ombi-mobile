import { ContentClass, Movie, Tag } from "src/models/content";

export class MovieContent implements ContentClass {

    constructor(
        private movie: Movie
    ) { }
    
    public get title(): string {
        return this.movie.title;
    }
    
    public get description(): string {
        return this.movie.description;   
    }

    public get posterUrl(): string {
        return this.movie.posterUrl;
    }
    
    public get tags(): Tag[] {
        return [
          {
            color: this.available ? 'success' : this.requested ? 'warning' : 'danger',
            text: this.available ? 'Available' : this.requested ? 'Requested' : 'Not Requested'
          },
          {
            color: 'primary',
            text: new Date(this.movie.releaseDate).toLocaleDateString()
          }
        ]
    }
    
    public get available(): boolean {
        return this.movie.available;
    }
    
    public get requested(): boolean {
        return this.movie.request.requested;
    }
}