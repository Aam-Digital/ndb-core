import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ViewFileComponent } from "./view-file.component";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatButtonHarness } from "@angular/material/button/testing";
import { Entity } from "../../../core/entity/model/entity";
import { FileService } from "../file.service";

describe("ViewFileComponent", () => {
  let component: ViewFileComponent;
  let fixture: ComponentFixture<ViewFileComponent>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    mockFileService = jasmine.createSpyObj(["showFile"]);
    await TestBed.configureTestingModule({
      imports: [ViewFileComponent],
      providers: [{ provide: FileService, useValue: mockFileService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewFileComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    component.value = "test.file";
    component.entity = new Entity();
    component.id = "fileProp";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show file when clicking the button", async () => {
    const button = await loader.getHarness(MatButtonHarness);

    await expectAsync(button.getText()).toBeResolvedTo("test.file");

    await button.click();

    expect(mockFileService.showFile).toHaveBeenCalledWith(
      component.entity,
      component.id,
    );
  });

  it("should prevent event bubbling so click is only captured on button", () => {
    const event = { stopPropagation: jasmine.createSpy() };

    component.showFile(event as any);

    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
