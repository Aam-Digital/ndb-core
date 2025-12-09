import { EmailDatatype } from "#src/app/core/basic-datatypes/string/email.datatype";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { inject, Injectable } from "@angular/core";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { MatDialog } from "@angular/material/dialog";
import {
  EmailTemplateSelectionDialogComponent,
  EmailTemplateSelectionDialogData,
  EmailTemplateSelectionResult,
} from "./email-template-selection-dialog/email-template-selection-dialog.component";
import { lastValueFrom } from "rxjs";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { EmailTemplate } from "./email-template.entity";
import {
  ConfirmationDialogComponent,
  ConfirmationDialogConfig,
} from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { asArray } from "#src/app/utils/asArray";
import { WINDOW_TOKEN } from "#src/app/utils/di-tokens";

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
  private readonly window = inject(WINDOW_TOKEN);

  /**
   * Build a mailto link from an entity's email fields and open the local mail client.
   *
   * If no default email client is available on the device / configured in the browser, then nothing will happen here.
   */
  async executeMailto(entities: Entity | Entity[]): Promise<boolean> {
    const isBulk = Array.isArray(entities);
    const entityList = isBulk ? entities : [entities];

    const { recipients, excludedEntities } =
      this.getEmailsForEntities(entityList);

    if (!recipients.length) {
      await this.dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: $localize`Email Error`,
            text: $localize`Please fill an email address for this record to use this functionality.`,
            buttons: [
              {
                text: $localize`:Confirmation dialog OK:OK`,
                dialogResult: true,
                click() {},
              },
            ],
          } as ConfirmationDialogConfig,
        })
        .afterClosed()
        .toPromise();
      return false;
    }

    const filteredEntities = entityList.filter(
      (e) => !excludedEntities.includes(e),
    );

    const result = await this.selectTemplate(
      filteredEntities[0],
      excludedEntities.length,
      isBulk,
    );
    if (!result) return false;

    const { template, createNote, sendAsBCC, sendSemicolonSeparated } = result;
    const mailto = this.buildMailtoLink(
      isBulk
        ? asArray(recipients).join(sendSemicolonSeparated ? ";" : ",")
        : recipients[0],
      template.subject,
      template.body,
      sendAsBCC,
    );

    this.window.location.href = mailto;

    this.showConfirmationAndOpenNote(filteredEntities, template, createNote);
    return true;
  }

  private async selectTemplate(
    entity: Entity,
    excludedEntitiesCount: number,
    isBulk: boolean,
  ): Promise<EmailTemplateSelectionResult | undefined> {
    const dialogRef = this.dialog.open(EmailTemplateSelectionDialogComponent, {
      data: {
        entity,
        excludedEntitiesCount,
        isBulk,
      } as EmailTemplateSelectionDialogData,
    });
    return await lastValueFrom(dialogRef.afterClosed());
  }

  public buildMailtoLink(
    recipients: string,
    subject: string,
    body: string,
    sendAsBCC = false,
  ): string {
    let recipientsString = encodeURIComponent(recipients);

    const params: string[] = [];
    params.push(`subject=${encodeURIComponent(subject.trim())}`);
    params.push(`body=${encodeURIComponent(body)}`);

    if (sendAsBCC) {
      return `mailto:?bcc=${recipientsString}&${params.join("&")}`;
    } else {
      return `mailto:${recipientsString}${params.length ? "?" : ""}${params.join("&")}`;
    }
  }

  private async showConfirmationAndOpenNote(
    entities: Entity[],
    template: EmailTemplate,
    createNote: boolean,
  ) {
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: $localize`Opening email on your device...`,
        text: $localize`If nothing is happening, please check your default email client. <a href="https://chatwoot.help/hc/aam-digital/articles/1756720692-send-e_mail-and-use-mail-templates" target="_blank">link to user guide</a>`,
        closeButton: true,
        buttons: [{ text: $localize`Continue` }],
      } as ConfirmationDialogConfig,
    });

    setTimeout(() => {
      confirmDialogRef.close();

      // Only offer to create/edit a note if the user opted in
      if (createNote) {
        const note = this.prefilledNote(entities, template);
        this.formDialog.openView(note, "NoteDetails");
      }
    }, EmailClientService.EMAIL_CLIENT_WAIT_DURATION);
  }

  private prefilledNote(entities: Entity[], template: EmailTemplate): Note {
    const note = new Note();

    note.subject = template.subject;
    note.text = template.body;
    note.category = template.category;

    const entityType = (Array.isArray(entities) ? entities[0] : entities)
      .constructor as EntityConstructor<Entity>;
    const relatedProperty = Note.getPropertyFor(entityType.ENTITY_TYPE);
    note[relatedProperty] = entities.map((e) => e.getId());

    return note;
  }

  private getEmailsForEntities(entities: Entity[]): {
    recipients: string[];
    excludedEntities: Entity[];
  } {
    const emailFieldId = this.findFirstEmailFieldId(
      entities?.[0].getConstructor(),
    );
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
    if (!entityType) return null;

    for (const [, field] of entityType.schema.entries()) {
      if (field.dataType === EmailDatatype.dataType) {
        return field.id;
      }
    }
    return null;
  }
}
