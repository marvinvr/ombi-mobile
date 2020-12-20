import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ContentClass } from 'src/models/content';
import { RequestActionType } from 'src/models/requests';
import { RequestsService } from 'src/services/requests.service';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit {
  @Input() content!: ContentClass;

  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private requests: RequestsService
  ) { }

  ngOnInit() { }

  public goBack() {
    this.back.emit();
  }

  public request(): void {
    this.requests.request(this.content.type, this.content.id)
  }
}
