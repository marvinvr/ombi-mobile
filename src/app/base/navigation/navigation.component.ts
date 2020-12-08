import { Component, OnInit } from '@angular/core';
import { Tab } from 'src/models/tabs';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {

  public tabs: Tab[] = [
    {
      id: 'movies',
      label: 'Movies',
      icon: 'triangle'
    },
    {
      id: 'tv',
      label: 'TV Shows',
      icon: 'triangle'
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: 'triangle'
    },
    {
      id: 'config',
      label: 'Config',
      icon: 'triangle'
    },
  ]

  constructor() { }

  ngOnInit() {}

}
