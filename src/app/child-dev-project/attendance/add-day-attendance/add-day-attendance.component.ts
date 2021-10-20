import { Component, ViewChild } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Note } from "../../notes/model/note";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { ConfirmationDialogButton } from "../../../core/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { RollCallComponent } from "./roll-call/roll-call.component";

@Component({
  selector: "app-add-day-attendance",
  templateUrl: "./add-day-attendance.component.html",
  styleUrls: ["./add-day-attendance.component.scss"],
})
export class AddDayAttendanceComponent {
  currentStage = 0;

  day = new Date();

  event: Note;

  @ViewChild(RollCallComponent) rollCallComponent: RollCallComponent;

  readonly buttons: ConfirmationDialogButton[] = [
    {
      text: "Save",
      click: (): boolean => {
        this.saveRollCallResult(this.event).then(() => {
          this.finishRollCallState();
        });
        return true;
      },
    },
    {
      text: "Discard",
      click: (): boolean => {
        this.finishRollCallState();
        return false;
      },
    },
  ];

  stages = [
    $localize`:One of the stages while recording child-attendances:Select Event`,
    $localize`:One of the stages while recording child-attendances:Record Attendance`,
  ];

  constructor(
    private entityMapper: EntityMapperService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  finishBasicInformationStage(event: Note) {
    this.event = event;
    this.currentStage = 1;
  }

  exit() {
    if (this.rollCallComponent?.isDirty) {
      this.confirmationDialog.openDialog(
        "Exit",
        "Do you want to save your progress before going back?",
        this.buttons,
        true
      );
    } else {
      this.finishRollCallState();
    }
  }

  finishRollCallState() {
    this.currentStage = 0;
  }

  async saveRollCallResult(eventNote: Note) {
    await this.entityMapper.save(eventNote);
  }
}
