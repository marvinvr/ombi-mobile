import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NavigationComponent } from './base/navigation/navigation.component';
import { InputComponent } from './base/input/input.component';
import { CommonModule } from '@angular/common';
import { MoviesComponent } from './pages/movies/movies.component';
import { TvComponent } from './pages/tv/tv.component';
import { ConfigComponent } from './pages/config/config.component';
import { RequestsComponent } from './pages/requests/requests.component';
import { HeaderComponent } from './base/header/header.component';
import { ButtonComponent } from './base/button/button.component';


@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    InputComponent,
    MoviesComponent,
    ConfigComponent,
    TvComponent,
    RequestsComponent,
    HeaderComponent,
    ButtonComponent
  ],
  entryComponents: [ ],
  imports: [BrowserModule, CommonModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
