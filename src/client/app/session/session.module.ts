import { NgModule } from '@angular/core';
import { LoginComponent } from './login.component';
import { SessionService } from './session.service';
import { LoggedInGuard } from './logged-in.guard';
import { DatabaseModule } from '../database/database.module';
import { AlertsModule } from '../alerts/alerts.module';
import { EntityModule } from '../entity/entity.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [CommonModule, FormsModule, DatabaseModule, AlertsModule, EntityModule],
    declarations: [LoginComponent],
    exports: [LoginComponent],
    providers: [SessionService, LoggedInGuard]
})
export class SessionModule {
}

export { SessionService } from './session.service';
export { LoggedInGuard } from './logged-in.guard';
