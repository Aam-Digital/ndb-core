import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DisplayAuditUserComponent } from "./display-audit-user.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { Router } from "@angular/router";

describe("DisplayAuditUserComponent", () => {
  let component: DisplayAuditUserComponent;
  let fixture: ComponentFixture<DisplayAuditUserComponent>;

  async function setup(user: object | undefined) {
    await TestBed.configureTestingModule({
      imports: [DisplayAuditUserComponent],
      providers: [
        { provide: EntityMapperService, useValue: { load: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayAuditUserComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("value", user);
    fixture.detectChanges();
  }

  it("should link an author recorded as a user record", async () => {
    await setup({ id: "User:demo", name: "User:demo", roles: [] });

    expect(component.userEntityId()).toBe("User:demo");
  });

  it("should show a bare username as text, having no record to link to", async () => {
    await setup({ id: "demo-admin", name: "demo-admin", roles: [] });

    expect(component.userEntityId()).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain("demo-admin");
  });

  it("should fall back to the recorded id when no name was recorded", async () => {
    await setup({ id: "demo-admin" });

    expect(component.author()).toBe("demo-admin");
  });

  it("should render a placeholder when no author was recorded", async () => {
    await setup(undefined);

    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });
});
