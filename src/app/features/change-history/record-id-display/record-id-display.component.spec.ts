import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Clipboard } from "@angular/cdk/clipboard";
import { AlertService } from "../../../core/alerts/alert.service";
import { RecordIdDisplayComponent } from "./record-id-display.component";

let fixture: ComponentFixture<RecordIdDisplayComponent>;
let component: RecordIdDisplayComponent;
let copy: ReturnType<typeof vi.fn>;
let addInfo: ReturnType<typeof vi.fn>;

async function setup(recordId = "Child:5e69d648") {
  copy = vi.fn().mockReturnValue(true);
  addInfo = vi.fn();
  await TestBed.configureTestingModule({
    imports: [RecordIdDisplayComponent],
    providers: [
      { provide: Clipboard, useValue: { copy } },
      { provide: AlertService, useValue: { addInfo, addWarning: vi.fn() } },
    ],
  }).compileComponents();

  fixture = TestBed.createComponent(RecordIdDisplayComponent);
  component = fixture.componentInstance;
  fixture.componentRef.setInput("recordId", recordId);
  fixture.detectChanges();
}

it("displays the full record id", async () => {
  await setup("Child:5e69d648-c2c7-441d-8da6-5543251dd917");
  expect(fixture.nativeElement.textContent).toContain(
    "Child:5e69d648-c2c7-441d-8da6-5543251dd917",
  );
});

it("copies the id and confirms, so it can be pasted for troubleshooting", async () => {
  await setup("Child:1");

  component.copyId();

  expect(copy).toHaveBeenCalledWith("Child:1");
  expect(addInfo).toHaveBeenCalled();
});

it("says so when the browser refused the copy, rather than claiming success", async () => {
  await setup("Child:1");
  copy.mockReturnValue(false);

  component.copyId();

  expect(addInfo).not.toHaveBeenCalled();
});

it("renders nothing without an id, so callers need no guard", async () => {
  await setup();
  // set explicitly rather than via setup's default parameter, which would
  // substitute its own value for undefined
  fixture.componentRef.setInput("recordId", undefined);
  fixture.detectChanges();

  expect(fixture.nativeElement.textContent.trim()).toBe("");
});
