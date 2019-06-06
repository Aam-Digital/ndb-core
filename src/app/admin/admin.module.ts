import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin/admin.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {BrowserModule} from '@angular/platform-browser';
import {PapaParseModule} from 'ngx-papaparse';
import {AlertsModule} from '../alerts/alerts.module';
import {UiHelperModule} from '../ui-helper/ui-helper.module';
import {AdminGuard} from './admin.guard';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    MatButtonModule,
    MatSnackBarModule,
    PapaParseModule,
    AlertsModule,
    UiHelperModule,
  ],
  declarations: [AdminComponent],
  providers: [AdminGuard],
})
export class AdminModule { }
