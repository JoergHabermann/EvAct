export interface Node {
    id: number;
    lat: number;
    lon: number;    
    distance: number;
    road?: string;
    house_number?: string;
    postcode?: string;
    town?: string;
    suburb?: string;
    [key: string]: any;
  }