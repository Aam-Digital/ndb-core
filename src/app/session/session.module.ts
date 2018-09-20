/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { DatabaseModule } from '../database/database.module';
import { AlertsModule } from '../alerts/alerts.module';
import { LoggedInGuard } from './logged-in.guard';
import { SessionService } from './session.service';
import { MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule} from '@angular/material';
import { RouterModule } from '@angular/router';
import { databaseServiceProvider } from './database-service.provider';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DatabaseModule,
    AlertsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterModule
  ],
  declarations: [LoginComponent],
  exports: [LoginComponent],
  providers: [LoggedInGuard, SessionService, databaseServiceProvider]
})
export class SessionModule {
}
