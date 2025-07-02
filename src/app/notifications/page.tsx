
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getNotificationsForUser, markUserNotificationsAsRead } from "@/lib/firestoreService";
import type { Notification } from "@/models";
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Inbox, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (user?.uid) {
            const fetchAndMarkNotifications = async () => {
                setIsLoading(true);
                try {
                    const fetchedNotifications = await getNotificationsForUser(user.uid);
                    setNotifications(fetchedNotifications);
                    // Mark as read after fetching and displaying them
                    await markUserNotificationsAsRead(user.uid);
                } catch (error) {
                    console.error("Failed to fetch or mark notifications:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAndMarkNotifications();
        } else if (!authLoading) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (isLoading || authLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl flex items-center gap-3">
                    <Bell className="w-10 h-10" /> Notifications
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Here's what you've missed.
                </p>
            </header>

            <Card className="shadow-lg">
                <CardContent className="p-0">
                    {notifications.length > 0 ? (
                        <ul className="divide-y divide-border">
                            {notifications.map(notif => (
                                <li key={notif.id}>
                                    <Link href={notif.link} className={cn("block hover:bg-muted/50 transition-colors", !notif.isRead && "bg-primary/5")}>
                                        <div className="flex items-center space-x-4 p-4">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src={notif.fromUser.avatarUrl} alt={notif.fromUser.username} />
                                                <AvatarFallback><UserIcon /></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground">
                                                    <span className="font-semibold">{notif.fromUser.username}</span> {notif.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow((notif.createdAt as Timestamp).toDate(), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></div>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-12 text-center">
                            <Inbox className="w-16 h-16 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">All caught up!</h3>
                            <p className="mt-1 text-muted-foreground">You don't have any new notifications.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
