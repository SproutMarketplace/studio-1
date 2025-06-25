// src/lib/firestoreService.ts
import { db, auth } from './firebase'; // Your Firebase instances
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
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
};

export const createUserProfile = async (user: Omit<User, 'id' | 'joinedDate'>): Promise<void> => {
    const userRef = doc(db, 'users', user.userId); // Use userId as doc ID
    await setDoc(userRef, { ...user, joinedDate: serverTimestamp() });
};

export const updateUserData = async (userId: string, data: Partial<User>): Promise<void> => {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, data);
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    const imageRef = ref(storage, `profile_images/${userId}/${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
};

// --- Plant Functions (List Plant Page: /list-plant, General Listings) ---
export const addPlantListing = async (plant: Omit<PlantListing, 'id' | 'listedDate'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'plants'), { ...plant, listedDate: serverTimestamp() });
    return docRef.id;
};

export const getPlantListing = async (plantId: string): Promise<PlantListing | null> => {
    const docRef = doc(db, 'plants', plantId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PlantListing;
    }
    return null;
};

export const getAvailablePlantListings = async (lastDoc?: DocumentSnapshot, limitNum: number = 10): Promise<{ plants: PlantListing[], lastVisible: DocumentSnapshot | null }> => {
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

export const getUserPlantListings = async (ownerId: string): Promise<PlantListing[]> => {
    const q = query(collection(db, 'plants'), where('ownerId', '==', ownerId), orderBy('listedDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const plants: PlantListing[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        plants.push({ id: doc.id, ...doc.data() } as PlantListing);
    });
    return plants;
};

export const updatePlantListing = async (plantId: string, data: Partial<PlantListing>): Promise<void> => {
    const docRef = doc(db, 'plants', plantId);
    await updateDoc(docRef, data);
};

export const deletePlantListing = async (plantId: string): Promise<void> => {
    const docRef = doc(db, 'plants', plantId);
    await deleteDoc(docRef);
    // Optional: Delete associated images from storage
    // You would need to retrieve the plant data first to get image URLs
};

export const uploadPlantImage = async (plantId: string, file: File, index: number): Promise<string> => {
    const imageRef = ref(storage, `plant_images/${plantId}/${index}_${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
};

export const deletePlantImage = async (imageUrl: string): Promise<void> => {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
}


// --- Messaging Functions (Messages Page: /messages) ---
// Helper to generate a consistent chat ID
const getChatDocumentId = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_');
};

export const createOrGetChat = async (userId1: string, userId2: string): Promise<string> => {
    const chatId = getChatDocumentId(userId1, userId2);
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        await setDoc(chatRef, {
            participants: [userId1, userId2],
            lastMessage: '', // Initialize
            lastMessageTimestamp: serverTimestamp(),
        });
    }
    return chatId;
};

export const sendMessage = async (chatId: string, senderId: string, receiverId: string, text: string): Promise<void> => {
    const chatDocRef = doc(db, 'chats', chatId);
    const messagesCollectionRef = collection(chatDocRef, 'messages');

    await addDoc(messagesCollectionRef, {
        senderId,
        receiverId,
        text,
        timestamp: serverTimestamp(),
        read: false,
    });

    // Update last message in chat document (consider using transactions for atomicity)
    await updateDoc(chatDocRef, {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(),
    });
};

// Use onSnapshot for real-time messages in a client component
export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
    const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCollectionRef, orderBy('timestamp'));
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const messages: Message[] = [];
        snapshot.forEach((doc: DocumentSnapshot) => {
            messages.push({ id: doc.id, ...doc.data() } as Message);
        });
        callback(messages);
    });
};

export const getUserChats = async (userId: string): Promise<Chat[]> => {
    // Query for chats where the user is a participant
    const q1 = query(collection(db, 'chats'), where('participants', 'array-contains', userId), orderBy('lastMessageTimestamp', 'desc'));
    const querySnapshot = await getDocs(q1);
    const chats: Chat[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat);
    });
    return chats;
};


// --- Forum Functions (Forums Pages: /forums, /forums/[communityId]) ---
export const getForums = async (): Promise<Forum[]> => {
    const q = query(collection(db, 'forums'), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const forums: Forum[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        forums.push({ id: doc.id, ...doc.data() } as Forum);
    });
    return forums;
};

export const getForumById = async (forumId: string): Promise<Forum | null> => {
    const docRef = doc(db, 'forums', forumId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Forum;
    }
    return null;
};

