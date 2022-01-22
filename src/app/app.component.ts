import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { AuthService } from 'src/services/auth.service';
import { Settings } from 'src/models/settings';
import { SettingsService } from 'src/services/settings.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private settings: SettingsService,
    private auth: AuthService,
    private router: Router
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if(!this.settings.get(Settings.USE_PLEX_OAUTH)){
        this.auth.fetchToken();
      } else {
        this.router.navigate(['Movie']);
      }
    });
  }
}
