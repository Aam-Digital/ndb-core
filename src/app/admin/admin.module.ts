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
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { UserDetailsComponent } from './user-details/user-details.component';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';

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
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  declarations: [AdminComponent, UserListComponent, UserDetailsComponent],
  providers: [
    AdminGuard,
    ChildPhotoUpdateService,
  ],
  entryComponents: [UserDetailsComponent]
})
export class AdminModule { }
