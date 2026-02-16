import { Component, Input, ViewChild, inject } from "@angular/core";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { ConfirmationDialogButton } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { RollCallComponent } from "./roll-call/roll-call.component";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RollCallSetupComponent } from "./roll-call-setup/roll-call-setup.component";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { RouteTarget } from "#src/app/route-target";

@RouteTarget("AddDayAttendance")
@Component({
  selector: "app-add-day-attendance",
  templateUrl: "./add-day-attendance.component.html",
  styleUrls: ["./add-day-attendance.component.scss"],
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
    RollCallSetupComponent,
    RollCallComponent,
    ViewTitleComponent,
  ],
})
export class AddDayAttendanceComponent {
  private entityMapper = inject(EntityMapperService);
  private confirmationDialog = inject(ConfirmationDialogService);

  /** (optional) property name of the participant entities by which they are sorted for the roll call */
  @Input() sortParticipantsBy: string;

  currentStage = 0;

  day = new Date();

  event: Note;

  @ViewChild(RollCallComponent) rollCallComponent: RollCallComponent;

  readonly buttons: ConfirmationDialogButton[] = [
    {
      text: $localize`Save`,
      click: (): boolean => {
        this.saveRollCallResult(this.event).then(() => {
          this.finishRollCallState();
        });
        return true;
      },
    },
    {
      text: $localize`:Discard changes made to a form:Discard`,
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

  finishBasicInformationStage(event: Note) {
    this.event = event;
    this.currentStage = 1;
  }

  exit() {
    if (this.rollCallComponent?.isDirty) {
      this.confirmationDialog.getConfirmation(
        $localize`:Exit from the current screen:Exit`,
        $localize`Do you want to save your progress before going back?`,
        this.buttons,
        true,
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
