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
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../../../core/entity/entity-mapper/mock-entity-mapper-service";

describe("TemplateExportApiService", () => {
  let service: TemplateExportApiService;

  let entityMapper: MockEntityMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...mockEntityMapperProvider(),
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

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
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

    const mockPOST = vi
      .spyOn(TestBed.inject(HttpClient), "post")
      .mockReturnValue(of({ templateId: "TEST_ID" }));

    const result = await lastValueFrom(
      service.uploadFile(mockFile, entity, "templateId"),
    );

    expect(result).toBe("TEST_ID");
    expect(mockPOST).toHaveBeenCalledWith(
      service.API_URL + "/template",
      expect.any(FormData),
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
    const mockPOST = vi.spyOn(TestBed.inject(HttpClient), "post");

    await expect(
      lastValueFrom(service.uploadFile(mockFile, entity, "templateId")),
    ).rejects.toThrowError();
    expect(mockPOST).not.toHaveBeenCalled();
  });

  it("should request a generated file from API and use Content-Disposition", async () => {
    const templateEntity = new TemplateExport("test-template-id");
    const dataEntity = { name: "abc" };

    const mockResponse = new HttpResponse({
      body: new ArrayBuffer(10),
      headers: new HttpHeaders({
        "Content-Disposition": 'filename="cert_John%20Doe.pdf"',
      }),
      status: 200,
    });
    const mockApiResponse = vi
      .spyOn(TestBed.inject(HttpClient), "post")
      .mockReturnValue(of(mockResponse));

    const result = await lastValueFrom(
      service.generatePdfFromTemplate(templateEntity, dataEntity),
    );

    expect(result).toEqual({
      filename: "cert_John Doe.pdf",
      file: mockResponse.body,
    });
    expect(mockApiResponse).toHaveBeenCalledWith(
      service.API_URL + "/render/" + templateEntity.getId(),
      {
        convertTo: "pdf",
        data: dataEntity,
      },
      expect.any(Object),
    );
  });

  it("should request a generated file from API with default fileName derived from the template title", async () => {
    const templateEntity = new TemplateExport("test-template-id");
    templateEntity.title = "My Welcome Letter";
    const dataEntity = { name: "abc" };

    const mockResponse = new HttpResponse({
      body: new ArrayBuffer(10),
      status: 200,
    });
    const mockApiResponse = vi
      .spyOn(TestBed.inject(HttpClient), "post")
      .mockReturnValue(of(mockResponse));

    const result = await lastValueFrom(
      service.generatePdfFromTemplate(templateEntity, dataEntity),
    );

    expect(result).toEqual({
      filename: "My Welcome Letter",
      file: mockResponse.body,
    });
    expect(mockApiResponse).toHaveBeenCalledWith(
      service.API_URL + "/render/" + templateEntity.getId(),
      {
        convertTo: "pdf",
        data: dataEntity,
      },
      expect.any(Object),
    );
  });

  it("should call the render-batch endpoint with the array and parse Content-Disposition (zip mode)", async () => {
    const templateEntity = new TemplateExport("test-template-id");
    const dataList = [{ name: "A" }, { name: "B" }, { name: "C" }];

    const mockResponse = new HttpResponse({
      body: new ArrayBuffer(20),
      headers: new HttpHeaders({
        "Content-Disposition": 'attachment; filename="report.zip"',
      }),
      status: 200,
    });
    const mockApiResponse = vi
      .spyOn(TestBed.inject(HttpClient), "post")
      .mockReturnValue(of(mockResponse));

    const result = await lastValueFrom(
      service.generateBatchFromTemplate(templateEntity, dataList),
    );

    expect(result).toEqual({
      filename: "report.zip",
      file: mockResponse.body,
    });
    expect(mockApiResponse).toHaveBeenCalledWith(
      service.API_URL + "/render-batch/" + templateEntity.getId() + "?mode=zip",
      {
        convertTo: "pdf",
        data: dataList,
      },
      expect.any(Object),
    );
  });

  it("should fall back to a title-based .zip filename when batch response omits headers in zip mode", async () => {
    const templateEntity = new TemplateExport("test-template-id");
    templateEntity.title = "Welcome Letter";
    const mockResponse = new HttpResponse({
      body: new ArrayBuffer(4),
      status: 200,
    });
    vi.spyOn(TestBed.inject(HttpClient), "post").mockReturnValue(
      of(mockResponse),
    );

    const result = await lastValueFrom(
      service.generateBatchFromTemplate(templateEntity, [{}, {}]),
    );

    expect(result.filename).toBe("Welcome Letter.zip");
  });

  it("should call the render-batch endpoint in combined mode with a title-based .pdf fallback filename", async () => {
    const templateEntity = new TemplateExport("test-template-id");
    templateEntity.title = "Welcome Letter";
    const dataList = [{ name: "A" }, { name: "B" }];

    const mockResponse = new HttpResponse({
      body: new ArrayBuffer(12),
      status: 200,
    });
    const mockApiResponse = vi
      .spyOn(TestBed.inject(HttpClient), "post")
      .mockReturnValue(of(mockResponse));

    const result = await lastValueFrom(
      service.generateBatchFromTemplate(templateEntity, dataList, "combined"),
    );

    expect(mockApiResponse).toHaveBeenCalledWith(
      service.API_URL +
        "/render-batch/" +
        templateEntity.getId() +
        "?mode=combined",
      { convertTo: "pdf", data: dataList },
      expect.any(Object),
    );
    expect(result.filename).toBe("Welcome Letter.pdf");
  });
});
