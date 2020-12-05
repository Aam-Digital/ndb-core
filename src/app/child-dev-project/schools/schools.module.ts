import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SchoolsListComponent } from "./schools-list/schools-list.component";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialogModule } from "@angular/material/dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { SchoolDetailsComponent } from "./school-details/school-details.component";
import { SchoolBlockComponent } from "./school-block/school-block.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { EntitySubrecordModule } from "../../core/entity-subrecord/entity-subrecord.module";
import { RouterModule } from "@angular/router";
import { SchoolsService } from "./schools.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Angulartics2Module } from "angulartics2";
import { EntityListModule } from "../../core/entity-list/entity-list.module";
import { ChildrenOverviewComponent } from "./children-overview/children-overview.component";

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatExpansionModule,
    MatButtonModule,
    FlexLayoutModule,
    MatSnackBarModule,
    MatIconModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatSortModule,
    MatSidenavModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatAutocompleteModule,
    EntitySubrecordModule,
    ReactiveFormsModule,
    MatTooltipModule,
    Angulartics2Module,
    EntityListModule,
  ],
  declarations: [
    SchoolBlockComponent,
    SchoolsListComponent,
    SchoolDetailsComponent,
    ChildrenOverviewComponent,
  ],
  exports: [SchoolBlockComponent],
  providers: [SchoolsService],
})
export class SchoolsModule {}
