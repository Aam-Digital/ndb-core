import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { DatabaseModule } from '../database/database.module';
import { AlertsModule } from '../alerts/alerts.module';
import { EntityModule } from '../entity/entity.module';
import { LoggedInGuard } from './logged-in.guard';
import { SessionService } from './session.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DatabaseModule,
    AlertsModule,
    EntityModule
  ],
  declarations: [LoginComponent],
  exports: [LoginComponent],
  providers: [SessionService, LoggedInGuard]
})
export class SessionModule {
}
