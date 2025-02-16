import { Component, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatDatepickerModule} from '@angular/material/datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule} from '@angular/material/button';
import { MatIconModule} from '@angular/material/icon';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Node } from '../models/node.model';
import { OnInit } from '@angular/core';
import { GeoInformationService } from '../services/geo-information.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MapComponent } from '../components/map/map.component';

@Component({
  selector: 'app-mainpage',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    MatSliderModule,
    MatDatepickerModule,
    FormsModule, ReactiveFormsModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    NgIf,
    NgFor,
    CommonModule,
    MatExpansionModule,
    MapComponent
  ],
  templateUrl: './mainpage.component.html',
  styleUrl: './mainpage.component.scss',
})
export class MainpageComponent implements OnInit {
  readonly panelOpenState = signal(false);

  searchType : string = '';
  userLatitude : number = 0;
  userLongitude : number = 0;
  userCity : any;
  category : string = '';

  dataForm = new FormGroup({
    rangeValue: new FormControl(25),
    start: new FormControl(),
    end: new FormControl(),
    selectControl: new FormControl('casino')  
  });

  locationData : any = '';
  
  constructor(private geoService: GeoInformationService){} 

  async ngOnInit() {    
    await this.getLocation();    
    this.userCity = await this.geoService.getAddress(this.userLatitude,this.userLongitude);
    console.log(this.userCity);
  }

  getLocation(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLatitude = position.coords.latitude;
            this.userLongitude = position.coords.longitude;
            console.log("latitude: " + this.userLatitude, "longitude " + this.userLongitude);
            resolve();
          },
          (error) => {
            console.error('Fehler bei der Geolokalisierung:', error);
            reject(error);
          }
        );
      } else {
        reject('Geolokalisierung wird nicht unterstützt.');
      }
    });
  }  
  

  async fetchData(latitude : number, longitude : number, range : number, type : string) {    
    const query = `
      [out:json];(
        node["amenity"="${type}"](around:${range * 1000},${latitude}, ${longitude});        
      );
      out body qt;
      out tags;
    `;
    const URL = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const URLtoJSON = await URL.json();     
    const redundantObject = URLtoJSON.elements;
    this.locationData = this.deleteRedundantNodes(redundantObject);
    this.addLocationDistance(latitude, longitude,this.locationData);
    this.sortLocations(this.locationData);
  }

  async pushNominatim(node : Node) {      
    const mapElements = ["road", "house_number", "postcode", "town", "suburb"];
    if (!node.hasOwnProperty("road")) {
      const nodeNominatimObject = await this.geoService.getAddress(node.lat, node.lon);            
      for (const element of mapElements) {
        if (element in nodeNominatimObject.address) {
          node[element] = nodeNominatimObject.address[element];
        }
      }   
    }  
  }
    

  deleteRedundantNodes(object : Object[]) {
    const halfLength = object.length / 2;
    return object.slice(0,halfLength - 1);
  }

  addLocationDistance(latitude : number, longitude : number, object : Node[]) {
    for (let location of object) {
      const distance = this.haversineDistance(latitude,longitude,location.lat,location.lon);
      location.distance = +distance;
    }
  }

  sortLocations(object : Node[]) {
    object.sort((a, b) => (a.distance < b.distance ? -1 : 1))
  }

  logDates() {
    const startDate = this.dataForm.get('start')?.value;
    const endDate = this.dataForm.get('end')?.value;
    console.log(startDate);
    console.log(endDate);
  }

  async logData() {
    const range : number = this.dataForm.get('rangeValue')!.value!;
    this.category = this.dataForm.get('selectControl')!.value!;
    this.logDates();
    console.log(range);
    console.log(this.category);    
    await this.fetchData(this.userLatitude,this.userLongitude,range,this.category);  
    /* await this.pushNominatim();  */ 
    console.log(this.locationData);    
  }

  formatLabel(value: number): string {
    return value + 'km';
  }

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

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
}
