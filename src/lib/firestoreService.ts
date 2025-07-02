
// src/lib/firestoreService.ts
import { db, auth, storage } from '@/lib/firebase'; // Your Firebase instances
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
    writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';

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
    Order,
    OrderItem,
} from '@/models';

// --- General Utility Functions ---
export const getTimestamp = () => serverTimestamp() as Timestamp;

// --- User Functions (Profile Page: /profile) ---
export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (!db) return null;
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
};

export const createUserProfile = async (user: Omit<User, 'id' | 'joinedDate'>): Promise<void> => {
    if (!db) return;
    const userRef = doc(db, 'users', user.userId); // Use userId as doc ID
    await setDoc(userRef, { 
        ...user, 
        joinedDate: serverTimestamp(),
    });
};

export const updateUserData = async (userId: string, data: Partial<User>): Promise<void> => {
    if (!auth || !db) return;
    const user = auth.currentUser;
    if (!user || user.uid !== userId) return; // Ensure the current user is the one being updated

    // Update Firebase Auth profile if relevant fields are present
    const authUpdateData: { displayName?: string; photoURL?: string } = {};
    if (data.username) {
        authUpdateData.displayName = data.username;
    }
    if (data.avatarUrl) {
        authUpdateData.photoURL = data.avatarUrl;
    }

    if (Object.keys(authUpdateData).length > 0) {
        await updateProfile(user, authUpdateData);
    }
    
    // Update Firestore document
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, data);
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    if (!storage) throw new Error("Firebase Storage is not configured.");
    const imageRef = ref(storage, `profile_images/${userId}/${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
};

// --- Plant Functions (List Plant Page: /list-plant, General Listings) ---
export const addPlantListing = async (plant: Omit<PlantListing, 'id' | 'listedDate'>): Promise<string> => {
    if (!db) throw new Error("Firebase Firestore is not configured.");
    const docRef = await addDoc(collection(db, 'plants'), { ...plant, listedDate: serverTimestamp() });
    
    // Increment the user's plantsListed count
    const userRef = doc(db, 'users', plant.ownerId);
    await updateDoc(userRef, {
        plantsListed: increment(1)
    });

    // Give 10 points for listing a plant
    await awardRewardPoints(plant.ownerId, 10, "Listed a new plant");

    return docRef.id;
};

export const getPlantListing = async (plantId: string): Promise<PlantListing | null> => {
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
    if (!db) return;
    const plantDocRef = doc(db, 'plants', plantId);
    await updateDoc(plantDocRef, data);
};

export const deletePlantListing = async (plant: PlantListing): Promise<void> => {
    if (!db || !storage || !plant.id || !plant.ownerId) {
        throw new Error("Deletion failed: invalid plant data or Firebase service not available.");
    }

    // 1. Delete images from Storage
    if (plant.imageUrls && plant.imageUrls.length > 0) {
        for (const url of plant.imageUrls) {
            try {
                const imageRef = ref(storage, url);
                await deleteObject(imageRef);
            } catch (error) {
                 // Log error but don't block deletion of the document if an image fails to delete
                 console.error(`Failed to delete image ${url}:`, error);
            }
        }
    }

    // 2. Delete document from Firestore
    const plantDocRef = doc(db, 'plants', plant.id);
    await deleteDoc(plantDocRef);

    // 3. Decrement user's plantsListed count
    const userRef = doc(db, 'users', plant.ownerId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        await updateDoc(userRef, {
            plantsListed: increment(-1)
        });
    }
};

export const uploadPlantImage = async (plantId: string, file: File, index: number): Promise<string> => {
    if (!storage) throw new Error("Firebase Storage is not configured.");
    const imageRef = ref(storage, `plant_images/${plantId}/${index}_${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
};

export const deletePlantImageByUrl = async (imageUrl: string): Promise<void> => {
    if (!storage) throw new Error("Firebase Storage is not configured.");
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            console.warn(`Image not found, could not delete: ${imageUrl}`);
            return; // Don't throw an error if it's already gone
        }
        console.error(`Failed to delete image ${imageUrl}:`, error);
        throw error; // Re-throw other errors
    }
};


// --- Messaging Functions (Messages Page: /messages) ---
const getChatDocumentId = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_');
};

