
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
}

export interface ForumPost {
  id?: string; // Firestore document ID
  title: string;
  content: string;
  authorId: string;
  authorName: string; // Denormalized
  authorAvatar?: string; // Denormalized
  category?: string; // e.g., "Questions", "Show Off", "Trade Requests"
  tags?: string[];
  imageUrls?: string[]; // Optional for users showing off plants
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastReplyAt?: Timestamp; // To sort by recent activity
  replyCount?: number; // Denormalized
  viewCount?: number; // Optional
}

export interface ForumComment {
  id?: string; // Firestore document ID
  postId: string; // ID of the parent ForumPost
  content: string;
  authorId: string;
  authorName: string; // Denormalized
  authorAvatar?: string; // Denormalized
  createdAt: Timestamp;
  updatedAt: Timestamp;
  parentCommentId?: string; // For threaded replies, optional
}

    