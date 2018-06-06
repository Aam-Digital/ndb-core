import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin/admin.component';
import {MatButtonModule, MatSnackBarModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {PapaParseModule} from 'ngx-papaparse';
import {AlertsModule} from '../alerts/alerts.module';
import {UiHelperModule} from '../ui-helper/ui-helper.module';

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
  declarations: [AdminComponent]
})
export class AdminModule { }
