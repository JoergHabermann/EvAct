import { Component, signal, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatDatepickerModule} from '@angular/material/datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { MatButtonModule} from '@angular/material/button';
import { MatIconModule} from '@angular/material/icon';
import { AsyncPipe, CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { Node } from '../models/node.model';
import { Marker } from '../models/marker.model';
import { OnInit } from '@angular/core';
import { GeoInformationService } from '../services/geo-information.service';
import { MapService } from '../services/map.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MapComponent } from '../components/map/map.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {Observable, of} from 'rxjs';
import {startWith, map} from 'rxjs/operators';
import * as data from '../../assets/data/activities.json'


export interface ActivityType {
  name: string;
  value: string;
}

export interface ActivityGroup {
  categoryName: string;
  categoryValue: string;
  types: ActivityType[];
}

export interface activityPair {
  name: string;
  category : string;
}

export interface ActivitiesData {
  activityGroups: ActivityGroup[];
}

export const _filter = (opt: string[], value: string): string[] => {
  const filterValue = value.toLowerCase();

  return opt.filter(item => item.toLowerCase().includes(filterValue));
};



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
    MapComponent,  
    AsyncPipe,
    MatAutocompleteModule
  ],
  templateUrl: './mainpage.component.html',
  styleUrl: './mainpage.component.scss',
})

export class MainpageComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);

  activityForm = this._formBuilder.group({
    activityGroup: '',
  })

  

  activityGroupOptions: Observable<ActivityGroup[]> = of([]);
  
  readonly panelOpenState = signal(false);
  
  activityData : any;  
  userLatitude : number = 0;
  userLongitude : number = 0;
  zoomlat : number = 0;
  zoomlong : number = 0;
  userCity : any;
  category : string = '';
  activityTwin = {} as activityPair;
  mapMarkers : Marker[] = [];
  selectedMarker = {} as Node;
  selectedRoute : number = 0;
  result : boolean = false;
  noResult : boolean = false;

  activityGroups = {} as ActivityGroup[];
 
  dataForm = new FormGroup({
    rangeValue: new FormControl(25),
    start: new FormControl(),
    end: new FormControl(),
    activityGroup: new FormControl()
  });

  locationData : any = '';
  
  constructor(private geoService: GeoInformationService, private mapService: MapService){} 

  async ngOnInit() {    
    await this.getLocation();    
    this.userCity = await this.geoService.getAddress(this.userLatitude, this.userLongitude);       
    this.activityGroups = (data as any).activityGroups as ActivityGroup[];      
    this.activityGroupOptions = this.dataForm.get('activityGroup')!.valueChanges.pipe(
      startWith(''), 
      map(searchTerm => this._filterGroup(searchTerm || '')),
      startWith(this.activityGroups) 
    );
}

private _filterGroup(searchTerm: string | activityPair): ActivityGroup[] {  
    
    if (!searchTerm || typeof searchTerm !== 'string') {
        return this.activityGroups;
    }
    const filterValue = searchTerm.toLowerCase();
    return this.activityGroups        
        .map(group => ({
            categoryName: group.categoryName,
            categoryValue: group.categoryValue,
            types: group.types.filter(type => 
                type.name.toLowerCase().includes(filterValue)
        )}))
        .filter(group => group.types.length > 0);    
}

  getLocation(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLatitude = position.coords.latitude;
            this.userLongitude = position.coords.longitude;            
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
  

  async fetchData(latitude : number, longitude : number, range : number, type : string, category: string) {    
    const query = `
      [out:json];(
        node["${category}"="${type}"](around:${range * 1000},${latitude}, ${longitude});        
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

  pushMarkers() {    
    this.mapMarkers = []; 
    for (const node of this.locationData) {
      const node_marker : Marker = {
        id : node.id,
        latitude : node.lat,
        longitude : node.lon,
        toolText : node.tags.name ? node.tags.name : this.activityTwin.name,  
        distance : node.distance       
      }
      this.mapMarkers.push(node_marker);
    }    
    this.mapMarkers = [...this.mapMarkers];  
  }
  
    

  deleteRedundantNodes(object : Object[]) {
    const halfLength = object.length / 2;
    return object.slice(0,halfLength - 1);
  }

  addLocationDistance(latitude : number, longitude : number, object : Node[]) {
    for (let location of object) {
      const distance =       
      this.mapService.haversineDistance(latitude,longitude,location.lat,location.lon);
      location.distance = +distance;
    }
  }

  sortLocations(object : Node[]) {
    object.sort((a, b) => (a.distance < b.distance ? -1 : 1))
  }  

  async logData() {     
    this.activityTwin = {} as activityPair;
    this.selectedRoute = 0;    
    const range : number = this.dataForm.get('rangeValue')!.value!;
    const userInput = this.dataForm.get('activityGroup')!.value;
    if ( typeof userInput == 'string' && userInput != '') {      
      this.activityTwin = this.searchByTyping(userInput);
    } else this.activityTwin = userInput;                  
    if (this.activityTwin) {
      const activity : string = this.findActivityValue(this.activityTwin.name);
      if (activity) { 
        await this.fetchData(this.userLatitude, this.userLongitude, range, activity, this.activityTwin.category);
        this.category = this.activityTwin.name;  
      }
    }    
    this.checkResult();     
  }

  searchByTyping(userInput : string) : activityPair {        
    let actName : string = userInput;  
    let actCategory : string = '';  
    actName = actName.charAt(0).toUpperCase() + actName.toLowerCase().slice(1);
    
    this.activityGroups.forEach(category => {
      const foundCategory = category.types.find(type => type.name === actName);
      if (foundCategory) {
        actCategory = category.categoryValue;
      }
    });
    return {name: actName,category: actCategory};
  } 

  checkResult() {
    this.locationData.length ? this.noResult = false : this.noResult = true;
    if (this.locationData.length) {        
      this.pushMarkers(); 
      this.result = true;
    }
  }

  findActivityValue(key : string) : string {
    for (const group of this.activityGroups) {
      const foundType = group.types.find(type => type.name === key);
      if (foundType) {
        return foundType.value;
      }
    }
    return '';
  }

  displayActivityName (type : activityPair): string {
    return type ? type.name : '';
  }

  formatLabel(value: number): string {
    return value + 'km';
  }  

  sendZoomCoords(nodelat : number, nodelong : number) {    
    this.zoomlat = nodelat;
    this.zoomlong = nodelong;
  }

  handleMarkerClick(Marker: Marker) {
    this.selectedMarker = this.locationData.find( (node : Node) =>
      node.id === Marker.id);
    this.setRoute(Marker.id);
  }

  setRoute(id : number) {
    this.selectedRoute = id;
  }

  switchResultPanel() {
    this.result ? this.result = false : this.result = true;
  }
}


