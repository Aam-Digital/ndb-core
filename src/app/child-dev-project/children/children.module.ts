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

import { NgModule } from "@angular/core";
import { CommonModule, DatePipe, PercentPipe } from "@angular/common";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatExpansionModule } from "@angular/material/expansion";
import { ChildrenListComponent } from "./children-list/children-list.component";
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from "@angular/material/legacy-autocomplete";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatLegacyCardModule as MatCardModule } from "@angular/material/legacy-card";
import { MatLegacyCheckboxModule as MatCheckboxModule } from "@angular/material/legacy-checkbox";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { MatLegacyListModule as MatListModule } from "@angular/material/legacy-list";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { MatLegacyChipsModule as MatChipsModule } from "@angular/material/legacy-chips";
import { ChildrenService } from "./children.service";
import { EntityCountDashboardComponent } from "./dashboard-widgets/entity-count-dashboard/entity-count-dashboard.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { SchoolsModule } from "../schools/schools.module";
import { EducationalMaterialComponent } from "./educational-material/educational-material-component/educational-material.component";
import { AserComponent } from "./aser/aser-component/aser.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HealthCheckupComponent } from "./health-checkup/health-checkup-component/health-checkup.component";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from "@angular/material/legacy-progress-spinner";
import { FormDialogModule } from "../../core/form-dialog/form-dialog.module";
import { ConfirmationDialogModule } from "../../core/confirmation-dialog/confirmation-dialog.module";
import { MatLegacyPaginatorModule as MatPaginatorModule } from "@angular/material/legacy-paginator";
import { Angulartics2Module } from "angulartics2";
import { ViewModule } from "../../core/view/view.module";
import { ChildBlockComponent } from "./child-block/child-block.component";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { EntityListModule } from "../../core/entity-components/entity-list/entity-list.module";
import { BmiBlockComponent } from "./children-list/bmi-block/bmi-block.component";
import { ChildrenBmiDashboardComponent } from "./dashboard-widgets/children-bmi-dashboard/children-bmi-dashboard.component";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { PhotoDatatype } from "./child-photo-service/datatype-photo";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";
import { DashboardModule } from "../../core/dashboard/dashboard.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ExportModule } from "../../core/export/export.module";
import { BirthdayDashboardComponent } from "./dashboard-widgets/birthday-dashboard/birthday-dashboard.component";
import { ChildBlockTooltipComponent } from "./child-block/child-block-tooltip/child-block-tooltip.component";
import { CommonComponentsModule } from "../../core/common-components/common-components.module";
import { EntitySelectModule } from "../../core/entity-components/entity-select/entity-select.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatSelectModule,
        MatDatepickerModule,
        MatExpansionModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatSidenavModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatSnackBarModule,
        MatProgressBarModule,
        MatAutocompleteModule,
        MatTooltipModule,
        MatChipsModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SchoolsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatListModule,
        MatProgressSpinnerModule,
        ConfirmationDialogModule,
        FormDialogModule,
        Angulartics2Module,
        ViewModule,
        EntitySubrecordModule,
        EntityListModule,
        EntityUtilsModule,
        DashboardModule,
        FontAwesomeModule,
        ExportModule,
        CommonComponentsModule,
        EntitySelectModule,
    ],
  declarations: [
    ChildBlockComponent,
    ChildrenListComponent,
    EntityCountDashboardComponent,
    EducationalMaterialComponent,
    AserComponent,
    HealthCheckupComponent,
    BmiBlockComponent,
    ChildrenBmiDashboardComponent,
    BirthdayDashboardComponent,
    ChildBlockTooltipComponent,
  ],
  providers: [ChildrenService, DatePipe, PercentPipe],
  exports: [ChildBlockComponent, BirthdayDashboardComponent],
})
export class ChildrenModule {
  static dynamicComponents = [
    ChildrenListComponent,
    AserComponent,
    ChildBlockComponent,
    EntityCountDashboardComponent,
    ChildrenBmiDashboardComponent,
    BmiBlockComponent,
    EducationalMaterialComponent,
    HealthCheckupComponent,
    BirthdayDashboardComponent,
  ];

  constructor(entitySchemaService: EntitySchemaService) {
    entitySchemaService.registerSchemaDatatype(new PhotoDatatype());
  }
}
