import {AlertsModule} from '../alerts/alerts.module';
import {UiHelperModule} from '../ui-helper/ui-helper.module';
import {AdminGuard} from './admin.guard';
import {ChildrenModule} from '../children/children.module';
import {EntityModule} from '../entity/entity.module';
import {ChildPhotoUpdateService} from './services/child-photo-update.service';
import { UserListComponent } from './user-list/user-list.component';
import {MatTableModule} from '@angular/material/table';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BrowserModule} from '@angular/platform-browser';
import {MatButtonModule} from '@angular/material/button';
import {PapaParseModule} from 'ngx-papaparse';
import {AdminComponent} from './admin/admin.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormsModule} from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTableModule,
    MatCheckboxModule,
    PapaParseModule,
    AlertsModule,
    UiHelperModule,
    ChildrenModule,
    EntityModule,
    HttpClientModule,
    FormsModule,

  ],
  declarations: [AdminComponent, UserListComponent],
  providers: [
    AdminGuard,
    ChildPhotoUpdateService,
  ],
})
export class AdminModule { }
