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
  async executeMailto(
    entities: Entity | Entity[],
    entityType?: EntityConstructor<Entity>,
  ): Promise<boolean> {
    const isBulk = Array.isArray(entities);
    const entityList = isBulk ? entities : [entities];

    const entityConstructor =
      entityType ?? this.entityRegistry.get(entityList[0].getType());

    const { recipients, excludedEntities } = this.getEmailsForEntities(
      entityList,
      entityConstructor,
    );

    if (!recipients.length) {
      this.alertService.addWarning(
        $localize`Please fill an email address for this record to use this functionality.`,
      );
      return false;
    }

    const filteredEntities = entityList.filter(
      (e) => !excludedEntities.includes(e),
    );

    const result = await this.selectTemplate(
      filteredEntities[0],
      excludedEntities.length,
    );
    if (!result) return false;

    const { template, createNote } = result;
    const mailto = this.buildMailtoLink(
      isBulk ? recipients : recipients[0],
      template.subject,
      template.body,
      isBulk,
    );

    window.location.href = mailto;

    // Only offer to create/edit a note if the user opted in
    if (createNote) {
      await this.showConfirmationAndOpenNote(filteredEntities, template);
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

  private async selectTemplate(
    entity: Entity,
    excludedCount: number,
  ): Promise<{ template: EmailTemplate; createNote: boolean } | undefined> {
    const dialogRef = this.dialog.open(EmailTemplateSelectionDialogComponent, {
      data: { entity, excludedCount },
    });
    return await lastValueFrom(dialogRef.afterClosed());
  }

  public buildMailtoLink(
    recipientOrBcc: string | string[],
    subject: string,
    body: string,
    isBcc = false,
  ): string {
    const params: string[] = [];
    if (isBcc && Array.isArray(recipientOrBcc)) {
      params.push(`bcc=${encodeURIComponent(recipientOrBcc.join(","))}`);
    } else {
      params.push(`to=${encodeURIComponent(recipientOrBcc as string)}`);
    }
    params.push(`subject=${encodeURIComponent(subject.trim())}`);
    params.push(`body=${encodeURIComponent(body)}`);

    if (isBcc) {
      return `mailto:?${params.join("&")}`;
    } else {
      return `mailto:${encodeURIComponent(recipientOrBcc as string)}${params.length ? `?${params.join("&")}` : ""}`;
    }
  }

  private async showConfirmationAndOpenNote(
    entities: Entity[],
    template: EmailTemplate,
  ) {
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: $localize`Opening email on your device...`,
        text: $localize`If nothing is happening, please check your default email client. <a href="https://chatwoot.help/hc/aam-digital/articles/1756720692-send-e_mail-and-use-mail-templates" target="_blank">link to user guide</a>`,
        closeButton: true,
      },
    });

    setTimeout(() => {
      confirmDialogRef.close();
      const entityType = (Array.isArray(entities) ? entities[0] : entities)
        .constructor as EntityConstructor<Entity>;

      const note = this.prefilledNote(entities, entityType, template);
      this.formDialog.openView(note, "NoteDetails");
    }, 5000);
  }

  private prefilledNote(
    entities: Entity[],
    entityType: EntityConstructor<Entity>,
    template: EmailTemplate,
  ): Note {
    const note = new Note();
    const isBulk = entities.length > 1;

    note.subject = isBulk ? $localize`Mass mail sent` : template.subject;
    note.text = template.body;
    note.category = template.category;

    const relatedProperty = Note.getPropertyFor(entityType.ENTITY_TYPE);
    note[relatedProperty] = entities.map((e) => e.getId());

    return note;
  }

  private getEmailsForEntities(
    entities: Entity[],
    entityType: EntityConstructor<Entity>,
  ): { recipients: string[]; excludedEntities: Entity[] } {
    const emailFieldId = this.findFirstEmailFieldId(entityType);
    if (!emailFieldId) return { recipients: [], excludedEntities: entities };

    const recipients = new Set<string>();
    const excludedEntities: Entity[] = [];

    for (const e of entities) {
      const value = e[emailFieldId];
      if (value) {
        recipients.add(value);
      } else {
        excludedEntities.push(e);
      }
    }

    return { recipients: Array.from(recipients), excludedEntities };
  }

  /** Find the first field id with EmailDatatype in the schema */
  private findFirstEmailFieldId(
    entityType: EntityConstructor<Entity>,
  ): string | null {
    for (const [, field] of entityType.schema.entries()) {
      if (field.dataType === EmailDatatype.dataType) {
        return field.id;
      }
    }
    return null;
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
