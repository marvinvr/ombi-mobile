import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { InputAutocomplete, InputType } from 'src/models/input';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent implements OnInit {
  @Input() label: string = '';
  @Input() autocomplete: InputAutocomplete = InputAutocomplete.OFF;
  @Input() type: InputType = InputType.TEXT;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() placeholder: string = '';

  @Input() value: string = '';
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {}
  
  updateValue(event){
    const value = event?.detail?.value;
    this.value = value;
    this.valueChange.emit(value);
  }

}
