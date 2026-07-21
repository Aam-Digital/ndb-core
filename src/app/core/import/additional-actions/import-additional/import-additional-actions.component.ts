import { EditEntityComponent } from "#src/app/core/basic-datatypes/entity/edit-entity/edit-entity.component";
import {
  Component,
  inject,
  ChangeDetectionStrategy,
  input,
  model,
  computed,
  effect,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityBlockComponent } from "../../../basic-datatypes/entity/entity-block/entity-block.component";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityTypeLabelPipe } from "../../../common-components/entity-type-label/entity-type-label.pipe";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { AdditionalImportAction } from "../additional-import-action";
import { ImportAdditionalService } from "../import-additional.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { asArray } from "../../../../utils/asArray";

/**
 * Import sub-step: Let user select additional import actions like adding entities to a group entity.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-import-additional-actions",
  templateUrl: "./import-additional-actions.component.html",
  styleUrls: ["./import-additional-actions.component.scss"],
  imports: [
    MatListModule,
    FontAwesomeModule,
    MatTooltipModule,
    EntityTypeLabelPipe,
    EntityBlockComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    BasicAutocompleteComponent,
    MatButtonModule,
    EditEntityComponent,
    HelpButtonComponent,
    MatExpansionModule,
  ],
  providers: [EntityTypeLabelPipe],
})
export class ImportAdditionalActionsComponent {
  private importAdditionalService = inject(ImportAdditionalService);
  private readonly ability = inject(EntityAbility);

  entityType = input<string>();
  importActions = model<AdditionalImportAction[]>([]);

  availableImportActions = computed(() =>
    this.importAdditionalService
      .getActionsLinkingFor(this.entityType())
      // an action links imported records into a related entity, which requires
      // permission to update that related type (targetType may allow several types)
      .filter(
        (action) =>
          !this.ability.initialized ||
          asArray(action.targetType).some((type) =>
            this.ability.can("update", type),
          ),
      )
      .sort(sortExportOnlyLast),
  );

  // TODO: may need more distinction --> like in ImportModule?
  actionToString = (a: AdditionalImportAction) =>
    this.importAdditionalService.createActionLabel(a);

  linkEntityForm = new FormGroup({
    action: new FormControl({ value: "", disabled: true }, Validators.required),
    targetId: new FormControl(
      { value: "", disabled: true },
      Validators.required,
    ),
  });

  constructor() {
    this.linkEntityForm
      .get("action")
      .valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((val) =>
        !!val
          ? this.linkEntityForm.get("targetId").enable()
          : this.linkEntityForm.get("targetId").disable(),
      );

    effect(() => {
      const entityType = this.entityType();
      this.linkEntityForm.reset();
      if (entityType) {
        this.linkEntityForm.get("action").enable();
      }
    });
  }

  addAction() {
    const newAction = this.linkEntityForm.get("action").getRawValue();
    this.importActions.update((actions) => [
      ...(actions ?? []),
      {
        ...newAction,
        targetId: this.linkEntityForm.get("targetId").value,
      },
    ]);
    this.linkEntityForm.reset();
  }

  removeAction(actionToRemove: AdditionalImportAction) {
    this.importActions.update((actions) =>
      actions.filter((a) => a !== actionToRemove),
    );
  }
}

function sortExportOnlyLast(
  a: AdditionalImportAction,
  b: AdditionalImportAction,
) {
  // show "non-expert" actions first
  if (a.expertOnly === b.expertOnly) return 0;
  else if (a.expertOnly) return 1;
  else return -1;
}
