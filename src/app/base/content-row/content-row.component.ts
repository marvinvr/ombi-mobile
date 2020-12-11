import { Component, Input, OnInit } from '@angular/core';
import { Content } from 'src/models/content';
import { MovieSearchType } from 'src/models/movie';

@Component({
  selector: 'app-content-row',
  templateUrl: './content-row.component.html',
  styleUrls: ['./content-row.component.scss'],
})
export class ContentRowComponent implements OnInit {

  @Input() item: Content = null;

  constructor() { }

  ngOnInit() {}
}
