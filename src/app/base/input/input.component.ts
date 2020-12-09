import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent implements OnInit {
  @Input() label: string = '';
  @Input() autocomplete: string = '';

  @Output() changed = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {}

}
