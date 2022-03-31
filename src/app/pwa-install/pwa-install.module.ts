import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallComponent } from './pwa-install.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslationModule } from 'app/core/translation/translation.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PwaInstallService } from './pwa-install.service';
@NgModule({
  declarations: [PwaInstallComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatButtonModule,
    FlexLayoutModule,
    TranslationModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  providers: [
    PwaInstallService
  ],
  exports: [PwaInstallComponent]
})
export class PwaInstallModule { 
  constructor(
    pwaInstallService: PwaInstallService
  ) {
    pwaInstallService.registerPWAInstallListener();
  }
}
