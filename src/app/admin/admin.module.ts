import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin/admin.component';
import {MatButtonModule, MatSnackBarModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {PapaParseModule} from 'ngx-papaparse';
import {AlertsModule} from '../alerts/alerts.module';
import {UiHelperModule} from '../ui-helper/ui-helper.module';
import {AdminGuard} from './admin.guard';
import { UserListComponent } from './user-list/user-list.component';
import { MatFormFieldModule, MatSelectModule, MatInputModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    MatButtonModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    PapaParseModule,
    AlertsModule,
    UiHelperModule,
  ],
  declarations: [AdminComponent, UserListComponent],
  providers: [AdminGuard],
})
export class AdminModule { }
