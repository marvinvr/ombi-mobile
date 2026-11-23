import { provideAppInitializer } from '@angular/core';
import {
  IonApp,
  IonBadge,
  IonBreadcrumb,
  IonBreadcrumbs,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonRouterOutlet,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmark,
  closeOutline,
  cloudDownloadOutline,
  cogOutline,
  downloadOutline,
  film,
  personOutline,
  searchOutline,
  tvOutline,
} from 'ionicons/icons';

/**
 * Ionic standalone components used by the templates of the components declared in AppModule
 * (replaces the deprecated IonicModule, see Ionic 9 build options).
 */
export const IONIC_COMPONENTS = [
  IonApp,
  IonBadge,
  IonBreadcrumb,
  IonBreadcrumbs,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonRouterOutlet,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTabBar,
  IonTabButton,
  IonTabs,
];

/** Every icon the app references by name (tabs, content types, request states). */
export const registerIcons = () =>
  addIcons({
    checkmark,
    'close-outline': closeOutline,
    'cloud-download-outline': cloudDownloadOutline,
    'cog-outline': cogOutline,
    'download-outline': downloadOutline,
    film,
    'person-outline': personOutline,
    'search-outline': searchOutline,
    'tv-outline': tvOutline,
  });

export const provideIcons = () => provideAppInitializer(() => registerIcons());
