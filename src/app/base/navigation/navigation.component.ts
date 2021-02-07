import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RequestActionType } from 'src/models/requests';
import { Tab } from 'src/models/tabs';
import { Settings } from 'src/models/settings';
import { SettingsService } from 'src/services/settings.service';
import { adminTabs, signedOutTabs, userTabs } from './tab.utils';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit, OnDestroy {

  public tabs: Tab[] = [ ]

  private subscription: Subscription;

  constructor(
    private settings: SettingsService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.updateTabs();
    this.settings.change.subscribe(() => {
      this.updateTabs();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  updateTabs() {
    if(this.settings.get(Settings.IS_ADMIN) || this.settings.get(Settings.CAN_APPROVE_REQUESTS)) this.tabs = adminTabs()
    else if(this.settings.get(Settings.IS_SIGNED_IN)) {
      this.tabs = userTabs()
      this.router.navigate([RequestActionType.MOVIE])
    } else {
      this.tabs = signedOutTabs()
      this.router.navigate(['config'])
    }
  }

}
