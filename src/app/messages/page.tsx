
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

import { useAuth } from '@/contexts/auth-context';
import { getUserChats } from '@/lib/firestoreService';
import type { Chat } from '@/models';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, User as UserIcon, Inbox } from 'lucide-react';

export default function MessagesPage() {
    const { user, loading: authLoading } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            const fetchChats = async () => {
                setIsLoading(true);
                try {
                    const userChats = await getUserChats(user.uid);
                    setChats(userChats);
                } catch (error) {
                    console.error("Failed to fetch chats:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchChats();
        } else if (!authLoading) {
            setChats([]);
            setIsLoading(false);
        }
    }, [user, authLoading]);

    if (isLoading || authLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto py-8 text-center">
                <Card className="max-w-md mx-auto shadow-lg">
                    <CardHeader>
                        <CardTitle>View Your Messages</CardTitle>
                        <CardDescription>Please log in to see your conversations.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild><Link href="/login">Login to View Messages</Link></Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const getOtherParticipant = (chat: Chat) => {
        const otherUserId = chat.participants.find(p => p !== user.uid);
        if (!otherUserId || !chat.participantDetails) {
            return { username: 'Unknown User', avatarUrl: '' };
        }
        return chat.participantDetails[otherUserId] || { username: 'Unknown User', avatarUrl: '' };
    };

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl flex items-center gap-3">
                    <MessageCircle className="w-10 h-10" /> Your Messages
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    All your conversations in one place.
                </p>
            </header>

            <Card className="shadow-lg">
                <CardContent className="p-0">
                    {chats.length > 0 ? (
                        <ul className="divide-y divide-border">
                            {chats.map(chat => {
                                const otherParticipant = getOtherParticipant(chat);
                                const lastMessageTimestamp = chat.lastMessageTimestamp as Timestamp | null;

                                return (
                                    <li key={chat.id}>
                                        <Link href={`/messages/${chat.id}`} className="block hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center space-x-4 p-4">
                                                <Avatar className="h-12 w-12 border">
                                                    <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.username} />
                                                    <AvatarFallback><UserIcon /></AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-base font-semibold text-foreground truncate">
                                                            {otherParticipant.username}
                                                        </p>
                                                        {lastMessageTimestamp && (
                                                            <p className="text-xs text-muted-foreground shrink-0 ml-2">
                                                                {formatDistanceToNow(lastMessageTimestamp.toDate(), { addSuffix: true })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {chat.lastMessage}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="p-12 text-center">
                            <Inbox className="w-16 h-16 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No messages yet</h3>
                            <p className="mt-1 text-muted-foreground">Start a conversation from a plant listing or user profile.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
