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
import 'leaflet-routing-machine';

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

  private routingControl: any;

  constructor(private mapService: MapService) {}

  map: any;
  position_marker: any;
  markerLayer: any;
  zoom: number = 13;

  ngOnInit(): void {
    const customIcon = L.divIcon({
      html: '<div style="background: green; width: 20px; height: 20px; border-radius: 50%;"></div>',
      className: '',
      iconSize: [20, 20],
    });
    this.map = L.map('map').setView([this.latitude, this.longitude], this.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    this.position_marker = L.marker([this.latitude, this.longitude], {
      icon: customIcon,
    })
      .addTo(this.map)
      .bindPopup('Du befindes Dich hier')
      .openPopup();
    this.addMarkers();
    this.initRouting();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['latitude'] || changes['longitude']) {
      if (this.map) {
        this.map.setView([this.latitude, this.longitude], this.zoom);
        this.position_marker.setLatLng([this.latitude, this.longitude]);
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

    if (changes['zoomlat']?.currentValue || changes['zoomlong']?.currentValue) {
      this.map.setView([this.zoomlat, this.zoomlong], 12);
    }

    if (changes['destid'] && this.destid != 0 && this.map) {      
      this.updateRouteToMarker(this.destid);
    }
  }

  private initRouting(): void {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }

    this.routingControl = L.Routing.control({
      waypoints: [
        L.latLng(this.latitude, this.longitude),
        L.latLng(this.markers[0]?.latitude, this.markers[0]?.longitude),
      ],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
      }),
      routeWhileDragging: false,
      show: false,
      collapsible: true,
      addWaypoints: false,
      lineOptions: {
        styles: [{ color: '#3388ff', weight: 5 }],
        extendToWaypoints: false,
        missingRouteTolerance: 0,
      },
      waypointMode: 'snap',
    }).addTo(this.map);
  }

  addMarkers() {
    this.markerLayer = L.layerGroup();
    this.markers.forEach((markerData) => {
      const marker = L.marker([markerData.latitude, markerData.longitude])
        .bindTooltip(markerData.toolText, { permanent: true, direction: 'top' })
        .openTooltip()
        .on('click', () => {
          this.markerClick.emit(markerData);
        });
      this.markerLayer.addLayer(marker);
    });

    this.markerLayer.addTo(this.map);
  }

  private updateRouteToMarker(id: number): void {
    const destmarker = this.markers.find((marker: Marker) => id === marker.id);
    if (this.routingControl) {
      const waypoints = [
        L.latLng(this.latitude, this.longitude),
        L.latLng(destmarker!.latitude, destmarker!.longitude),
      ];
      this.routingControl.setWaypoints(waypoints).route();
    }
  }

  ngOnDestroy() {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }
  }
}
