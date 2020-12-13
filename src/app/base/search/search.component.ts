import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  @Input() placeholder: string = '';
  @Output() change: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  ngOnInit() { }

  updateValue(value){
    this.change.emit(value);
  }

}
