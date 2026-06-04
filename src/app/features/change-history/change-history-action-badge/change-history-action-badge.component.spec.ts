import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ChangeHistoryActionBadgeComponent } from "./change-history-action-badge.component";
import { ACTION_META, ChangeAction } from "../change-history.types";

async function render(
  action: ChangeAction,
): Promise<ComponentFixture<ChangeHistoryActionBadgeComponent>> {
  await TestBed.configureTestingModule({
    imports: [ChangeHistoryActionBadgeComponent, FontAwesomeTestingModule],
  }).compileComponents();
  const fixture = TestBed.createComponent(ChangeHistoryActionBadgeComponent);
  fixture.componentRef.setInput("action", action);
  fixture.detectChanges();
  return fixture;
}

it("renders the label and colors for a known action", async () => {
  const fixture = await render("deleted");
  const badge = fixture.nativeElement.querySelector(".badge");
  expect(badge.textContent).toContain(ACTION_META.deleted.label);
  expect(badge.style.backgroundColor).toBeTruthy();
  expect(badge.style.color).toBeTruthy();
});

it("renders the created action label", async () => {
  const fixture = await render("created");
  expect(fixture.nativeElement.textContent).toContain(
    ACTION_META.created.label,
  );
});

it("falls back to the updated metadata for an unknown action", async () => {
  const fixture = await render("nonsense" as ChangeAction);
  expect(fixture.componentInstance.meta()).toBe(ACTION_META.updated);
});
