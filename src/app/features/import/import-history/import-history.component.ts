import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ImportMetadata } from "../import-metadata";
import { ImportService } from "../import.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { applyUpdate } from "../../../core/entity/model/entity-update";
import { MatExpansionModule } from "@angular/material/expansion";
import { DatePipe, NgForOf, NgIf } from "@angular/common";
import { EntityTypeLabelPipe } from "../../../core/entity-components/entity-type-label/entity-type-label.pipe";
import { DisplayEntityComponent } from "../../../core/entity-components/entity-select/display-entity/display-entity.component";
import { MatButtonModule } from "@angular/material/button";

@UntilDestroy()
@Component({
  selector: "app-import-history",
  templateUrl: "./import-history.component.html",
  styleUrls: ["./import-history.component.scss"],
  standalone: true,
  imports: [
    MatExpansionModule,
    DatePipe,
    EntityTypeLabelPipe,
    DisplayEntityComponent,
    MatButtonModule,
    NgIf,
    NgForOf,
  ],
})
export class ImportHistoryComponent implements OnInit {
  @Input() highlightedPreviousImport: ImportMetadata;

  @Output() itemSelected = new EventEmitter<ImportMetadata>();

  previousImports: ImportMetadata[];

  constructor(
    private entityMapper: EntityMapperService,
    private importService: ImportService,
    private confirmationDialog: ConfirmationDialogService
  ) {
    this.entityMapper
      .receiveUpdates(ImportMetadata)
      .pipe(untilDestroyed(this))
      .subscribe((update) => {
        this.previousImports = applyUpdate(this.previousImports, update);
        this.sortAndHighlightImports();
      });
  }

  ngOnInit(): void {
    this.loadPreviousImports();
  }

  private async loadPreviousImports() {
    this.previousImports = await this.entityMapper.loadType<ImportMetadata>(
      ImportMetadata
    );
    this.sortAndHighlightImports();
  }

  private sortAndHighlightImports() {
    this.previousImports = this.previousImports.sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    if (!this.highlightedPreviousImport) {
      this.highlightedPreviousImport = this.previousImports?.[0];
    }
  }

  async undoImport(item: ImportMetadata) {
    const confirmation = await this.confirmationDialog.getConfirmation(
      $localize`:Import Undo Confirmation Title:Revert Import?`,
      $localize`:Import Undo Confirmation Text:Are you sure you want to undo this import? All records that had been imported at that time will be delete from the system.`
    );

    if (confirmation) {
      await this.importService.undoImport(item);
    }
  }
}
