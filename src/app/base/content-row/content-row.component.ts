import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ContentClass } from 'src/models/content';
import { RequestsService } from 'src/services/requests.service';

@Component({
  selector: 'app-content-row',
  templateUrl: './content-row.component.html',
  styleUrls: ['./content-row.component.scss'],
})
export class ContentRowComponent implements OnInit {

  @Input() content!: ContentClass;
  @Input() requestsService?: RequestsService;

  @Output() click: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit() { }

  public get hasButtons(): boolean {
    return this.content?.buttons?.length > 0;
  }
}