export const addForumPost = async (forumId: string, post: Omit<Post, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'commentCount'>): Promise<string> => {
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
    const q = query(collection(db, 'forums', forumId, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        posts.push({ id: doc.id, ...doc.data() } as Post);
    });
    return posts;
};

export const getPostById = async (forumId: string, postId: string): Promise<Post | null> => {
    const docRef = doc(db, 'forums', forumId, 'posts', postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Post;
    }
    return null;
};

export const addCommentToPost = async (forumId: string, postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<string> => {
    const commentsCollectionRef = collection(db, 'forums', forumId, 'posts', postId, 'comments');
    const docRef = await addDoc(commentsCollectionRef, { ...comment, createdAt: serverTimestamp() });

    // Increment comment count on the post (consider using a transaction or Cloud Function for atomic updates)
    const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
    await updateDoc(postDocRef, { commentCount: increment(1) }); // Use increment for atomic update

    return docRef.id;
};

export const getCommentsForPost = async (forumId: string, postId: string): Promise<Comment[]> => {
    const q = query(collection(db, 'forums', forumId, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        comments.push({ id: doc.id, ...doc.data() } as Comment);
    });
    return comments;
};

export const togglePostVote = async (forumId: string, postId: string, userId: string, voteType: 'upvote' | 'downvote'): Promise<void> => {
    const postRef = doc(db, 'forums', forumId, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) return;

    const postData = postSnap.data() as Post;
    let newUpvotes = [...postData.upvotes || []];
    let newDownvotes = [...postData.downvotes || []];

    if (voteType === 'upvote') {
        if (newUpvotes.includes(userId)) {
            // User already upvoted, remove upvote
            newUpvotes = newUpvotes.filter(id => id !== userId);
        } else {
            // Add upvote, remove downvote if present
            newUpvotes.push(userId);
            newDownvotes = newDownvotes.filter(id => id !== userId);
        }
    } else if (voteType === 'downvote') {
        if (newDownvotes.includes(userId)) {
            // User already downvoted, remove downvote
            newDownvotes = newDownvotes.filter(id => id !== userId);
        } else {
            // Add downvote, remove upvote if present
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
// This assumes a user's wishlist is an array of plant IDs within their user document
export const addPlantToWishlist = async (userId: string, plantId: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        favoritePlants: arrayUnion(plantId),
    });
};

export const removePlantFromWishlist = async (userId: string, plantId: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        favoritePlants: arrayRemove(plantId),
    });
};

// To get the actual plant details for a wishlist, you'd fetch the user's wishlist IDs
// then loop through them to get each plant's data from the 'plants' collection.
export const getWishlistPlants = async (userId: string): Promise<PlantListing[]> => {
    const user = await getUserProfile(userId);
    if (!user || !user.favoritePlants || user.favoritePlants.length === 0) {
        return [];
    }

    const plantPromises = user.favoritePlants.map(plantId => getPlantListing(plantId));
    const plants = await Promise.all(plantPromises);

    // Filter out any nulls if a plant was deleted or not found
    return plants.filter(plant => plant !== null) as PlantListing[];
};


// --- Auth Functions ---
export const loginUser = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const registerUser = async (email: string, password: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    if (newUser) {
        // Create Firestore profile immediately after successful registration
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
    await sendPasswordResetEmail(auth, email);
};

export const logoutUser = async () => {
    await signOut(auth);
};

// --- Reward Functions (Integrated with User/Transaction logic) ---
export const awardRewardPoints = async (userId: string, points: number, description: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        rewardPoints: increment(points), // Atomically increase points
    });

    // Record transaction
    await addDoc(collection(db, 'rewardsTransactions'), {
        userId,
        type: 'earn',
        points,
        description,
        timestamp: serverTimestamp(),
    } as Omit<RewardTransaction, 'id'>);
};

export const redeemRewardPoints = async (userId: string, points: number, description: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    // You might want to check if the user has enough points before decrementing
    await updateDoc(userRef, {
        rewardPoints: increment(-points), // Atomically decrease points
    });

    // Record transaction
    await addDoc(collection(db, 'rewardsTransactions'), {
        userId,
        type: 'spend',
        points,
        description,
        timestamp: serverTimestamp(),
    } as Omit<RewardTransaction, 'id'>);
};

export const getRewardTransactions = async (userId: string): Promise<RewardTransaction[]> => {
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
