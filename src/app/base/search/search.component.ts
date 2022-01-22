import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  @Input() placeholder = '';
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  private timeout;

  constructor() { }

  ngOnInit() { }

  updateValue(event){
    const value = event?.detail?.value;
    clearTimeout(this.timeout);
    this.timeout = setTimeout( () => {
      this.valueChange.emit(value);
    }, 400);
  }

}
