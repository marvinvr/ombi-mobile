import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  @Input() placeholder: string = '';
  @Output() change: EventEmitter<string> = new EventEmitter<string>();

  private timeout;

  constructor() { }

  ngOnInit() { }

  updateValue(value){
    clearTimeout(this.timeout);
    this.timeout = setTimeout( () => {
      this.change.emit(value);
    }, 500)
  }

}
