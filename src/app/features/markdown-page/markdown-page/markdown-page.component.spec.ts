import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { MarkdownPageComponent } from "./markdown-page.component";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { MarkdownPageConfig } from "../MarkdownPageConfig";
import { DynamicComponentConfig } from "../../../core/config/dynamic-components/dynamic-component-config.interface";
import { MarkdownPageModule } from "../markdown-page.module";
import { ComponentRegistry } from "../../../dynamic-components";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MarkdownContent } from "../markdown-content";

describe("MarkdownPageComponent", () => {
  let component: MarkdownPageComponent;
  let fixture: ComponentFixture<MarkdownPageComponent>;
  let mockEntityMapper: { load: ReturnType<typeof vi.fn> };

  let mockRouteData: BehaviorSubject<
    DynamicComponentConfig<MarkdownPageConfig>
  >;

  beforeEach(waitForAsync(() => {
    mockRouteData = new BehaviorSubject({
      config: { markdownFile: "test.md" },
    });

    mockEntityMapper = { load: vi.fn() };

    TestBed.configureTestingModule({
      imports: [MarkdownPageModule, MarkdownPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: mockRouteData } },
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper,
        },
        ComponentRegistry,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownPageComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("renders entity content in the DOM when markdownEntityId resolves to a MarkdownContent entity", async () => {
    const entity = new MarkdownContent("test-entity-1");
    entity.content = "# Hello";
    mockEntityMapper.load.mockResolvedValue(entity);

    component.markdownEntityId = "test-entity-1";
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("em")).toBeNull();
    expect(fixture.nativeElement.querySelector("div[markdown]")).toBeTruthy();
  });
});
