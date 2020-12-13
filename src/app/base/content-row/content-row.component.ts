import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Content, ContentClass, Tag } from 'src/models/content';

@Component({
  selector: 'app-content-row',
  templateUrl: './content-row.component.html',
  styleUrls: ['./content-row.component.scss'],
})
export class ContentRowComponent implements OnInit {

  @Input() content!: ContentClass;
  @Output() click: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {}
}
