import type { Timestamp, GeoPoint } from "firebase/firestore";

// Replaces the old UserProfile interface
export interface User {
    id?: string; // Document ID from Firestore, same as userId
    userId: string; // Firebase Auth UID
    username: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
    location?: string;
    joinedDate: Timestamp;
    plantsListed: number;
    plantsTraded: number;
    rewardPoints: number;
    favoritePlants: string[]; // Array of PlantListing IDs for wishlist
    followers: string[]; // Array of UserIDs
    following: string[]; // Array of UserIDs
    subscription?: {
        status: 'free' | 'pro';
        expiryDate: Timestamp | null;
    };
}

// Replaces the old Plant interface
export interface PlantListing {
    id?: string; // Document ID from Firestore
    name: string;
    description: string;
    imageUrls: string[];
    price?: number;
    isAvailable: boolean;
    tradeOnly: boolean; // if true, only for trade.
    location?: string;
    ownerId: string;
    ownerUsername: string; // Denormalized
    ownerAvatarUrl?: string; // Denormalized
    listedDate: Timestamp;
    tags?: string[];
}

// New interfaces from here
export interface Chat {
    id?: string; // Document ID (e.g., 'userId1_userId2')
    participants: string[]; // Array of userIDs
    lastMessage: string;
    lastMessageTimestamp: Timestamp;
    participantDetails?: { [userId: string]: { username: string, avatarUrl?: string } }; // Denormalized data
}

export interface Message {
    id?: string; // Document ID
    senderId: string;
    receiverId: string; // For notifications, context
    text: string;
    timestamp: Timestamp;
    read: boolean;
}

// Replaces the old Community interface
export interface Forum {
    id?: string; // Document ID
    name: string;
    description: string;
    createdAt: Timestamp;
    memberCount?: number; // Denormalized
    creatorId?: string; // UserID of creator
}

// Replaces the old ForumPost interface
export interface Post {
    id?: string; // Document ID
    forumId: string; // Which forum it belongs to
    title: string;
    content: string;
    authorId: string;
    authorUsername: string; // Denormalized
    authorAvatarUrl?: string; // Denormalized
    createdAt: Timestamp;
    upvotes: string[]; // Array of userIDs
    downvotes: string[]; // Array of userIDs
    commentCount: number; // Denormalized
}

// Replaces the old ForumComment interface
export interface Comment {
    id?: string; // Document ID
    postId: string; // Which post it belongs to
    forumId: string; // Which forum it belongs to (for easier queries)
    authorId: string;
    authorUsername:string; // Denormalized
    authorAvatarUrl?: string; // Denormalized
    content: string;
    createdAt: Timestamp;
}

export interface RewardTransaction {
    id?: string; // Document ID
    userId: string;
    type: 'earn' | 'spend';
    points: number;
    description: string;
    timestamp: Timestamp;
}
