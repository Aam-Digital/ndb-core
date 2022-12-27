import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from "@angular/material/legacy-autocomplete";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatLegacyCardModule as MatCardModule } from "@angular/material/legacy-card";
import { MatLegacyCheckboxModule as MatCheckboxModule } from "@angular/material/legacy-checkbox";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { SchoolBlockComponent } from "./school-block/school-block.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatLegacyPaginatorModule as MatPaginatorModule } from "@angular/material/legacy-paginator";
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from "@angular/material/legacy-progress-spinner";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { RouterModule } from "@angular/router";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { Angulartics2Module } from "angulartics2";
import { EntityListModule } from "../../core/entity-components/entity-list/entity-list.module";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ViewModule } from "../../core/view/view.module";
import { ActivitiesOverviewComponent } from "./activities-overview/activities-overview.component";
import { MatLegacySlideToggleModule as MatSlideToggleModule } from "@angular/material/legacy-slide-toggle";
import { ChildSchoolOverviewComponent } from "./child-school-overview/child-school-overview.component";
import { CommonComponentsModule } from "../../core/common-components/common-components.module";

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatExpansionModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatSortModule,
    MatSidenavModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatTooltipModule,
    Angulartics2Module,
    EntityListModule,
    EntitySubrecordModule,
    FontAwesomeModule,
    ViewModule,
    MatSlideToggleModule,
    CommonComponentsModule,
  ],
  declarations: [
    SchoolBlockComponent,
    ActivitiesOverviewComponent,
    ChildSchoolOverviewComponent,
  ],
  exports: [SchoolBlockComponent, ChildSchoolOverviewComponent],
  providers: [DatePipe],
})
export class SchoolsModule {
  static dynamicComponents = [
    ChildSchoolOverviewComponent,
    SchoolBlockComponent,
    ActivitiesOverviewComponent,
  ];
}
