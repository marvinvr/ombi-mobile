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
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Input() placeholder: string = '';

  constructor() { }

  ngOnInit() {}

}
