import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ToastType } from 'src/models/toast';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(
    private toast: ToastController
  ) { }

  async show(type: ToastType, message: string) {
    const toast = await this.toast.create({
      header: message,
      position: 'top',
      color: type,
      duration: 1500
    });
    toast.present();
  }
}
