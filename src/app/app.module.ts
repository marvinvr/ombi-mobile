import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

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
import { SearchComponent } from './base/search/search.component';
import { HeaderComponent } from './base/header/header.component';
import { TagsComponent } from './base/tags/tags.component';
import { ListRemarkComponent } from './base/list-remark/list-remark.component';
import { ButtonComponent } from './base/button/button.component';
import { ContentRowComponent } from './base/content-row/content-row.component';
import { ContentComponent } from './pages/content/content.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    ContentRowComponent,
    NavigationComponent,
    InputComponent,
    MoviesComponent,
    ConfigComponent,
    TvComponent,
    RequestsComponent,
    SearchComponent,
    HeaderComponent,
    ButtonComponent,
    ContentComponent,
    TagsComponent,
    ListRemarkComponent
  ],
  entryComponents: [ ],
  imports: [
    BrowserModule,
    CommonModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    ServiceWorkerModule.register('ngsw-worker.js',
    { enabled: environment.production })],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
