import { TestBed } from '@angular/core/testing';

import { JsonEditorService } from './json-editor.service';

describe('JsonEditorService', () => {
  let service: JsonEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
