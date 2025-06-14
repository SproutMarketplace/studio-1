
import type { Timestamp } from "firebase/firestore";

export interface Plant {
  id?: string; // Firestore document ID, will be populated after fetching
  name: string;
  description: string;
  imageUrls: string[];
  imageHints?: string[]; 
  price?: number;
  type: "sale" | "trade" | "sale_trade";
  tags?: string[];
  sellerId: string;
  sellerName?: string; // Denormalized for easier display
  sellerAvatar?: string; // Denormalized for easier display
  location?: string; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isSold?: boolean; // To track if a plant is sold
}

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // Example for preferences/settings - can be expanded
  // notificationPreferences?: {
  //   newMessages?: boolean;
  //   newOffers?: boolean;
  // };
  // plantCareStats?: {
  //  totalPlantsManaged?: number;
  //  successfulTrades?: number;
  // };
}
