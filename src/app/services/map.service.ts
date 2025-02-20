import { Injectable } from '@angular/core';
import { Marker } from '../models/marker.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  constructor() { }

  haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number,  
  ): string {
    const radius: number = 6371 
    const theta1 = this.toRadians(lat1);
    const theta2 = this.toRadians(lat2);
    const deltaTheta = this.toRadians(lat2 - lat1);
    const deltaPhi = this.toRadians(lon2 - lon1);
  
    const a =
      Math.sin(deltaTheta / 2) * Math.sin(deltaTheta / 2) +
      Math.cos(theta1) * Math.cos(theta2) *
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return (radius * c).toFixed(2);
  }

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  setMapZoom(marker : Marker) {
    if (marker.distance >= 60) return 8;
    if (marker.distance > 20) return 9;
    else return 10; 
  }

}
