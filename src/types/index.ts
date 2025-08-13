export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'user' | 'admin' | 'master_admin';
  createdAt: string;
  isPartner?: boolean;
  partnerStatus?: 'pending' | 'approved' | 'rejected';
}

export interface LandPlot {
  id: string;
  title: string;
  description: string;
  area: number; // in square meters
  price: number;
  location: {
    region: string;
    district: string;
    council: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  size: {
    width: number;
    length: number;
  };
  usage: 'economic' | 'business' | 'residential' | 'mixed';
  status: 'available' | 'reserved' | 'sold';
  images: string[];
  features: string[];
  documents: string[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  plotId: string;
  plot: LandPlot;
  reservedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  plotId: string;
  plot: LandPlot;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  region?: string;
  district?: string;
  council?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  usage?: string;
}