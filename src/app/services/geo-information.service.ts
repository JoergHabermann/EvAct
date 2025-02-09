import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GeoInformationService {
  private nominatimUrl = 'https://nominatim.openstreetmap.org/reverse?format=json';

  constructor(private http: HttpClient) {}

  getAddress(lat: number, lon: number) {
    const url = `${this.nominatimUrl}&lat=${lat}&lon=${lon}`;
    return this.http.get(url);
  }
}
