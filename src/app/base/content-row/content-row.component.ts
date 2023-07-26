import { Component, Input } from '@angular/core';
import { OverviewContent, RequestStatus } from 'src/models/content';

@Component({
  selector: 'app-content-row',
  templateUrl: './content-row.component.html',
  styleUrls: ['./content-row.component.scss'],
})
export class ContentRowComponent {

  @Input() content!: OverviewContent;

  get color(): string {
    switch(this.content.status) {
      case RequestStatus.APPROVED:
        return 'secondary';
      case RequestStatus.DENIED:
        return 'danger';
      case RequestStatus.AVAILABLE:
        return 'success';
      case RequestStatus.OPEN:
        return 'primary';
    }
  }

  onError(e: any) {
    e.target.src = '/assets/backdrop.png';
  }

  public get description(): string {
    if (this.content?.description.length == 0) {
      return '<i>No description avaliable</i>';
    } 
    return this.content?.description;
  } 
}
