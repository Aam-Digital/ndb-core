import { EmailDatatype } from "#src/app/core/basic-datatypes/string/email.datatype";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { inject, Injectable } from "@angular/core";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { MatDialog } from "@angular/material/dialog";
import { EmailTemplateSelectionDialogComponent } from "../email-template-selection-dialog/email-template-selection-dialog.component";
import { lastValueFrom } from "rxjs";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { EmailTemplate } from "./email-template.entity";
import {
  ConfirmationDialogComponent,
  ConfirmationDialogConfig,
} from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";

@Injectable({
  providedIn: "root",
})
export class EmailClientService {
  /** milliseconds to wait for the email client to open before discarding the confirmation dialog */
  private static readonly EMAIL_CLIENT_WAIT_DURATION = 5000;

  private readonly entityRegistry = inject(EntityRegistry);
  private readonly alertService = inject(AlertService);
  private readonly dialog = inject(MatDialog);
  private readonly formDialog = inject(FormDialogService);

  /**
   * Build a mailto link from an entity's email fields and open the local mail client.
   *
   * If no default email client is available on the device / configured in the browser, then nothing will happen here.
   */
  async executeMailtoFromEntity(entity: Entity): Promise<boolean> {
    const entityType = this.entityRegistry.get(
      entity.getType(),
    ) as EntityConstructor<Entity>;

    let recipient: string | null = null;

    for (const [, field] of entityType.schema.entries()) {
      if (field.dataType === EmailDatatype.dataType) {
        const emailValue = entity[field.id];
        recipient = emailValue;
        break; // Use only the first found email field
      }
    }

    if (!recipient) {
      this.alertService.addWarning(
        "Please fill an email address for this record to use this functionality.",
      );
      return false;
    }

    const dialogRef = this.dialog.open(EmailTemplateSelectionDialogComponent, {
      data: entity,
    });
    const result: { template: EmailTemplate; createNote: boolean } | undefined =
      await lastValueFrom(dialogRef.afterClosed());

    if (!result) return false;

    const { template, createNote } = result;

    const params: string[] = [];
    const subject = template.subject?.toString().trim();
    const body = template.body?.toString();

    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);

    const mailto = `mailto:${encodeURIComponent(recipient)}${params.length ? `?${params.join("&")}` : ""}`;
    window.location.href = mailto;

    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: $localize`Opening email on your device...`,
        text: $localize`If nothing is happening, please check your default email client. <a href="https://chatwoot.help/hc/aam-digital/articles/1756720692-send-e_mail-and-use-mail-templates" target="_blank">link to user guide</a>`,
        closeButton: true,
        buttons: [{ text: $localize`Continue` }],
      } as ConfirmationDialogConfig,
    });

    setTimeout(async () => {
      confirmDialogRef.close();

      if (createNote) {
        this.formDialog.openView(
          this.prefilledNote(entity, template),
          "NoteDetails",
        );
      }
    }, EmailClientService.EMAIL_CLIENT_WAIT_DURATION);

    return true;
  }

  private prefilledNote(entity: Entity, template: EmailTemplate): Note {
    const note = new Note();

    note.subject = template.subject;
    note.text = template.body;
    note.category = template.category;
    // Note related entities (linked records) - link to the entity we sent the email
    const relatedProperty = Note.getPropertyFor(entity.getType());
    note[relatedProperty] = [entity.getId()];

    return note;
  }
}