export const createOrGetChat = async (userId1: string, userId2: string): Promise<string> => {
    if (!db) throw new Error("Firebase Firestore is not configured.");
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
    if (!db) return;
    const chatDocRef = doc(db, 'chats', chatId);
    const messagesCollectionRef = collection(chatDocRef, 'messages');

    // Add the new message
    await addDoc(messagesCollectionRef, {
        senderId,
        receiverId,
        text,
        timestamp: serverTimestamp(),
        read: false,
    });

    // Update the last message on the chat document
    await updateDoc(chatDocRef, {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(),
    });

    // Increment the unread count for the receiver
    const receiverUserRef = doc(db, 'users', receiverId);
    await updateDoc(receiverUserRef, {
        unreadMessageCount: increment(1)
    });
};

export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
    if (!db) return () => {};
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

export const markChatAsRead = async (chatId: string, currentUserId: string): Promise<void> => {
    if (!db) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('receiverId', '==', currentUserId), where('read', '==', false));
    
    const unreadMessagesSnapshot = await getDocs(q);
    
    if (unreadMessagesSnapshot.empty) {
        return; // No unread messages to process
    }
    
    const batch = writeBatch(db);
    let unreadCount = 0;

    unreadMessagesSnapshot.forEach(messageDoc => {
        batch.update(messageDoc.ref, { read: true });
        unreadCount++;
    });

    if (unreadCount > 0) {
        const userRef = doc(db, 'users', currentUserId);
        batch.update(userRef, {
            unreadMessageCount: increment(-unreadCount)
        });
    
        await batch.commit();
    }
};

export const getChatDocument = async (chatId: string): Promise<Chat | null> => {
    if (!db) return null;
    const docRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Chat;
    }
    return null;
}

export const getOtherParticipantProfile = async (chatId: string, currentUserId: string): Promise<User | null> => {
    if (!db) return null;
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
    if (!db) throw new Error("Firebase Firestore is not configured.");
    const docRef = await addDoc(collection(db, 'forums'), {
        ...forumData,
        createdAt: serverTimestamp(),
        memberCount: 1, // Start with the creator as a member
    });
    return docRef.id;
};

export const getForums = async (): Promise<Forum[]> => {
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
    if (!db) return null;
    const docRef = doc(db, 'forums', forumId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Forum;
    }
    return null;
};

export const updateForum = async (forumId: string, data: Partial<Forum>): Promise<void> => {
    if (!db) return;
    const forumRef = doc(db, 'forums', forumId);
    await updateDoc(forumRef, data);
};

export const uploadForumBanner = async (forumId: string, file: File): Promise<string> => {
    if (!storage) throw new Error("Firebase Storage is not configured.");
    const imageRef = ref(storage, `forum_banners/${forumId}/${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
};

export const addForumPost = async (post: Omit<Post, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'commentCount'>): Promise<string> => {
    if (!db) throw new Error("Firebase Firestore is not configured.");
    const docRef = await addDoc(collection(db, 'forums', post.forumId, 'posts'), {
        ...post,
        createdAt: serverTimestamp(),
        upvotes: [],
        downvotes: [],
        commentCount: 0,
    });
    return docRef.id;
};

export const updateForumPost = async (forumId: string, postId: string, data: Partial<Post>): Promise<void> => {
    if (!db) return;
    const postRef = doc(db, 'forums', forumId, 'posts', postId);
    await updateDoc(postRef, data);
};

export const uploadPostImage = async (forumId: string, postId: string, file: File, index: number): Promise<string> => {
    if (!storage) throw new Error("Firebase Storage is not configured.");
    const imageRef = ref(storage, `post_images/${forumId}/${postId}/${index}_${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
};

export const getPostsForForum = async (forumId: string): Promise<Post[]> => {
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
    if (!db) return null;
    const docRef = doc(db, 'forums', forumId, 'posts', postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Post;
    }
    return null;
};

export const addCommentToPost = async (forumId: string, postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<string> => {
    if (!db) throw new Error("Firebase Firestore is not configured.");
    const commentsCollectionRef = collection(db, 'forums', forumId, 'posts', postId, 'comments');
    const docRef = await addDoc(commentsCollectionRef, { ...comment, createdAt: serverTimestamp() });

    const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
    await updateDoc(postDocRef, { commentCount: increment(1) });

    return docRef.id;
};

export const getCommentsForPost = async (forumId: string, postId: string): Promise<Comment[]> => {
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
    if (!db) return;
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
    if (!db) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        favoritePlants: arrayUnion(plantId),
    });
};

export const removePlantFromWishlist = async (userId: string, plantId: string): Promise<void> => {
    if (!db) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        favoritePlants: arrayRemove(plantId),
    });
};

