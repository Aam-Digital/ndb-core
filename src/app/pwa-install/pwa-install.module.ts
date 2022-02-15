import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallComponent } from './pwa-install.component';

@NgModule({
  declarations: [PwaInstallComponent],
  imports: [
    CommonModule,
  ],
  exports: [PwaInstallComponent]
})
export class PwaInstallModule { }
