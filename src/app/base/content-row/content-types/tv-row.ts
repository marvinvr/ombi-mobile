import { ContentClass, Tag, TvShow } from 'src/models/content';
import { RequestType } from 'src/models/requests';

export class TvContent implements ContentClass {
    public type: RequestType = RequestType.TV;
    public buttons = [];

    constructor(
        private tvShow: TvShow
    ) { }

      get id(): number {
        return this.tvShow.id;
      }

      get title(): string {
        return this.tvShow.title;
      }

      get posterUrl(): string {
        return this.tvShow.posterUrl;
      }

      get description(): string {
        return this.tvShow.description;
      }

      get genres(): string[] {
        return this.tvShow.genres;
      }

      public get releaseYear(): number {
          return this.tvShow.releaseDate.getFullYear();
      }

      public get approved(): boolean {
        return this.tvShow.request.approved;
      }

      public get available(): boolean {
        return this.tvShow.available;
      }

      public get partlyAvailable(): boolean {
        return this.tvShow.partlyAvailable;
      }

      public get requested(): boolean {
        return this.tvShow.request.requested;
      }

      public set requested(requested: boolean) {
        this.tvShow.request.requested = requested;
      }

      public disable(): void {
        this.tvShow.request.requested = true;
      }
}
