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
import { firstValueFrom, from, mergeMap, Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltip } from "@angular/material/tooltip";
import { PercentPipe } from "@angular/common";

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
    FaIconComponent,
    MatTooltip,
    PercentPipe,
  ],
  templateUrl: "./bulk-link-external-profiles.component.html",
  styleUrl: "./bulk-link-external-profiles.component.scss",
})
export class BulkLinkExternalProfilesComponent implements OnChanges {
  private readonly skillApi: SkillApiService = inject(SkillApiService);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly entityMapper: EntityMapperService =
    inject(EntityMapperService);

  /**
   * The bulk-selected entities for which to search external profiles.
   */
  @Input() entities: Entity[];
  @Input() config: FormFieldConfig;

  private MAX_CONCURRENT_REQUESTS = 20;

  records: MatTableDataSource<RecordMatching>;
  matchedRecordsCount: number;

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
      this.config = this.inferExternalProfileFieldFromEntitySchema(
        this.entities[0].getSchema(),
      );
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
      this.entities.map((entity) => ({ entity }) as RecordMatching),
    );
    this.matchedRecordsCount = 0;

    from(this.records.data)
      .pipe(
        mergeMap(
          (r) => this.updateRecordWithMatches(r),
          this.MAX_CONCURRENT_REQUESTS,
        ),
        tap(() => this.recalculatedMatchedRecordsCount()),
      )
      .subscribe();
  }

  /**
   * fetch possible matches for each entity asynchronously and add to record
   * @param record
   * @private
   */
  private updateRecordWithMatches(
    record: RecordMatching,
  ): Observable<RecordMatching> {
    return this.skillApi
      .getExternalProfilesForEntity(record.entity, this.config.additional)
      .pipe(
        tap(async () => this.getCurrentlySelectedProfile(record)),
        map((possibleMatches) => {
          record.possibleMatches = possibleMatches;
          record.possibleMatchesCount = possibleMatches.length;
          if (possibleMatches?.length === 1 && !record.selected) {
            record.selected = possibleMatches[0];
          }

          return record;
        }),
      );
  }

  /**
   * Check if external profile that is currently linked in the entity still exists
   * and add it as pre-selected match if so.
   * @param record
   * @private
   */
  private async getCurrentlySelectedProfile(record: RecordMatching) {
    const existingExtProfileId = record.entity[this.config.id];
    if (!existingExtProfileId) {
      return;
    }

    const currentMatch = await firstValueFrom(
      this.skillApi.getExternalProfileById(existingExtProfileId),
    ).catch((err) => {
      Logging.debug(
        "BulkLinkExternalProfilesComponent: error fetching previously selected external profile",
        err,
      );
    });

    if (currentMatch) {
      record.selected = currentMatch;
    }
  }

  private recalculatedMatchedRecordsCount() {
    this.matchedRecordsCount = this.records.data.filter(
      (record) => record.selected,
    ).length;
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
        this.recalculatedMatchedRecordsCount();
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

  unlinkMatch(element: RecordMatching) {
    element.selected = undefined;
    this.recalculatedMatchedRecordsCount();
  }
}

interface RecordMatching {
  entity: Entity;
  possibleMatches?: ExternalProfile[];
  possibleMatchesCount?: number;
  selected?: ExternalProfile;
}
