import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ImportMetadata } from "../import-metadata";
import { ImportService } from "../import.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";

@Component({
  selector: "app-import-history",
  templateUrl: "./import-history.component.html",
  styleUrls: ["./import-history.component.scss"],
})
export class ImportHistoryComponent implements OnInit {
  @Input() highlightedPreviousImport: ImportMetadata;

  @Output() itemSelected = new EventEmitter<ImportMetadata>();

  previousImports: ImportMetadata[];

  constructor(
    private entityMapper: EntityMapperService,
    private importService: ImportService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadPreviousImports();
  }

  private async loadPreviousImports() {
    this.previousImports = (
      await this.entityMapper.loadType<ImportMetadata>(ImportMetadata)
    ).sort((a, b) => b.date.getTime() - a.date.getTime());

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
