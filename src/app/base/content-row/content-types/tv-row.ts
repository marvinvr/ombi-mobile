import { ContentClass, Tag, TvShow } from "src/models/content";
import { RequestType } from "src/models/requests";

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
            color: this.available ? 'success' : this.approved ? 'success' : this.requested ? 'warning' : this.partlyAvailable ? 'warning' : 'danger',
            text: this.available ? 'Available' : this.approved ? 'Approved' : this.requested ? 'Requested' : this.partlyAvailable ? 'Partly Available' : 'Not Requested'
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

      private get approved(): boolean {
        return this.tvShow.request.approved;
      }

      public set requested(requested: boolean) {
        this.tvShow.request.requested = requested;
      }

      public disable(): void {
        this.tvShow.request.requested = true;
      }     
}