import { TestBed } from '@angular/core/testing';

import { GeoInformationService } from './geo-information.service';

describe('GeoInformationService', () => {
  let service: GeoInformationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoInformationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
