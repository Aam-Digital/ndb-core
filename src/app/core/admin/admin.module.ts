import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin/admin.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { PapaParseModule } from 'ngx-papaparse';
import { AlertsModule } from '../alerts/alerts.module';
import { UiHelperModule } from '../ui-helper/ui-helper.module';
import { AdminGuard } from './admin.guard';
import { ChildrenModule } from '../../child-dev-project/children/children.module';
import { EntityModule } from '../entity/entity.module';
import { HttpClientModule } from '@angular/common/http';
import { ChildPhotoUpdateService } from './services/child-photo-update.service';
import {BackupService} from './services/backup.service';
import { ExportDataComponent } from './export-data/export-data.component';
import {MatIconModule} from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    MatButtonModule,
    MatSnackBarModule,
    PapaParseModule,
    AlertsModule,
    UiHelperModule,
    EntityModule,
    HttpClientModule,
    MatIconModule,
  ],
  declarations: [AdminComponent, ExportDataComponent],
  providers: [
    AdminGuard,
    ChildPhotoUpdateService,
    BackupService,
    ExportDataComponent,
  ],
  exports: [
    ExportDataComponent
  ]
})
export class AdminModule { }
