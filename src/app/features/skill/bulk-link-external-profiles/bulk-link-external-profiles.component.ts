import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { Entity } from "app/core/entity/model/entity";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { ViewActionsComponent } from "../../../core/common-components/view-actions/view-actions.component";
import { MatButton } from "@angular/material/button";
import { MatDialog, MatDialogClose } from "@angular/material/dialog";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from "@angular/material/table";
import { EntityBlockComponent } from "../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { ExternalProfile } from "../external-profile";
import { SkillApiService } from "../skill-api.service";
import { MatSort, MatSortModule } from "@angular/material/sort";
import {
  LinkExternalProfileDialogComponent,
  LinkExternalProfileDialogData,
} from "../link-external-profile/link-external-profile-dialog/link-external-profile-dialog.component";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { EntitySchema } from "../../../core/entity/schema/entity-schema";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { Logging } from "../../../core/logging/logging.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";

@Component({
  selector: "app-bulk-link-external-profiles",
  standalone: true,
  imports: [
    ViewTitleComponent,
    ViewActionsComponent,
    MatButton,
    MatDialogClose,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    EntityBlockComponent,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatSortModule,
    MatProgressSpinner,
  ],
  templateUrl: "./bulk-link-external-profiles.component.html",
  styleUrl: "./bulk-link-external-profiles.component.scss",
})
export class BulkLinkExternalProfilesComponent implements OnChanges {
  private skillApi: SkillApiService = inject(SkillApiService);
  private dialog: MatDialog = inject(MatDialog);
  private entityMapper: EntityMapperService = inject(EntityMapperService);

  /**
   * The bulk-selected entities for which to search external profiles.
   */
  @Input() entities: Entity[];
  @Input() config: FormFieldConfig;

  records: MatTableDataSource<RecordMatching>;

  @ViewChild(MatSort, { static: false }) set sort(sort: MatSort) {
    if (this.records) {
      this.records.sort = sort;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entities) {
      this.init();
    }
  }

  private init() {
    if (!this.config && this.entities?.[0]) {
      // TODO: handle cases with multiple "external profile" fields (add dropdown to UI here?)

      const inferredExtField = this.inferExternalProfileFieldFromEntitySchema(
        this.entities[0].getSchema(),
      );
      if (inferredExtField) {
        this.config = inferredExtField;
      }
    }

    if (!this.entities || !this.config) {
      // abort
      Logging.debug(
        "BulkLinkExternalProfilesComponent: aborting init due to missing entities or config",
        this.entities,
        this.config,
      );
      return;
    }

    this.records = new MatTableDataSource(
      this.entities.map((entity) => {
        const record: RecordMatching = { entity };

        this.skillApi
          .getExternalProfilesForEntity(entity, this.config.additional)
          .subscribe((profiles) => {
            record.possibleMatches = profiles;
            record.possibleMatchesCount = profiles.length;
            if (profiles?.length === 1) {
              record.selected = profiles[0];
            }
          });

        return record;
      }),
    );
  }

  editMatch(record: RecordMatching) {
    this.dialog
      .open(LinkExternalProfileDialogComponent, {
        data: {
          entity: record.entity,
          config: this.config.additional,
          possibleMatches: record.possibleMatches,
        } as LinkExternalProfileDialogData,
      })
      .afterClosed()
      .subscribe((result: ExternalProfile | undefined) => {
        if (result) {
          record.selected = result;
        }
      });
  }

  async save() {
    const newlyLinkedEntities = this.records.data
      .filter((record) => record.selected)
      .map((record) =>
        Object.assign(record.entity, {
          [this.config.id]: record.selected.id,
        }),
      );

    await this.entityMapper.saveAll(newlyLinkedEntities);

    // TODO: update/import skills for all those newly linked bulk also?
  }

  private inferExternalProfileFieldFromEntitySchema(
    schema: EntitySchema,
  ): FormFieldConfig | undefined {
    for (const [key, field] of schema.entries()) {
      if (field.editComponent === "EditExternalProfileLink") {
        return { id: key, ...field };
      }
    }

    // TODO: throw or log warning?
    return undefined;
  }
}

interface RecordMatching {
  entity: Entity;
  possibleMatches?: ExternalProfile[];
  possibleMatchesCount?: number;
  selected?: ExternalProfile;
}
