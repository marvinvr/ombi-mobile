import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RequestActionType } from 'src/models/requests';
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
    private credentials: CredentialsService,
    private router: Router,
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
    if(this.credentials.isAdmin || this.credentials.canApproveRequests) this.tabs = adminTabs()
    else if(this.credentials.signedIn) {
      this.tabs = userTabs()
      this.router.navigate([RequestActionType.MOVIE])
    } else {
      this.tabs = signedOutTabs()
      this.router.navigate(['config'])
    }
  }

}
