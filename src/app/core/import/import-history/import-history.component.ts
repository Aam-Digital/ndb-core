import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { ImportMetadata } from "../import-metadata";
import { ImportService } from "../import.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { applyUpdate } from "../../entity/model/entity-update";
import { MatExpansionModule } from "@angular/material/expansion";
import { CustomDatePipe } from "../../basic-datatypes/date/custom-date.pipe";
import { EntityTypeLabelPipe } from "../../common-components/entity-type-label/entity-type-label.pipe";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@UntilDestroy()
@Component({
  selector: "app-import-history",
  templateUrl: "./import-history.component.html",
  styleUrls: ["./import-history.component.scss"],
  imports: [
    MatExpansionModule,
    CustomDatePipe,
    EntityTypeLabelPipe,
    EntityBlockComponent,
    MatButtonModule,
    MatTooltipModule,
    FaIconComponent,
  ],
})
export class ImportHistoryComponent implements OnInit {
  private entityMapper = inject(EntityMapperService);
  private importService = inject(ImportService);
  private confirmationDialog = inject(ConfirmationDialogService);

  @Input() data: any[];
  @Output() itemSelected = new EventEmitter<ImportMetadata>();

  previousImports: ImportMetadata[];

  constructor() {
    this.entityMapper
      .receiveUpdates(ImportMetadata)
      .pipe(untilDestroyed(this))
      .subscribe((update) => {
        this.previousImports = applyUpdate(this.previousImports, update);
        this.sortImports();
      });
  }

  ngOnInit(): void {
    this.loadPreviousImports();
  }

  private async loadPreviousImports() {
    this.previousImports =
      await this.entityMapper.loadType<ImportMetadata>(ImportMetadata);
    this.sortImports();
  }

  private sortImports() {
    this.previousImports.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async undoImport(item: ImportMetadata) {
    const confirmation = await this.confirmationDialog.getConfirmation(
      $localize`:Import Undo Confirmation Title:Revert Import?`,
      $localize`:Import Undo Confirmation Text:Are you sure you want to undo this import? All records that had been imported at that time will be deleted from the system.`,
    );

    if (confirmation) {
      await this.importService.undoImport(item);
    }
  }
}
