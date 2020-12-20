import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigComponent } from './config/config.component';
import { ContentComponent } from './content/content.component';
import { MoviesComponent } from './movies/movies.component';
import { RequestsComponent } from './requests/requests.component';
import { TvComponent } from './tv/tv.component';

const routes: Routes = [
    {
        path: 'movies',
        component: MoviesComponent,
    },
    {
        path: 'tv',
        component: TvComponent,
    },
    {
        path: 'requests',
        component: RequestsComponent,
    },
    {
        path: 'config',
        component: ConfigComponent,
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {}