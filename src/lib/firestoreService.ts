
// src/lib/firestoreService.ts
import { db, auth, isFirebaseDisabled } from './firebase'; // Your Firebase instances
import { storage } from './firebase'; // For file uploads
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    GeoPoint,
    startAfter,
    DocumentSnapshot,
    onSnapshot,
    increment,
    arrayUnion,
    arrayRemove,
    setDoc,
    QuerySnapshot,
    DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { mockPlantListings, mockUser, mockForums, mockPosts, mockChats, mockMessages } from './mock-data';

// Import your models for type safety
import {
    User,
    PlantListing,
    Chat,
    Message,
    Forum,
    Post,
    Comment,
    RewardTransaction,
} from '@/models';

// --- General Utility Functions ---
export const getTimestamp = () => serverTimestamp() as Timestamp;

// --- User Functions (Profile Page: /profile) ---
export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock user profile.");
        return userId === mockUser.userId ? mockUser : null;
    }
    if (!db) return null;
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
};

export const createUserProfile = async (user: Omit<User, 'id' | 'joinedDate'>): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating createUserProfile.");
        return;
    }
    const userRef = doc(db, 'users', user.userId); // Use userId as doc ID
    await setDoc(userRef, { 
        ...user, 
        joinedDate: serverTimestamp(),
        subscription: {
            status: 'free',
            expiryDate: null,
        }
    });
};

export const updateUserData = async (userId: string, data: Partial<User>): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating updateUserData.");
        return;
    }
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, data);
};

export const updateUserSubscription = async (userId: string): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating updateUserSubscription.");
        return;
    }
    const userRef = doc(db, 'users', userId);
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    await updateDoc(userRef, {
        subscription: {
            status: 'pro',
            expiryDate: Timestamp.fromDate(expiryDate),
        }
    });
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    if (isFirebaseDisabled || !storage) {
        console.log("Mock Mode: Simulating uploadProfileImage.");
        return "https://placehold.co/100x100.png";
    }
    const imageRef = ref(storage, `profile_images/${userId}/${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
};

// --- Plant Functions (List Plant Page: /list-plant, General Listings) ---
export const addPlantListing = async (plant: Omit<PlantListing, 'id' | 'listedDate'>): Promise<string> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating addPlantListing.");
        return "mock-new-plant-id";
    }
    const docRef = await addDoc(collection(db, 'plants'), { ...plant, listedDate: serverTimestamp() });
    return docRef.id;
};

export const getPlantListing = async (plantId: string): Promise<PlantListing | null> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock plant listing by ID.");
        return mockPlantListings.find(p => p.id === plantId) || null;
    }
    if (!db) return null;
    const docRef = doc(db, 'plants', plantId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PlantListing;
    }
    return null;
};

// REQUIRED FIRESTORE INDEX:
// Collection: 'plants'
// Fields: 1. isAvailable (Ascending), 2. listedDate (Descending)
export const getAvailablePlantListings = async (lastDoc?: DocumentSnapshot, limitNum: number = 10): Promise<{ plants: PlantListing[], lastVisible: DocumentSnapshot | null }> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock available plant listings.");
        return { plants: mockPlantListings.filter(p => p.isAvailable), lastVisible: null };
    }
    if (!db) return { plants: [], lastVisible: null };
    let q = query(
        collection(db, 'plants'),
        where('isAvailable', '==', true),
        orderBy('listedDate', 'desc'),
        limit(limitNum)
    );

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const plants: PlantListing[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        plants.push({ id: doc.id, ...doc.data() } as PlantListing);
    });
    const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    return { plants, lastVisible };
};

// REQUIRED FIRESTORE INDEX:
// Collection: 'plants'
// Fields: 1. ownerId (Ascending), 2. listedDate (Descending)
export const getUserPlantListings = async (ownerId: string): Promise<PlantListing[]> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock user plant listings.");
        return mockPlantListings.filter(p => p.ownerId === mockUser.userId);
    }
    if (!db) return [];
    const q = query(collection(db, 'plants'), where('ownerId', '==', ownerId), orderBy('listedDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const plants: PlantListing[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        plants.push({ id: doc.id, ...doc.data() } as PlantListing);
    });
    return plants;
};

export const updatePlantListing = async (plantId: string, data: Partial<PlantListing>): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating updatePlantListing.");
        return;
    }
    const docRef = doc(db, 'plants', plantId);
    await updateDoc(docRef, data);
};

export const deletePlantListing = async (plantId: string): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating deletePlantListing.");
        return;
    }
    const docRef = doc(db, 'plants', plantId);
    await deleteDoc(docRef);
};

export const uploadPlantImage = async (plantId: string, file: File, index: number): Promise<string> => {
    if (isFirebaseDisabled || !storage) {
        console.log("Mock Mode: Simulating uploadPlantImage.");
        return "https://placehold.co/600x400.png";
    }
    const imageRef = ref(storage, `plant_images/${plantId}/${index}_${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
};

export const deletePlantImage = async (imageUrl: string): Promise<void> => {
    if (isFirebaseDisabled || !storage) {
        console.log("Mock Mode: Simulating deletePlantImage.");
        return;
    }
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
}


// --- Messaging Functions (Messages Page: /messages) ---
const getChatDocumentId = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_');
};

export const createOrGetChat = async (userId1: string, userId2: string): Promise<string> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating createOrGetChat.");
        return "mock-chat-1";
    }
    const chatId = getChatDocumentId(userId1, userId2);
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        const user1Profile = await getUserProfile(userId1);
        const user2Profile = await getUserProfile(userId2);

        await setDoc(chatRef, {
            participants: [userId1, userId2],
            lastMessage: 'Chat started!',
            lastMessageTimestamp: serverTimestamp(),
            participantDetails: {
                [userId1]: {
                    username: user1Profile?.username || 'User 1',
                    avatarUrl: user1Profile?.avatarUrl || '',
                },
                [userId2]: {
                    username: user2Profile?.username || 'User 2',
                    avatarUrl: user2Profile?.avatarUrl || '',
                }
            }
        });
    }
    return chatId;
};

export const sendMessage = async (chatId: string, senderId: string, receiverId: string, text: string): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating sendMessage.");
        return;
    }
    const chatDocRef = doc(db, 'chats', chatId);
    const messagesCollectionRef = collection(chatDocRef, 'messages');

    await addDoc(messagesCollectionRef, {
        senderId,
        receiverId,
        text,
        timestamp: serverTimestamp(),
        read: false,
    });

    await updateDoc(chatDocRef, {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(),
    });
};

export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Returning mock messages for subscription.");
        callback(mockMessages);
        return () => {}; // Return a dummy unsubscribe function
    }
    const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const messages: Message[] = [];
        snapshot.forEach((doc: DocumentSnapshot) => {
            messages.push({ id: doc.id, ...doc.data() } as Message);
        });
        callback(messages);
    });
};

export const getChatDocument = async (chatId: string): Promise<Chat | null> => {
    if (isFirebaseDisabled) {
        return mockChats.find(c => c.id === chatId) || null;
    }
    if (!db) return null;
    const docRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Chat;
    }
    return null;
}

export const getOtherParticipantProfile = async (chatId: string, currentUserId: string): Promise<User | null> => {
    if (isFirebaseDisabled) {
        const otherUserId = mockChats[0].participants.find(p => p !== currentUserId);
        return { ...mockUser, userId: otherUserId!, username: 'PlantPerson', id: otherUserId! };
    }
    const chat = await getChatDocument(chatId);
    if (!chat) return null;
    const otherUserId = chat.participants.find(p => p !== currentUserId);
    if (!otherUserId) return null;
    return await getUserProfile(otherUserId);
}

// REQUIRED FIRESTORE INDEX:
// Collection: 'chats'
// Fields: 1. participants (Array-contains), 2. lastMessageTimestamp (Descending)
export const getUserChats = async (userId: string): Promise<Chat[]> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock user chats.");
        return mockChats;
    }
    if (!db) return [];
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId), orderBy('lastMessageTimestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const chats: Chat[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat);
    });
    return chats;
};


// --- Forum Functions (Forums Pages: /forums, /forums/[communityId]) ---
export const createForum = async (forumData: Omit<Forum, 'id' | 'createdAt' | 'memberCount'>): Promise<string> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating createForum.");
        return "mock-new-forum-id";
    }
    const docRef = await addDoc(collection(db, 'forums'), {
        ...forumData,
        createdAt: serverTimestamp(),
        memberCount: 1, // Start with the creator as a member
    });
    return docRef.id;
};

export const getForums = async (): Promise<Forum[]> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock forums.");
        return mockForums;
    }
    if (!db) return [];
    const q = query(collection(db, 'forums'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const forums: Forum[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        forums.push({ id: doc.id, ...doc.data() } as Forum);
    });
    return forums;
};

export const getForumById = async (forumId: string): Promise<Forum | null> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock forum by ID.");
        return mockForums.find(f => f.id === forumId) || null;
    }
    if (!db) return null;
    const docRef = doc(db, 'forums', forumId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Forum;
    }
    return null;
};

export const addForumPost = async (forumId: string, post: Omit<Post, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'commentCount'>): Promise<string> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating addForumPost.");
        return "mock-new-post-id";
    }
    const docRef = await addDoc(collection(db, 'forums', forumId, 'posts'), {
        ...post,
        createdAt: serverTimestamp(),
        upvotes: [],
        downvotes: [],
        commentCount: 0,
    });
    return docRef.id;
};

export const getPostsForForum = async (forumId: string): Promise<Post[]> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock posts.");
        return mockPosts.filter(p => p.forumId === forumId);
    }
    if (!db) return [];
    const q = query(collection(db, 'forums', forumId, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        posts.push({ id: doc.id, ...doc.data() } as Post);
    });
    return posts;
};

export const getPostById = async (forumId: string, postId: string): Promise<Post | null> => {
    if (isFirebaseDisabled) {
        return mockPosts.find(p => p.id === postId) || null;
    }
    if (!db) return null;
    const docRef = doc(db, 'forums', forumId, 'posts', postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Post;
    }
    return null;
};

export const addCommentToPost = async (forumId: string, postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<string> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating addCommentToPost.");
        return "mock-new-comment-id";
    }
    const commentsCollectionRef = collection(db, 'forums', forumId, 'posts', postId, 'comments');
    const docRef = await addDoc(commentsCollectionRef, { ...comment, createdAt: serverTimestamp() });

    const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
    await updateDoc(postDocRef, { commentCount: increment(1) });

    return docRef.id;
};

export const getCommentsForPost = async (forumId: string, postId: string): Promise<Comment[]> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock comments.");
        return [];
    }
    if (!db) return [];
    const q = query(collection(db, 'forums', forumId, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        comments.push({ id: doc.id, ...doc.data() } as Comment);
    });
    return comments;
};

export const togglePostVote = async (forumId: string, postId: string, userId: string, voteType: 'upvote' | 'downvote'): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating togglePostVote.");
        return;
    }
    const postRef = doc(db, 'forums', forumId, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) return;

    const postData = postSnap.data() as Post;
    let newUpvotes = [...postData.upvotes || []];
    let newDownvotes = [...postData.downvotes || []];

    if (voteType === 'upvote') {
        if (newUpvotes.includes(userId)) {
            newUpvotes = newUpvotes.filter(id => id !== userId);
        } else {
            newUpvotes.push(userId);
            newDownvotes = newDownvotes.filter(id => id !== userId);
        }
    } else if (voteType === 'downvote') {
        if (newDownvotes.includes(userId)) {
            newDownvotes = newDownvotes.filter(id => id !== userId);
        } else {
            newDownvotes.push(userId);
            newUpvotes = newUpvotes.filter(id => id !== userId);
        }
    }

    await updateDoc(postRef, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
    });
};


// --- Wishlist Functions (Wishlist Page: /wishlist) ---
export const addPlantToWishlist = async (userId: string, plantId: string): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating addPlantToWishlist.");
        return;
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        favoritePlants: arrayUnion(plantId),
    });
};

export const removePlantFromWishlist = async (userId: string, plantId: string): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating removePlantFromWishlist.");
        return;
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        favoritePlants: arrayRemove(plantId),
    });
};

export const getWishlistPlants = async (userId: string): Promise<PlantListing[]> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock wishlist plants.");
        const wishlistIds = mockUser.favoritePlants;
        return mockPlantListings.filter(p => wishlistIds.includes(p.id!));
    }
    if (!db) return [];

    const user = await getUserProfile(userId);
    if (!user || !user.favoritePlants || user.favoritePlants.length === 0) {
        return [];
    }

    const plantPromises = user.favoritePlants.map(plantId => getPlantListing(plantId));
    const plants = await Promise.all(plantPromises);

    return plants.filter(plant => plant !== null) as PlantListing[];
};


// --- Auth Functions ---
export const loginUser = async (email: string, password: string) => {
    if (isFirebaseDisabled || !auth) throw new Error("Firebase not configured.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const registerUser = async (email: string, password: string, username: string) => {
    if (isFirebaseDisabled || !auth) throw new Error("Firebase not configured.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    if (newUser) {
        await createUserProfile({
            userId: newUser.uid,
            username: username,
            email: newUser.email || '',
            plantsListed: 0,
            plantsTraded: 0,
            rewardPoints: 0,
            favoritePlants: [],
            followers: [],
            following: [],
        });
    }
    return newUser;
};

export const resetPassword = async (email: string) => {
    if (isFirebaseDisabled || !auth) throw new Error("Firebase not configured.");
    await sendPasswordResetEmail(auth, email);
};

export const logoutUser = async () => {
    if (isFirebaseDisabled || !auth) {
        console.log("Mock Mode: Simulating logout.");
        return;
    };
    await signOut(auth);
};

// --- Reward Functions (Integrated with User/Transaction logic) ---
export const awardRewardPoints = async (userId: string, points: number, description: string): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating awardRewardPoints.");
        return;
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        rewardPoints: increment(points),
    });

    await addDoc(collection(db, 'rewardsTransactions'), {
        userId,
        type: 'earn',
        points,
        description,
        timestamp: serverTimestamp(),
    } as Omit<RewardTransaction, 'id'>);
};

export const redeemRewardPoints = async (userId: string, points: number, description: string): Promise<void> => {
    if (isFirebaseDisabled || !db) {
        console.log("Mock Mode: Simulating redeemRewardPoints.");
        return;
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        rewardPoints: increment(-points),
    });

    await addDoc(collection(db, 'rewardsTransactions'), {
        userId,
        type: 'spend',
        points,
        description,
        timestamp: serverTimestamp(),
    } as Omit<RewardTransaction, 'id'>);
};

// REQUIRED FIRESTORE INDEX:
// Collection: 'rewardsTransactions'
// Fields: 1. userId (Ascending), 2. timestamp (Descending)
export const getRewardTransactions = async (userId: string): Promise<RewardTransaction[]> => {
    if (isFirebaseDisabled) {
        console.log("Mock Mode: Returning mock reward transactions.");
        return [];
    }
    if (!db) return [];
    const q = query(
        collection(db, 'rewardsTransactions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const transactions: RewardTransaction[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        transactions.push({ id: doc.id, ...doc.data() } as RewardTransaction);
    });
    return transactions;
};
