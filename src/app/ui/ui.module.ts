import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlertsModule } from '../alerts/alerts.module';
import { UiComponent } from './ui/ui.component';
import { FooterComponent } from './footer/footer.component';

@NgModule({
  imports: [
    CommonModule,
    AlertsModule
  ],
  declarations: [UiComponent, FooterComponent],
  exports: [UiComponent]
})
export class UiModule {
}
