import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallComponent } from './pwa-install.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslationModule } from 'app/core/translation/translation.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';



@NgModule({
  declarations: [PwaInstallComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatButtonModule,
    FlexLayoutModule,
    TranslationModule,
    MatSidenavModule,
    MatToolbarModule
  ],
  exports: [PwaInstallComponent]
})
export class PwaInstallModule { }
