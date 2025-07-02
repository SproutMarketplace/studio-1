'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

import { useAuth } from '@/contexts/auth-context';
import { getNotificationsForUser, markUserNotificationsAsRead } from '@/lib/firestoreService';
import type { Notification } from '@/models';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardFooter, CardDescription, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { User as UserIcon, Loader2, Inbox } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

export function NotificationPopover({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && user) {
      setIsLoading(true);
      try {
        const fetchedNotifications = await getNotificationsForUser(user.uid, 7); // Fetch recent notifications
        setNotifications(fetchedNotifications);
        
        // Mark as read only if there are unread notifications to avoid unnecessary writes
        if (fetchedNotifications.some(n => !n.isRead)) {
          await markUserNotificationsAsRead(user.uid);
          // The onSnapshot in auth-context will automatically update the unread count in the UI.
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <Card className="border-none shadow-none">
            <CardHeader className="py-4 px-4">
              <CardTitle className='text-lg'>Notifications</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : notifications.length > 0 ? (
                    <ScrollArea className="h-[320px]">
                        <div className='p-2 space-y-1'>
                        {notifications.map(notif => (
                            <Link 
                                key={notif.id} 
                                href={notif.link} 
                                className="block rounded-md hover:bg-muted/50 transition-colors p-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="flex items-start space-x-3">
                                    <Avatar className="h-8 w-8 border mt-1">
                                        <AvatarImage src={notif.fromUser.avatarUrl} alt={notif.fromUser.username} />
                                        <AvatarFallback><UserIcon className='h-4 w-4'/></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground whitespace-normal">
                                            <span className="font-semibold">{notif.fromUser.username}</span> {notif.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow((notif.createdAt as Timestamp).toDate(), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notif.isRead && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1"></div>
                                    )}
                                </div>
                            </Link>
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="p-8 text-center h-40 flex flex-col items-center justify-center">
                        <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
                        <h3 className="mt-2 text-base font-semibold">All caught up!</h3>
                        <p className='text-sm text-muted-foreground'>You have no new notifications.</p>
                    </div>
                )}
            </CardContent>
             <Separator />
            <CardFooter className="p-2">
                 <Button variant="link" size="sm" className="w-full" asChild>
                    <Link href="/notifications" onClick={() => setIsOpen(false)}>
                        View all notifications
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
