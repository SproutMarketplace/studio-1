
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
    Notification,
} from '@/models';

// --- General Utility Functions ---
export const getTimestamp = () => serverTimestamp() as Timestamp;

// --- Notification Functions ---
const createNotification = async (
    userIdToNotify: string, 
    fromUserId: string,
    type: Notification['type'], 
    message: string, 
    link: string
): Promise<void> => {
    if (!db || userIdToNotify === fromUserId) return; 

    // Fetch the profile of the user triggering the notification to ensure data is fresh.
    const fromUserProfile = await getUserProfile(fromUserId);
    if (!fromUserProfile) {
        console.error("Could not create notification: 'from' user profile not found for ID:", fromUserId);
        return;
    }

    const notificationRef = collection(db, 'users', userIdToNotify, 'notifications');
    await addDoc(notificationRef, {
        userId: userIdToNotify,
        type,
        message,
        link,
        isRead: false,
        createdAt: serverTimestamp(),
        fromUser: {
            id: fromUserId,
            username: fromUserProfile.username,
            avatarUrl: fromUserProfile.avatarUrl || '',
        }
    });
};

export const getNotificationsForUser = async (userId: string, limitNum: number = 50): Promise<Notification[]> => {
    if (!db) return [];
    const q = query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(limitNum));
    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    querySnapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });
    return notifications;
};

export const markUserNotificationsAsRead = async (userId: string): Promise<void> => {
    if (!db) return;
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('isRead', '==', false));
    const unreadSnapshot = await getDocs(q);

    if (unreadSnapshot.empty) return;
    
    const batch = writeBatch(db);
    unreadSnapshot.forEach(notificationDoc => {
        batch.update(notificationDoc.ref, { isRead: true });
    });
    
    await batch.commit();
};


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

