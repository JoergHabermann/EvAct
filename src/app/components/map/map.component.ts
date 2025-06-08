import {
  Component,
  Input,
  Output,
  OnChanges,
  OnInit,
  SimpleChanges,
  EventEmitter,
} from '@angular/core';
import { Marker } from '../../models/marker.model';
import { MapService } from '../../services/map.service';
import * as L from 'leaflet';

declare module 'leaflet' {
  namespace Routing {
    function control(options: any): any;
  }
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, OnChanges {
  @Input() latitude: number = 0;
  @Input() longitude: number = 0;
  @Input() markers: Marker[] = [];
  @Input() zoomlat: number = 0;
  @Input() zoomlong: number = 0;
  @Input() destid: number = 0;

  @Output() markerClick = new EventEmitter<Marker>();

  routingControl: any;
  LRM: any;

  constructor(private mapService: MapService) {}

  map: any;
  position_marker: any;
  markerLayer: any;
  zoom: number = 13;  

  /**
   * Initializes the Leaflet map, markers, and Routing Plug-In
   */
  async ngOnInit() {    
    const customIcon = this.setCustomIcon();
    this.map = L.map('map').setView([this.latitude, this.longitude], this.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    this.position_marker = L.marker([this.latitude, this.longitude], {
      icon: customIcon,
    })
      .addTo(this.map).bindPopup('Du befindes Dich hier').openPopup();
    this.addMarkers();
    this.importPlugin();    
  }

  /**
   * Redirect URL Paths for Marker ICON in Leaflet to local directory avoiding CDN
   */
  fixLeafletIcon() {    
    delete (L.Icon.Default.prototype as any)._getIconUrl;    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: `/assets/img/marker-icon-2x.png`,
      iconUrl: `/assets/img/marker-icon.png`,
      shadowUrl: `/assets/img/marker-shadow.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  /**
   * Handles correct implementation of LRM Plug-In
   */
  async importPlugin() {
    (window as any).L = L;
    await import('leaflet-routing-machine');
    this.newRouting();    
  }

  /**
   * Defines custom icon for user position
   */
  setCustomIcon() {
    return L.divIcon({
      html: '<div style="background: #673AB7; width: 20px; height: 20px; border-radius: 50%;"></div>',
      className: '',
      iconSize: [20, 20],
    });
  }

  /**
   * Observes changes of markers, zoomcoordinates and routingdestination
   * 
   * @param changes - tracking SimpleChanges of specific values
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['latitude'] || changes['longitude']) {
      if (this.map) {
        this.map.setView([this.latitude, this.longitude], this.zoom);
        this.position_marker.setLatLng([this.latitude, this.longitude]);
      }
    }
    this.markerChanges(changes);
    if (changes['zoomlat']?.currentValue || changes['zoomlong']?.currentValue) {
      this.map.setView([this.zoomlat, this.zoomlong], 12);
    }
    if (changes['destid'] && this.map) {
      this.destid === 0
        ? this.newRouting()
        : this.updateRouteToMarker(this.destid);
    }
  }

  /**
   * Observes changes of markers
   * 
   * @param changes - tracking SimpleChanges of markers
   */
  markerChanges(changes: SimpleChanges) {
    if (changes['markers'] && this.map) {
      if (this.markerLayer) {
        this.map.removeLayer(this.markerLayer);
      }
      this.addMarkers();
      if (this.markers.length > 0) {
        this.map.setView([this.latitude, this.longitude], this.zoom);
        this.map.setZoom(this.mapService.setMapZoom(this.markers.at(-1)!));
      }
    }
  }

  /**
   * Reinitializes Routing Plug-In
   */
  newRouting() {
    this.refreshRouting();    
    this.routingControl = L.Routing.control({
      routeWhileDragging: false,      
      show: true,
      addWaypoints: false,
      summaryTemplate: '<p><b>Über: {name}</b><br>Distanz: {distance} | Zeit: {time}<p>',
      language: 'de',
      lineOptions: {
        styles: [{ color: '#3388ff', weight: 5 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      createMarker: function(i: number, waypoint: any) {
        return L.marker(waypoint.latLng, {
          icon: new L.Icon({
            iconUrl: '/assets/img/marker-icon.png',
            iconRetinaUrl: '/assets/img/marker-icon-2x.png',
            shadowUrl: '/assets/img/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            shadowSize: [41, 41],
            shadowAnchor: [12, 41],
            popupAnchor: [1, -34]
          })
        });
      },
      waypointMode: 'snap'      
    }).addTo(this.map);    
  }

  /**
   * Removes RoutingControl
   */
  refreshRouting() {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.map.closePopup();
    }
  }

  /**
   * Adds marker-layer-group, binds popups, and emits markerData on click
   */
  addMarkers() {
    this.markerLayer = L.layerGroup();
    this.markers.forEach((markerData) => {
      const marker = L.marker([markerData.latitude, markerData.longitude],
      {
      icon: this.markerIcon(),
      }
      )
        .bindTooltip(markerData.toolText, {
          permanent: false,
          direction: 'top',
        })
        .on('click', () => {
          this.markerClick.emit(markerData);
          marker.bindPopup(markerData.toolText).openPopup();
        });
      this.markerLayer.addLayer(marker);
    });
    this.markerLayer.addTo(this.map);
  }

  /**
   * Creates custom icon for markers
   * 
   * @returns Instance of new icon Creation
   */
  markerIcon() {
    return new L.Icon({
      iconUrl: '/assets/img/marker-icon.png',
      iconRetinaUrl: '/assets/img/marker-icon-2x.png',
      shadowUrl: '/assets/img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41],
      shadowAnchor: [12, 41],
      popupAnchor: [1, -34]
    })
  }

  /**
   * Updates route to new markerid
   * 
   * @param id - markerid of the routing destination
   */
  updateRouteToMarker(id: number): void {
    const destmarker: Marker = this.markers.find(
      (marker: Marker) => id === marker.id
    )!;
    const waypoints = [
      L.latLng(this.latitude, this.longitude),
      L.latLng(destmarker!.latitude, destmarker!.longitude),
    ];
    this.routingControl.setWaypoints(waypoints).route();
    L.popup()
      .setLatLng(new L.LatLng(destmarker.latitude, destmarker.longitude))
      .setContent(destmarker.toolText)
      .openOn(this.map);
    this.map.setZoom(this.mapService.setMapZoom(destmarker));
  }

  /**
   * End of Lifecycle-Hook, removes RoutingControl
   */
  ngOnDestroy() {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }
  }
}