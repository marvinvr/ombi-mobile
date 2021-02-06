import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Settings, SETTINGS_STORAGE_KEY } from 'src/models/settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settings = {};
  private settingsChange = new Subject();

  constructor() {
    this.init();
  }

  private init() {
    this.settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)) || {};
  }

  public set(key: Settings, value: any): void {
    this.settings[key] = value;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings))
    this.settingsChange.next();
  }

  public get(key: Settings): any {
    return this.settings[key];
  }

  public get change(): Subject<any> {
    return this.settingsChange;
  }
}
