import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeoInformationService {
  private nominatimUrl = 'https://nominatim.openstreetmap.org/reverse?format=json';

  constructor() {}

  async getAddress(lat: number, lon: number) {
    const URL = await fetch(`${this.nominatimUrl}&lat=${lat}&lon=${lon}`);
    const URLtoJSON = URL.json();
    return URLtoJSON;
  }
}
