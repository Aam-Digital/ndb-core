import { TestBed } from "@angular/core/testing";

import { TemplateExportApiService } from "./template-export-api.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { SyncStateSubject } from "../../../core/session/session-type";
import { lastValueFrom, of } from "rxjs";
import { SyncState } from "../../../core/session/session-states/sync-state.enum";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  HttpClient,
  HttpHeaders,
  HttpResponse,
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { TemplateExport } from "../template-export.entity";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../core/entity/entity-mapper/mock-entity-mapper-service";

describe("TemplateExportApiService", () => {
  let service: TemplateExportApiService;

  let entityMapper: MockEntityMapperService;

  beforeEach(() => {
    entityMapper = mockEntityMapper();

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        EntityRegistry,
        {
          provide: SyncStateSubject,
          useValue: of(SyncState.COMPLETED),
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TemplateExportApiService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should skip deletion requests silently", async () => {
    const templateEntity = new TemplateExport();

    const resultOne = await lastValueFrom(
      service.removeFile(templateEntity, "templateId"),
    );
    expect(resultOne).toBe(true);

    const resultAll = await lastValueFrom(
      service.removeAllFiles(templateEntity),
    );
    expect(resultAll).toBe(true);
  });

  it("should upload file", async () => {
    const entity = new TemplateExport();
    const mockFile = new File([""], "filename");

    const mockPOST = spyOn(TestBed.inject(HttpClient), "post").and.returnValue(
      of({ templateId: "TEST_ID" }),
    );

    const result = await lastValueFrom(
      service.uploadFile(mockFile, entity, "templateId"),
    );

    expect(result).toBe("TEST_ID");
    expect(mockPOST).toHaveBeenCalledWith(
      service.BACKEND_URL + "template",
      jasmine.any(FormData),
    );

    const finalEntity = entityMapper.get(
      entity.getType(),
      entity.getId(),
    ) as TemplateExport;
    expect(finalEntity.templateId).toBe("TEST_ID");
  });

  it("should throw error trying to upload while offline", async () => {
    const entity = new TemplateExport();
    const mockFile = new File([""], "filename");

    // @ts-ignore
    TestBed.inject(NAVIGATOR_TOKEN).onLine = false;
    const mockPOST = spyOn(TestBed.inject(HttpClient), "post");

    await expectAsync(
      lastValueFrom(service.uploadFile(mockFile, entity, "templateId")),
    ).toBeRejectedWithError();
    expect(mockPOST).not.toHaveBeenCalled();
  });

  it("should request a generated file from API", async () => {
    const templateEntity = new TemplateExport("test-template-id");
    const dataEntity = { name: "abc" };

    const mockResponse = new HttpResponse({
      body: new ArrayBuffer(10),
      headers: new HttpHeaders({
        "Content-Disposition": 'filename="cert_John%20Doe.pdf"',
      }),
      status: 200,
    });
    const mockApiResponse = spyOn(
      TestBed.inject(HttpClient),
      "post",
    ).and.returnValue(of(mockResponse));

    const result = await lastValueFrom(
      service.generatePdfFromTemplate(templateEntity.getId(), dataEntity),
    );

    expect(result).toEqual({
      filename: "cert_John Doe.pdf",
      file: mockResponse.body,
    });
    expect(mockApiResponse).toHaveBeenCalledWith(
      service.BACKEND_URL + "render/" + templateEntity.getId(),
      {
        convertTo: "pdf",
        data: dataEntity,
      },
      jasmine.any(Object),
    );
  });
});
