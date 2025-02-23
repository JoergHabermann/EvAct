import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Marker } from '../../models/marker.model';
import { MapService } from '../../services/map.service';
declare let L: any; 

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, OnChanges {

@Input() latitude : number = 0;
@Input() longitude : number = 0;
@Input() markers: Marker[] = [];
@Input() zoomlat : number = 0;
@Input() zoomlong : number = 0;

constructor(private mapService: MapService) {}

map : any;
position_marker : any;
markerLayer: any;
zoom : number = 13;

  ngOnInit(): void {    
    this.map = L.map('map').setView([this.latitude, this.longitude], this.zoom);    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    this.position_marker = L.marker([this.latitude, this.longitude]).addTo(this.map)
      .bindPopup('Du befindes Dich hier')
      .openPopup();
    this.addMarkers();
  }

  ngOnChanges(changes: SimpleChanges): void {    
    if (changes['latitude'] || changes['longitude']) {
      if (this.map) {        
        this.map.setView([this.latitude, this.longitude], this.zoom);        
        this.position_marker.setLatLng([this.latitude, this.longitude])          
      }
    }


    if (changes['markers'] && this.map) {   
       
      if (this.markerLayer) {
        this.map.removeLayer(this.markerLayer);
      }      
      this.addMarkers();
      if (this.markers.length > 0) {
        this.map.setZoom(this.mapService.setMapZoom(this.markers.at(-1)!));
      }      
    }

    if (changes['zoomlat'] || changes['zoomlong']) {
      this.map.setView(this.zoomlat, this.zoomlong, 12);
    }
  }

  addMarkers() {    
    this.markerLayer = L.layerGroup();    
    this.markers.forEach(markerData => {
      const marker = L.marker([markerData.latitude, markerData.longitude])
        .bindPopup(markerData.popupText)
        
        
      this.markerLayer.addLayer(marker);
    });

    this.markerLayer.addTo(this.map);     
  }
}
