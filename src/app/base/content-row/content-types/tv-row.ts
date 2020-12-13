import { ContentClass, Movie, Tag, TvShow } from "src/models/content";
import { TvService } from "src/services/tv.service";

export class TvContent implements ContentClass {

    constructor(
        private tvShow: TvShow
    ) { }
    
      get title(): string {
        return this.tvShow.title
      }

      get posterUrl(): string {
        return this.tvShow.posterUrl;
      }
    
      get description(): string {
        return this.tvShow.description
      }
    
      get tags(): Array<Tag> {
        return [
          {
            color: this.available ? 'success' : this.requested ? 'warning' : this.partlyAvailable ? 'warning' : 'danger',
            text: this.available ? 'Available' : this.requested ? 'Requested' : this.partlyAvailable ? 'Partly Available' : 'Not Requested'
          },
          {
            color: 'primary',
            text: new Date(this.tvShow.aired).toLocaleDateString()
          },
          {
            color: 'tertiary',
            text: this.tvShow.network
          }
        ]
      }
    
      public get available(): boolean {
        return this.tvShow.available;
      }
    
      private get partlyAvailable(): boolean {
        return this.tvShow.partlyAvailable;
      }
    
      public get requested(): boolean {
        return this.tvShow.request.requested;
      }
}