export const getWishlistPlants = async (userId: string): Promise<PlantListing[]> => {
    if (!db) return [];
    const user = await getUserProfile(userId);
    if (!user || !user.favoritePlants || user.favoritePlants.length === 0) {
        return [];
    }

    const plantPromises = user.favoritePlants.map(plantId => getPlantListing(plantId));
    const plants = await Promise.all(plantPromises);

    return plants.filter(plant => plant !== null) as PlantListing[];
};


// --- Order Functions ---

// Called by the Stripe webhook
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'sellerIds'>): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");

    const batch = writeBatch(db);

    // 1. Create the main order document
    const orderRef = doc(collection(db, 'orders'));
    const buyerProfile = await getUserProfile(orderData.userId);
    const sellerIds = [...new Set(orderData.items.map(item => item.sellerId))];

    batch.set(orderRef, {
        ...orderData,
        status: 'processing',
        createdAt: serverTimestamp(),
        sellerIds: sellerIds,
        buyerUsername: buyerProfile?.username || 'Unknown Buyer'
    });

    // 2. Update each plant listing to mark it as sold
    for (const item of orderData.items) {
        const plantRef = doc(db, 'plants', item.plantId);
        batch.update(plantRef, { isAvailable: false });

        // 3. Update seller's stats
        const sellerRef = doc(db, 'users', item.sellerId);
        // We can increment here, but for simplicity we rely on the dashboard to calculate stats for now.
        // This can be added later if performance becomes an issue.
    }

    await batch.commit();
};

// REQUIRED FIRESTORE INDEX:
// Collection: 'orders'
// Fields: 1. sellerIds (Array-contains), 2. createdAt (Descending)
export const getOrdersForSeller = async (sellerId: string): Promise<Order[]> => {
    if (!db) return [];
    const q = query(
        collection(db, 'orders'),
        where('sellerIds', 'array-contains', sellerId),
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    return orders;
};

// --- Follow Functions ---
export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
    if (!db || currentUserId === targetUserId) return;
    const batch = writeBatch(db);

    const currentUserRef = doc(db, 'users', currentUserId);
    batch.update(currentUserRef, {
        following: arrayUnion(targetUserId)
    });

    const targetUserRef = doc(db, 'users', targetUserId);
    batch.update(targetUserRef, {
        followers: arrayUnion(currentUserId)
    });

    await batch.commit();
};

export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
    if (!db || currentUserId === targetUserId) return;
    const batch = writeBatch(db);

    const currentUserRef = doc(db, 'users', currentUserId);
    batch.update(currentUserRef, {
        following: arrayRemove(targetUserId)
    });

    const targetUserRef = doc(db, 'users', targetUserId);
    batch.update(targetUserRef, {
        followers: arrayRemove(currentUserId)
    });

    await batch.commit();
};


// --- Auth Functions ---
export const loginUser = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured. App is in offline mode.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const registerUser = async (email: string, password: string, username: string) => {
    if (!auth) throw new Error("Firebase not configured. App is in offline mode.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // Also update the user's profile in Firebase Auth
    await updateProfile(newUser, { displayName: username });

    // Create the user profile document in Firestore
    await createUserProfile({
        userId: newUser.uid,
        username: username,
        email: newUser.email || '',
        plantsListed: 0,
        plantsTraded: 0,
        rewardPoints: 0,
        unreadMessageCount: 0,
        favoritePlants: [],
        followers: [],
        following: [],
    });

    return newUser;
};

export const resetPassword = async (email: string) => {
    if (!auth) throw new Error("Firebase not configured. App is in offline mode.");
    await sendPasswordResetEmail(auth, email);
};

export const logoutUser = async () => {
    if (!auth) return;
    await signOut(auth);
};

// --- Reward Functions (Integrated with User/Transaction logic) ---
export const awardRewardPoints = async (userId: string, points: number, description: string): Promise<void> => {
    if (!db) return;
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
    if (!db) return;
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
