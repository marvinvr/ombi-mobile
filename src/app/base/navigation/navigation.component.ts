import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Tab } from 'src/models/tabs';
import { CredentialsService } from 'src/services/credentials.service';
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
    private credentials: CredentialsService
  ) { }

  ngOnInit() {
    this.updateTabs();
    this.subscription = this.credentials.tokenChange().subscribe(() => {
      this.updateTabs();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  updateTabs() {
    if(this.credentials.isAdmin) this.tabs = adminTabs()
    else if(this.credentials.signedIn) this.tabs = userTabs()
    else this.tabs = signedOutTabs()
  }

}
