import { Component } from '@angular/core';
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
    CommonModule
  ],
  templateUrl: './mainpage.component.html',
  styleUrl: './mainpage.component.scss',
})
export class MainpageComponent {
  searchType : string = '';

  dataForm = new FormGroup({
    rangeValue: new FormControl(0),
    start: new FormControl(),
    end: new FormControl(),
    selectControl: new FormControl('cinema')  
  });

  locationData : any = '';
  
  constructor(){}  

  async fetchData(latitude : number | null, longitude : number | null, range : number, type : string) {    
    const query = `
      [out:json];(
        node["amenity"="${type}"](around:${range * 1000},52.0499998, 10.3666652);        
      );
      out body qt;
      out tags;
    `;
    const URL = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const URLtoJSON = await URL.json(); 
    this.locationData = URLtoJSON.elements;
  }

  logDates() {
    const startDate = this.dataForm.get('start')?.value;
    const endDate = this.dataForm.get('end')?.value;
    console.log(startDate);
    console.log(endDate);
  }

  async logData() {
    const range : number = this.dataForm.get('rangeValue')!.value!;
    const type : string = this.dataForm.get('selectControl')!.value!;
    this.logDates();
    console.log(range);
    console.log(type);    
    await this.fetchData(null,null,range,type);
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
