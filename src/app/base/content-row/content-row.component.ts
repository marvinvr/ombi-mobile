import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ContentClass } from 'src/models/content';
import { RequestAction, RequestType } from 'src/models/requests';
import { RequestsService } from 'src/services/requests.service';

@Component({
  selector: 'app-content-row',
  templateUrl: './content-row.component.html',
  styleUrls: ['./content-row.component.scss'],
})
export class ContentRowComponent {

  @Input() content!: ContentClass;
  @Input() requestsService?: RequestsService;

  constructor() { }

  public get hasButtons(): boolean {
    return this.content?.buttons?.length > 0;
  }

  public get description(): string {
    return this.hasButtons ?
      this.content.description
      : this.content.description.substring(0, 110) + '...' + ' <b>read more</b>';
  }

  public performAction(action: RequestAction): void {
    this.content[action === RequestAction.APPROVE ? 'approve': 'deny']();
    this.requestsService.performAction(
      action,
      this.content.type,
      this.content.type === RequestType.MOVIE ? this.content.requestId : this.content.id
      ).then();
  }
}