// REQUIRED FIRESTORE INDEX:
// Collection: 'users'
// Fields: 1. username (Ascending)
export const getUserByUsername = async (username: string): Promise<User | null> => {
    if (!db) return null;
    const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as User;
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
export const subscribeToAvailablePlantListings = (
    onUpdate: (plants: PlantListing[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    if (!db) {
        onError(new Error("Firestore is not initialized."));
        return () => {};
    }

    const q = query(
        collection(db, 'plants'),
        where('isAvailable', '==', true),
        orderBy('listedDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
        (querySnapshot: QuerySnapshot) => {
            const plants: PlantListing[] = [];
            querySnapshot.forEach((doc: DocumentSnapshot) => {
                plants.push({ id: doc.id, ...doc.data() } as PlantListing);
            });
            onUpdate(plants);
        },
        (error) => {
            console.error("Error in plant subscription:", error);
            onError(error);
        }
    );

    return unsubscribe; // Return the unsubscribe function for cleanup
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

    // Create a notification for the receiver
    await createNotification(
        receiverId,
        senderId,
        'newMessage',
        `sent you a new message.`,
        `/messages/${chatId}`
    );
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
    // This function is now superseded by markUserNotificationsAsRead,
    // but can be kept for more granular 'read' status on messages if needed in the future.
    // For now, the main notification clearing happens on the notifications page.
    const notificationsRef = collection(db, 'users', currentUserId, 'notifications');
    const q = query(notificationsRef, where('link', '==', `/messages/${chatId}`), where('isRead', '==', false));
    const unreadNotificationsSnapshot = await getDocs(q);

    if (unreadNotificationsSnapshot.empty) return;
    
    const batch = writeBatch(db);
    unreadNotificationsSnapshot.forEach(notificationDoc => {
        batch.update(notificationDoc.ref, { isRead: true });
    });
    
    await batch.commit();
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
export const createForum = async (forumData: Omit<Forum, 'id' | 'createdAt' | 'memberCount' | 'moderatorIds'>): Promise<string> => {
    if (!db) throw new Error("Firebase Firestore is not configured.");
    const docRef = await addDoc(collection(db, 'forums'), {
        ...forumData,
        createdAt: serverTimestamp(),
        memberCount: 1, // Start with the creator as a member
        moderatorIds: [],
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

export const deleteForum = async (forumId: string, bannerUrl?: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not configured.");

    if (bannerUrl && storage) {
        try {
            await deleteForumBanner(bannerUrl);
        } catch (error: any) {
             console.error(`Failed to delete banner for forum ${forumId}:`, error);
        }
    }

    // This only deletes the forum document. A robust solution for deleting all posts and comments
    // would require a Cloud Function to handle cascading deletes.
    await deleteDoc(doc(db, 'forums', forumId));
};

export const uploadForumBanner = async (forumId: string, file: File): Promise<string> => {
    if (!storage) throw new Error("Firebase Storage is not configured.");
    // Add a timestamp to the filename to prevent caching issues on re-upload
    const imageRef = ref(storage, `forum_banners/${forumId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
};

export const deleteForumBanner = async (bannerUrl: string): Promise<void> => {
    if (!storage) return;
    try {
        const bannerRef = ref(storage, bannerUrl);
        await deleteObject(bannerRef);
    } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
            console.error(`Failed to delete banner at ${bannerUrl}:`, error);
            throw error; // Re-throw if it's not a "not found" error
        }
        // If it's not found, we can just ignore it.
    }
};

export const addModeratorToForum = async (forumId: string, userId: string): Promise<void> => {
    if (!db) return;
    const forumRef = doc(db, 'forums', forumId);
    await updateDoc(forumRef, { moderatorIds: arrayUnion(userId) });
};

export const removeModeratorFromForum = async (forumId: string, userId: string): Promise<void> => {
    if (!db) return;
    const forumRef = doc(db, 'forums', forumId);
    await updateDoc(forumRef, { moderatorIds: arrayRemove(userId) });
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

export const deleteForumPost = async (forumId: string, post: Post): Promise<void> => {
    if (!db || !storage || !post.id) {
        throw new Error("Deletion failed: invalid post data or Firebase service not available.");
    }
    
    // Delete images from Storage
    if (post.imageUrls && post.imageUrls.length > 0) {
        for (const url of post.imageUrls) {
            try {
                const imageRef = ref(storage, url);
                await deleteObject(imageRef);
            } catch (error) {
                 console.error(`Failed to delete image ${url}:`, error);
            }
        }
    }
    
    // Note: Deleting subcollections (like comments) client-side is not recommended for production.
    // A Cloud Function would be a more robust solution for cascading deletes.
    // For this implementation, we will just delete the post document.
    const postDocRef = doc(db, 'forums', forumId, 'posts', post.id);
    await deleteDoc(postDocRef);
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

type NewCommentData = Omit<Comment, 'id' | 'createdAt' | 'replyCount'>;
export const addCommentToPost = async (forumId: string, postId: string, comment: NewCommentData): Promise<string> => {
    if (!db) throw new Error("Firebase Firestore is not configured.");
    
    const batch = writeBatch(db);

    const commentsCollectionRef = collection(db, 'forums', forumId, 'posts', postId, 'comments');
    const newCommentRef = doc(commentsCollectionRef); // Create a new doc reference with an auto-generated ID
    
    batch.set(newCommentRef, { 
        ...comment, 
        createdAt: serverTimestamp(),
        replyCount: 0,
    });

    const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
    batch.update(postDocRef, { commentCount: increment(1) });
    
    let parentAuthorId: string | null = null;
    if (comment.parentId) {
        const parentCommentRef = doc(db, 'forums', forumId, 'posts', postId, 'comments', comment.parentId);
        batch.update(parentCommentRef, { replyCount: increment(1) });
        
        // Fetch parent comment author for notification
        const parentSnap = await getDoc(parentCommentRef);
        if (parentSnap.exists()) {
            parentAuthorId = parentSnap.data().authorId;
        }
    }
    
    await batch.commit();

    const postSnap = await getDoc(postDocRef);
    if (postSnap.exists()) {
        const postData = postSnap.data() as Post;
        // Notify the post author if it's a root comment
        if (!comment.parentId && postData.authorId !== comment.authorId) {
            await createNotification(
                postData.authorId,
                comment.authorId,
                'newComment',
                `commented on your post: "${postData.title}"`,
                `/forums/${forumId}/${postId}`
            );
        }
        // Notify the parent comment author if it's a reply
        if (parentAuthorId && parentAuthorId !== comment.authorId) {
            await createNotification(
                parentAuthorId,
                comment.authorId,
                'newComment',
                `replied to your comment.`,
                `/forums/${forumId}/${postId}`
            );
        }
    }

    return newCommentRef.id;
};

export const updateComment = async (forumId: string, postId: string, commentId: string, data: Partial<Comment>): Promise<void> => {
    if (!db) return;
    const commentRef = doc(db, 'forums', forumId, 'posts', postId, 'comments', commentId);
    await updateDoc(commentRef, data);
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

export const deleteComment = async (forumId: string, postId: string, commentId: string, parentId?: string | null): Promise<void> => {
    if (!db) throw new Error("Firebase Firestore is not configured.");
    
    const batch = writeBatch(db);

    const commentRef = doc(db, 'forums', forumId, 'posts', postId, 'comments', commentId);
    batch.delete(commentRef);

    const postRef = doc(db, 'forums', forumId, 'posts', postId);
    batch.update(postRef, { commentCount: increment(-1) });

    if (parentId) {
        const parentCommentRef = doc(db, 'forums', forumId, 'posts', postId, 'comments', parentId);
        batch.update(parentCommentRef, { replyCount: increment(-1) });
    }
    
    await batch.commit();
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

// Called by the Stripe webhook. Now creates separate orders for each seller.
export const createOrder = async (
    buyerId: string, 
    items: OrderItem[], 
    stripeSessionId: string
): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");

    const buyerProfile = await getUserProfile(buyerId);
    if (!buyerProfile) {
        console.error("Could not create order: Buyer profile not found.");
        return;
    }

    // Group items by seller
    const itemsBySeller = items.reduce((acc, item) => {
        const sellerId = item.sellerId;
        if (!acc[sellerId]) {
            acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
    }, {} as { [key: string]: OrderItem[] });

    // Create a separate order and perform updates for each seller
    for (const sellerId in itemsBySeller) {
        const sellerItems = itemsBySeller[sellerId];

        try {
            const sellerProfile = await getUserProfile(sellerId);
            if (!sellerProfile) {
                console.warn(`Could not process order for seller ${sellerId}: Profile not found. Skipping.`);
                continue; // Skip this seller's items and move to the next
            }
            
            const batch = writeBatch(db);
            const sellerTotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
            // 1. Create one order document per seller
            const orderRef = doc(collection(db, 'orders'));
            batch.set(orderRef, {
                userId: buyerId,
                sellerId: sellerId,
                items: sellerItems,
                totalAmount: sellerTotal,
                status: 'processing',
                createdAt: serverTimestamp(),
                stripeSessionId: stripeSessionId,
                buyerUsername: buyerProfile.username || 'Unknown Buyer'
            });
    
            // 2. Decrement plant quantity and mark as unavailable if needed
            for (const item of sellerItems) {
                if (item.plantId) {
                    const plantRef = doc(db, 'plants', item.plantId);
                    const plantSnap = await getDoc(plantRef);
                    if (plantSnap.exists()) {
                        const currentQuantity = plantSnap.data().quantity || 1;
                        const newQuantity = currentQuantity - item.quantity;
                        
                        const updateData: Partial<PlantListing> = {
                            quantity: newQuantity
                        };

                        if (newQuantity <= 0) {
                            updateData.isAvailable = false;
                        }
                        
                        batch.update(plantRef, updateData);
                    }
                } else {
                    console.warn("Order item is missing a plantId:", item.name);
                }
            }
    
            // 3. Commit the batch for this seller
            await batch.commit();
    
            // 4. Notify this seller
            await createNotification(
                sellerId,
                buyerId,
                'newSale',
                `bought one of your listings!`,
                '/seller/orders'
            );

            // 5. Award points to the seller
            await awardRewardPoints(sellerId, 25, "Completed a sale");

        } catch (error) {
            console.error(`Failed to process order for seller ${sellerId}:`, error);
        }
    }
};

// REQUIRED FIRESTORE INDEX:
// Collection: 'orders'
// Fields: 1. sellerId (Ascending), 2. createdAt (Descending)
export const getOrdersForSeller = async (sellerId: string): Promise<Order[]> => {
    if (!db) return [];
    const q = query(
        collection(db, 'orders'),
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    return orders;
};

// REQUIRED FIRESTORE INDEX:
// Collection: 'orders'
// Fields: 1. userId (Ascending), 2. createdAt (Descending)
export const getOrdersForBuyer = async (buyerId: string): Promise<Order[]> => {
    if (!db) return [];
    const q = query(
        collection(db, 'orders'),
        where('userId', '==', buyerId),
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

    await createNotification(
        targetUserId,
        currentUserId,
        'newFollower',
        `started following you.`,
        `/profile/${currentUserId}`
    );
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

    