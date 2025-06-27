import type { User, PlantListing, Forum, Post, Chat, Message } from '@/models';
import { Timestamp } from 'firebase/firestore';

export const mockUser: User = {
    id: 'mock-user-id',
    userId: 'mock-user-id',
    username: 'Dev User',
    email: 'dev@sprout.com',
    bio: 'A developer testing the Sprout app in offline mode.',
    avatarUrl: 'https://placehold.co/100x100.png',
    location: 'Offline, World',
    joinedDate: Timestamp.fromDate(new Date('2023-01-01')),
    plantsListed: 2,
    plantsTraded: 1,
    rewardPoints: 150,
    favoritePlants: ['mock-plant-2', 'mock-plant-4'],
    followers: [],
    following: [],
    subscription: {
        status: 'pro',
        expiryDate: Timestamp.fromDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
    },
};

export const mockFirebaseAuthUser = {
    uid: mockUser.userId,
    email: mockUser.email,
    displayName: mockUser.username,
    photoURL: mockUser.avatarUrl,
    // Add other properties that the app might use from FirebaseAuthUser
    emailVerified: true,
    isAnonymous: false,
    providerData: [],
    metadata: {},
    // dummy functions
    getIdToken: async () => 'mock-token',
} as any; // Using `any` to simplify mock creation.

export const mockPlantListings: PlantListing[] = [
    {
        id: 'mock-plant-1',
        name: 'Monstera Deliciosa (Mock)',
        description: 'Large, healthy Monstera with beautiful fenestrations. Easy to care for. This is mock data for offline development.',
        imageUrls: ['https://placehold.co/600x400.png'],
        price: 45.00,
        isAvailable: true,
        tradeOnly: false,
        location: 'San Francisco, CA',
        ownerId: 'mock-user-id',
        ownerUsername: 'Dev User',
        ownerAvatarUrl: mockUser.avatarUrl,
        listedDate: Timestamp.fromDate(new Date(Date.now() - 86400000 * 1)),
        tags: ['For Sale', 'Beginner Friendly', 'Foliage'],
    },
    {
        id: 'mock-plant-2',
        name: 'Pilea Peperomioides (Mock)',
        description: 'Popular "UFO Plant". This is mock data for offline development.',
        imageUrls: ['https://placehold.co/600x400.png'],
        price: 25.00,
        isAvailable: true,
        tradeOnly: false,
        location: 'Oakland, CA',
        ownerId: 'another-user',
        ownerUsername: 'PlantPerson',
        ownerAvatarUrl: 'https://placehold.co/100x100.png',
        listedDate: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2)),
        tags: ['For Sale', 'Pet Friendly'],
    },
    {
        id: 'mock-plant-3',
        name: 'Snake Plant (Mock)',
        description: 'Almost impossible to kill. Great for air purification. This is mock data.',
        imageUrls: ['https://placehold.co/600x400.png'],
        tradeOnly: true,
        isAvailable: true,
        price: 30.00,
        location: 'Berkeley, CA',
        ownerId: 'another-user',
        ownerUsername: 'GreenThumb',
        ownerAvatarUrl: 'https://placehold.co/100x100.png',
        listedDate: Timestamp.fromDate(new Date(Date.now() - 86400000 * 3)),
        tags: ['For Trade', 'Low Light'],
    },
    {
        id: 'mock-plant-4',
        name: 'Fiddle Leaf Fig (Mock)',
        description: 'A beautiful, statement-making plant. Requires bright, indirect light. This is mock data for offline mode.',
        imageUrls: ['https://placehold.co/600x400.png'],
        price: 75.00,
        isAvailable: true,
        tradeOnly: false,
        location: 'San Francisco, CA',
        ownerId: 'mock-user-id',
        ownerUsername: 'Dev User',
        ownerAvatarUrl: mockUser.avatarUrl,
        listedDate: Timestamp.fromDate(new Date(Date.now() - 86400000 * 4)),
        tags: ['For Sale', 'Bright Light', 'Foliage'],
    },
];

export const mockForums: Forum[] = [
    {
        id: 'mock-forum-1',
        name: 'Cactus & Succulent Lovers (Mock)',
        description: 'A mock forum for all things spiky and fleshy.',
        createdAt: Timestamp.fromDate(new Date()),
        memberCount: 123,
        creatorId: 'some-creator-id',
    },
    {
        id: 'mock-forum-2',
        name: 'Aroid Fanatics (Mock)',
        description: 'For lovers of Monsteras, Philodendrons, and more. Mock data.',
        createdAt: Timestamp.fromDate(new Date()),
        memberCount: 456,
        creatorId: 'some-creator-id',
    }
];

export const mockPosts: Post[] = [
    {
        id: 'mock-post-1',
        forumId: 'mock-forum-1',
        title: 'Is my succulent getting too much sun? (Mock)',
        content: 'The leaves are starting to look a bit scorched. What should I do? This is a mock post for offline dev.',
        authorId: 'mock-user-id',
        authorUsername: 'Dev User',
        createdAt: Timestamp.fromDate(new Date()),
        upvotes: [],
        downvotes: [],
        commentCount: 2,
    },
     {
        id: 'mock-post-2',
        forumId: 'mock-forum-1',
        title: 'My first cactus bloom! (Mock)',
        content: 'So excited to share this with you all!',
        authorId: 'other-user',
        authorUsername: 'PlantPerson',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
        upvotes: [],
        downvotes: [],
        commentCount: 5,
    },
];

export const mockChats: Chat[] = [
    {
        id: 'mock-chat-1',
        participants: ['mock-user-id', 'other-user-1'],
        lastMessage: 'Hey! Is this plant still available? (Mock)',
        lastMessageTimestamp: Timestamp.fromDate(new Date()),
        participantDetails: {
            'mock-user-id': { username: 'Dev User', avatarUrl: mockUser.avatarUrl! },
            'other-user-1': { username: 'PlantPerson', avatarUrl: 'https://placehold.co/100x100.png' },
        }
    },
    {
        id: 'mock-chat-2',
        participants: ['mock-user-id', 'other-user-2'],
        lastMessage: 'Great, see you then! (Mock)',
        lastMessageTimestamp: Timestamp.fromDate(new Date(Date.now() - 86400000)),
        participantDetails: {
            'mock-user-id': { username: 'Dev User', avatarUrl: mockUser.avatarUrl! },
            'other-user-2': { username: 'GreenThumb', avatarUrl: 'https://placehold.co/100x100.png' },
        }
    }
];

export const mockMessages: Message[] = [
    {
        id: 'msg-1',
        senderId: 'other-user-1',
        receiverId: 'mock-user-id',
        text: 'Hey! Is this plant still available? (Mock)',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 60000 * 5)),
        read: true,
    },
    {
        id: 'msg-2',
        senderId: 'mock-user-id',
        receiverId: 'other-user-1',
        text: 'Hi, yes it is! (Mock)',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 60000 * 4)),
        read: true,
    }
];
