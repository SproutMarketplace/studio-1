
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
    stripeAccountId?: string; // For Stripe Connect
    stripeDetailsSubmitted?: boolean; // For Stripe Connect
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

export interface OrderItem {
    plantId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    sellerId: string;
}

export interface Order {
    id?: string; // Document ID
    userId: string; // Buyer's ID
    sellerIds: string[]; // Array of all seller IDs in the order
    items: OrderItem[];
    totalAmount: number;
    status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: Timestamp;
    stripeSessionId: string;
    buyerUsername?: string; // Denormalized
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
    bannerUrl?: string;
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
    createdAt: Timestamp | Date; // Allow JS Date for optimistic updates
    upvotes: string[]; // Array of userIDs
    downvotes: string[]; // Array of userIDs
    commentCount: number; // Denormalized
    imageUrls?: string[];
}

// Replaces the old ForumComment interface
export interface Comment {
    id: string; // Document ID
    postId: string; // Which post it belongs to
    forumId: string; // Which forum it belongs to (for easier queries)
    authorId: string;
    authorUsername:string; // Denormalized
    authorAvatarUrl?: string; // Denormalized
    content: string;
    createdAt: Timestamp | Date; // Allow JS Date for optimistic updates
    parentId?: string | null; // ID of the parent comment, if it's a reply
    replyCount?: number; // Denormalized count of replies
}

export interface RewardTransaction {
    id?: string; // Document ID
    userId: string;
    type: 'earn' | 'spend';
    points: number;
    description: string;
    timestamp: Timestamp;
}

export interface Notification {
    id?: string; // Document ID
    userId: string; // The user who *receives* the notification
    type: 'newMessage' | 'newFollower' | 'newComment' | 'newSale';
    message: string; // e.g., "Mikaela followed you."
    link: string; // e.g., "/profile/mikaela-id" or "/messages/chat-id"
    isRead: boolean;
    createdAt: Timestamp;
    fromUser: { // Info about the user who triggered the notification
        id: string;
        username: string;
        avatarUrl?: string;
    }
}
