import { TestBed } from '@angular/core/testing';

import { ThirdPartyAuthenticationService } from './third-party-authentication.service';

describe('ThirdPartyAuthenticationService', () => {
  let service: ThirdPartyAuthenticationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThirdPartyAuthenticationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
