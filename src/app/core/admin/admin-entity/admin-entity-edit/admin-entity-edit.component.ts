import { Component, Input, OnInit } from "@angular/core";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { MatButtonModule } from "@angular/material/button";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { NgIf } from "@angular/common";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityListConfig } from "app/core/entity-list/EntityListConfig";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";

@Component({
  selector: "app-admin-entity-edit",
  standalone: true,
  templateUrl: "./admin-entity-edit.component.html",
  styleUrl: "./admin-entity-edit.component.scss",
  imports: [
    MatButtonModule,
    DialogCloseComponent,
    MatInputModule,
    ErrorHintComponent,
    FormsModule,
    NgIf,
    MatTabsModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
    BasicAutocompleteComponent,
  ],
})
export class AdminEntityEditComponent implements OnInit {
  @Input() entityConstructor: EntityConstructor;

  form: FormGroup;
  constructor(private fb: FormBuilder) {}
  ngOnInit(): void {
    this.init();
  }

  private init() {
    this.form = this.fb.group({
      staticDetails: this.fb.group({
        label: [this.entityConstructor.label, Validators.required],
        labelPlural: [this.entityConstructor.labelPlural],
        icon: [this.entityConstructor.icon, Validators.required],
        toStringAttributes: [
          this.entityConstructor.toStringAttributes,
          Validators.required,
        ],
      }),
    });
  }
}
