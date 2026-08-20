import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { provideMarkdown } from "ngx-markdown";
import {
  ConfirmationDialogComponent,
  ConfirmationDialogConfig,
  YesNoButtons,
} from "./confirmation-dialog.component";

describe("ConfirmationDialogComponent", () => {
  let fixture: ComponentFixture<ConfirmationDialogComponent>;

  async function createComponent(data: Partial<ConfirmationDialogConfig>) {
    TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
      providers: [
        provideMarkdown(),
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: "Title",
            text: "",
            buttons: YesNoButtons,
            ...data,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    fixture.detectChanges();
    // markdown parsing is asynchronous, so let it settle before asserting on the DOM
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  it("should create", async () => {
    await createComponent({ title: "test title", text: "test text" });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render a multi-paragraph markdown text with formatting", async () => {
    // dialog texts of destructive admin actions rely on this to structure their warning
    await createComponent({
      text: `**IMPORTANT: Are you sure?**

This deletes all records.

This cannot be reverted.`,
    });

    const content: HTMLElement = fixture.nativeElement.querySelector(
      "[mat-dialog-content]",
    );
    expect(content.querySelectorAll("p")).toHaveLength(3);
    expect(content.querySelector("strong").textContent).toBe(
      "IMPORTANT: Are you sure?",
    );
    expect(content.textContent).not.toContain("**");
  });

  describe("with a required confirmation keyword", () => {
    /** the buttons rendered in the dialog, in the order of `YesNoButtons` */
    function getButtons(): HTMLButtonElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll("[mat-dialog-actions] button"),
      );
    }

    function typeConfirmation(value: string) {
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector("input");
      input.value = value;
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();
    }

    it("should not show an input if no keyword is required", async () => {
      await createComponent({ text: "no keyword needed" });

      expect(fixture.nativeElement.querySelector("input")).toBeNull();
      expect(getButtons().every((button) => !button.disabled)).toBe(true);
    });

    it("should block confirming until the keyword is typed correctly", async () => {
      await createComponent({ text: "sure?", confirmationKeyword: "delete" });
      const [confirmButton, cancelButton] = getButtons();

      expect(confirmButton.disabled).toBe(true);
      // aborting the action must always stay possible
      expect(cancelButton.disabled).toBe(false);

      typeConfirmation("del");
      expect(confirmButton.disabled).toBe(true);

      typeConfirmation("delete");
      expect(confirmButton.disabled).toBe(false);
    });

    it("should accept the keyword regardless of case and surrounding whitespace", async () => {
      await createComponent({ text: "sure?", confirmationKeyword: "delete" });

      typeConfirmation("  DeLeTe ");

      expect(getButtons()[0].disabled).toBe(false);
    });

    it("should block confirming again when the keyword is removed", async () => {
      await createComponent({ text: "sure?", confirmationKeyword: "delete" });

      typeConfirmation("delete");
      typeConfirmation("");

      expect(getButtons()[0].disabled).toBe(true);
    });
  });
});
