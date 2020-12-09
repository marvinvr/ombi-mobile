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
      icon: 'videocam-outline'
    },
    {
      id: 'tv',
      label: 'TV Shows',
      icon: 'tv-outline'
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: 'git-pull-request-outline'
    },
    {
      id: 'config',
      label: 'Config',
      icon: 'cog-outline'
    },
  ]

  constructor() { }

  ngOnInit() {}

}
