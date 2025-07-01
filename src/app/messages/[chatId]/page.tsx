
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { subscribeToMessages, sendMessage, getChatDocument, getOtherParticipantProfile } from "@/lib/firestoreService";
import type { Message, User } from "@/models";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Send, ArrowLeft, User as UserIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const chatId = params.chatId as string;
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user && chatId) {
            const fetchChatInfo = async () => {
                try {
                    // Also check if current user is part of the chat
                    const chatDoc = await getChatDocument(chatId);
                    if (!chatDoc || !chatDoc.participants.includes(user.uid)) {
                        router.push('/messages'); // Not your chat, redirect
                        return;
                    }
                    const profile = await getOtherParticipantProfile(chatId, user.uid);
                    setOtherUser(profile);
                } catch (error) {
                    console.error("Error fetching chat info", error);
                    router.push('/messages');
                } finally {
                    setIsLoading(false);
                }
            }
            fetchChatInfo();
            
            const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
                setMessages(newMessages);
            });

            return () => unsubscribe();
        } else if (!authLoading) {
            router.push('/login');
        }
    }, [chatId, user, authLoading, router]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !otherUser || !otherUser.id) return;

        setIsSending(true);
        try {
            await sendMessage(chatId, user.uid, otherUser.id, newMessage.trim());
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading || authLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    if (!otherUser) {
        return <div className="flex h-full items-center justify-center">Could not load chat.</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.28))] md:h-[calc(100vh-theme(spacing.36))]">
            <Card className="flex flex-col flex-1 shadow-lg">
                <CardHeader className="flex-row items-center border-b p-4">
                     <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={() => router.push('/messages')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10 border mr-4">
                        <AvatarImage src={otherUser.avatarUrl} alt={otherUser.username} />
                        <AvatarFallback><UserIcon /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold">{otherUser.username}</h2>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-4 sm:p-6">
                        <div className="space-y-4">
                        {messages.map(message => (
                             <div key={message.id} className={cn("flex items-end gap-2", message.senderId === user?.uid ? "justify-end" : "justify-start")}>
                                {message.senderId !== user?.uid && (
                                     <Avatar className="h-8 w-8 border self-end">
                                        <AvatarImage src={otherUser.avatarUrl} alt={otherUser.username} />
                                        <AvatarFallback><UserIcon className="h-4 w-4"/></AvatarFallback>
                                     </Avatar>
                                )}
                                <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2 shadow-sm", 
                                    message.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                    <p className="text-sm break-words">{message.text}</p>
                                    <p className={cn("text-xs mt-1", message.senderId === user?.uid ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-right")}>
                                        {format((message.timestamp as Timestamp).toDate(), 'p')}
                                    </p>
                                </div>
                             </div>
                        ))}
                        <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t bg-background">
                    <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                        <Input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            autoComplete="off"
                            disabled={isSending}
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
