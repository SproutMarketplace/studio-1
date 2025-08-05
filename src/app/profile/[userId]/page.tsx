
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserPlantListings, getWishlistPlants, uploadProfileImage, updateUserData, getUserProfile, followUser, unfollowUser, getOrdersForBuyer, getOrdersForSeller } from "@/lib/firestoreService";
import type { PlantListing, User, Order, OrderItem } from "@/models";
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User as UserIcon, Calendar, Leaf, Heart, Settings, Camera, LayoutDashboard, UserPlus, UserCheck, ClipboardList, Inbox, Package, ArrowRight, Truck, CircleDollarSign, Gem, CheckCircle2 } from "lucide-react";
import { PlantCard } from "@/components/plant-card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EditProfileForm } from "@/components/edit-profile-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { CreateLabelDialog } from "@/components/create-label-dialog";

const SELLER_FEE_PERCENTAGE = 0.065; // 6.5%

const StatCard = ({ title, value, icon: Icon, isCurrency = false, loading }: { title: string, value: number, icon: React.ElementType, isCurrency?: boolean, loading: boolean}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                {title}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
                <div className="text-2xl font-bold">
                    {isCurrency ? `$${value.toFixed(2)}` : value}
                </div>
            )}
        </CardContent>
    </Card>
);

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const { user: loggedInUser, profile: loggedInUserProfile, loading: authLoading, updateUserProfileInContext } = useAuth();
  const { toast } = useToast();
  
  const [viewedProfile, setViewedProfile] = useState<User | null>(null);
  const [userPlants, setUserPlants] = useState<PlantListing[]>([]);
  const [wishlistPlants, setWishlistPlants] = useState<PlantListing[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  
  const [totalQuantitySold, setTotalQuantitySold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [pageLoading, setPageLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [sellerOrdersLoading, setSellerOrdersLoading] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = loggedInUser?.uid === userId;
  const isFollowing = loggedInUserProfile?.following?.includes(userId);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Use loggedInUserProfile if viewing own profile, otherwise fetch
    const profileToUse = isOwner ? loggedInUserProfile : null;

    const fetchPageData = async () => {
        setPageLoading(true);
        try {
            const profileData = profileToUse || await getUserProfile(userId);
            if (!profileData) {
                router.push('/marketplace');
                toast({ variant: 'destructive', title: 'User not found' });
                return;
            }
            setViewedProfile(profileData);
            
            setListingsLoading(true);
            const plants = await getUserPlantListings(userId);
            setUserPlants(plants);
            setListingsLoading(false);
            
            // If the viewer is the owner, fetch all their specific data
            if (loggedInUser?.uid === userId) {
                setWishlistLoading(true);
                setOrdersLoading(true);
                setSellerOrdersLoading(true);

                const [wishlist, buyerOrders, sellerSales] = await Promise.all([
                    getWishlistPlants(userId),
                    getOrdersForBuyer(userId),
                    getOrdersForSeller(userId)
                ]);

                setWishlistPlants(wishlist);
                setOrderHistory(buyerOrders);
                setSellerOrders(sellerSales);
                
                const itemsSold = sellerSales.flatMap(o => o.items)
                                     .filter(item => item.sellerId === loggedInUser.uid);
                
                const totalSold = itemsSold.reduce((acc, item) => acc + item.quantity, 0);
                setTotalQuantitySold(totalSold);
                
                const grossRevenue = itemsSold.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                const fee = profileData.subscriptionTier === 'elite' ? 0 : SELLER_FEE_PERCENTAGE;
                const netRevenue = grossRevenue * (1 - fee);
                setTotalRevenue(netRevenue);

                setWishlistLoading(false);
                setOrdersLoading(false);
                setSellerOrdersLoading(false);
            }

        } catch (error) {
            console.error("Failed to fetch user profile data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load profile.' });
        } finally {
            setPageLoading(false);
        }
    };

    if (isOwner) {
        // If it's the owner, we can react to changes in their profile from the context
        setViewedProfile(loggedInUserProfile);
        if (loggedInUserProfile) { // only fetch rest if profile is loaded
             fetchPageData();
        }
    } else {
        fetchPageData();
    }
  }, [userId, loggedInUser?.uid, loggedInUserProfile, isOwner, toast, router]);


  const handleAvatarClick = () => {
    if (isOwner && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !loggedInUser || !isOwner) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Image too large",
        description: "Please upload an image smaller than 2MB.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const newAvatarUrl = await uploadProfileImage(loggedInUser.uid, file);
      await updateUserData(loggedInUser.uid, { avatarUrl: newAvatarUrl });
      updateUserProfileInContext({ avatarUrl: newAvatarUrl });

      toast({
        title: "Profile picture updated!",
        description: "Your new picture is now live.",
      });
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "There was an error updating your profile picture.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!loggedInUser || !loggedInUserProfile || !userId || isOwner) {
        toast({ variant: "destructive", title: "Action not allowed." });
        return;
    }

    setIsFollowLoading(true);
    try {
        if (isFollowing) {
            await unfollowUser(loggedInUser.uid, userId);
            toast({ title: "Unfollowed", description: `You are no longer following ${viewedProfile?.username}.` });
        } else {
            await followUser(loggedInUser.uid, userId);
            toast({ title: "Followed!", description: `You are now following ${viewedProfile?.username}.` });
        }
    } catch (error) {
        console.error("Follow/unfollow error:", error);
        toast({ variant: "destructive", title: "Something went wrong", description: "Could not update follow status." });
    } finally {
        setIsFollowLoading(false);
    }
  };
  
  const handleStripeConnect = async () => {
    if (!loggedInUser) return;
    setIsConnectingStripe(true);
    try {
        const response = await fetch('/api/stripe/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: loggedInUser.uid }),
        });

        if (!response.ok) {
            const { error } = await response.json();
            throw new Error(error || 'Failed to create Stripe connection link.');
        }

        const { url } = await response.json();
        window.location.href = url;
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Stripe Connection Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
        setIsConnectingStripe(false);
    }
  };

  const handleOpenLabelDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsLabelDialogOpen(true);
  };


  if (authLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!viewedProfile) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This profile could not be found.</p>
            <Button asChild className="mt-4"><Link href="/marketplace">Go to Marketplace</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const renderStripeConnectCard = () => {
    let title = "Manage Payouts";
    let description = "Connect your bank account to receive funds.";
    let buttonText = "Connect Stripe to Get Paid";
    let buttonIcon = <ArrowRight className="mr-2 h-4 w-4" />;
    
    if (authLoading) {
        return <Card><CardContent className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>;
    }
    
    if (loggedInUserProfile?.stripeDetailsSubmitted) {
        description = "Your account is connected and ready to receive payouts.";
        buttonText = "Manage Payouts on Stripe";
    } else if (loggedInUserProfile?.stripeAccountId) {
        description = "Finish setting up your Stripe account to get paid.";
        buttonText = "Continue Onboarding";
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleStripeConnect} disabled={isConnectingStripe} className="w-full">
                {isConnectingStripe ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : buttonIcon}
                {buttonText}
            </Button>
        </CardContent>
      </Card>
    );
  }

  const joinedDate = viewedProfile.joinedDate ? format((viewedProfile.joinedDate as Timestamp).toDate(), 'MMMM yyyy') : 'N/A';

  const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
        case 'processing': return 'default';
        case 'shipped': return 'secondary';
        case 'delivered': return 'secondary';
        case 'cancelled': return 'destructive';
        default: return 'default';
    }
  };
  
  const renderOrderItemsForSeller = (items: OrderItem[]) => {
    const sellerItems = items.filter(item => item.sellerId === loggedInUser?.uid);

    return (
        <div className="space-y-2">
            {sellerItems.map(item => (
                <div key={item.plantId} className="flex items-center gap-2 text-sm">
                    <Link href={`/plant/${item.plantId}`} className="flex items-center gap-2 text-sm group">
                        <Image
                            src={item.imageUrl || "https://placehold.co/40x40.png"}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="rounded-md aspect-square object-cover"
                        />
                        <div>
                            <span className="font-medium group-hover:underline">{item.name}</span>
                            <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    );
  };
  
  const subscriptionTier = loggedInUserProfile?.subscriptionTier;
  const isProOrElite = subscriptionTier === 'pro' || subscriptionTier === 'elite';

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-lg">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar
              className={cn("h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/20", isOwner && "cursor-pointer")}
              onClick={handleAvatarClick}
            >
              <AvatarImage src={viewedProfile.avatarUrl} alt={viewedProfile.username} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                <UserIcon className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <div
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <div className="text-center">
                    <Camera className="w-8 h-8 mx-auto" />
                    <span className="text-xs font-semibold">Change</span>
                  </div>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
              disabled={isUploading || !isOwner}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-primary">{viewedProfile.username}</h1>
            <p className="text-muted-foreground">{viewedProfile.email}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 justify-center sm:justify-start">
              <Calendar className="h-4 w-4" />
              <span>Joined {joinedDate}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                    <span className="font-bold text-foreground">{viewedProfile.following?.length || 0}</span> Following
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-bold text-foreground">{viewedProfile.followers?.length || 0}</span> Followers
                </div>
            </div>
            {viewedProfile.bio && <p className="mt-2 text-sm">{viewedProfile.bio}</p>}
          </div>

          {!isOwner && loggedInUser && (
            <div className="w-full sm:w-auto">
              <Button 
                  variant={isFollowing ? "secondary" : "outline"} 
                  className="w-full sm:w-auto"
                  onClick={handleFollowToggle}
                  disabled={authLoading || isFollowLoading}
              >
                  {isFollowLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                      <UserCheck className="mr-2 h-4 w-4" />
                  ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className={cn("grid w-full", isOwner ? "grid-cols-2 md:grid-cols-5" : "grid-cols-1")}>
          <TabsTrigger value="listings"><Leaf className="mr-2 h-4 w-4" />My Listings</TabsTrigger>
          {isOwner && <TabsTrigger value="wishlist"><Heart className="mr-2 h-4 w-4" />Wishlist</TabsTrigger>}
          {isOwner && <TabsTrigger value="order-history"><ClipboardList className="mr-2 h-4 w-4" />Order History</TabsTrigger>}
          {isOwner && <TabsTrigger value="seller-dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Seller Tools</TabsTrigger>}
          {isOwner && <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Edit Profile</TabsTrigger>}
        </TabsList>
        <TabsContent value="listings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{isOwner ? "My Item Listings" : `${viewedProfile.username}'s Listings`}</CardTitle>
              <CardDescription>{isOwner ? "The items you have listed for sale or trade." : `Items listed by ${viewedProfile.username}.`}</CardDescription>
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : userPlants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPlants.map(plant => (
                    <PlantCard key={plant.id} plant={plant} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold">{isOwner ? "You haven't listed any items yet." : "This user hasn't listed any items yet."}</h3>
                  {isOwner && <Button asChild className="mt-4"><Link href="/list-plant">List an Item</Link></Button>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {isOwner && (
            <>
                <TabsContent value="wishlist" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Wishlist</CardTitle>
                            <CardDescription>The items you've saved for future consideration.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        {wishlistLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                        ) : wishlistPlants.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {wishlistPlants.map(plant => (
                            <PlantCard key={plant.id} plant={plant} />
                            ))}
                        </div>
                        ) : (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-semibold">Your wishlist is empty.</h3>
                            <p className="text-muted-foreground mt-2">Browse the marketplace to find items to add.</p>
                            <Button asChild className="mt-4">
                            <Link href="/marketplace">Find Items</Link>
                            </Button>
                        </div>
                        )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="order-history" className="mt-6">
                  <Card>
                    <CardHeader>
                        <CardTitle>My Order History</CardTitle>
                        <CardDescription>A record of all your past purchases on Sprout.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ordersLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : orderHistory.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order Date</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderHistory.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>{format((order.createdAt as Timestamp).toDate(), "MMM d, yyyy")}</TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    {order.items.map(item => (
                                                        <div key={item.plantId} className="flex items-center gap-2 text-sm">
                                                            <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-md object-cover"/>
                                                            <div>
                                                                <p className="font-medium">{item.name}</p>
                                                                <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">${order.totalAmount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <Inbox className="w-16 h-16 mx-auto text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-semibold">No orders yet</h3>
                                <p className="mt-1 text-muted-foreground">When you purchase an item, your order will appear here.</p>
                                <Button asChild className="mt-4"><Link href="/marketplace">Browse Items</Link></Button>
                            </div>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="settings" className="mt-6">
                    <EditProfileForm />
                </TabsContent>
                <TabsContent value="seller-dashboard" className="mt-6">
                    <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            <StatCard 
                                title="Total Net Revenue"
                                value={totalRevenue}
                                icon={CircleDollarSign}
                                isCurrency
                                loading={sellerOrdersLoading}
                            />
                            <StatCard 
                                title="Total Items Sold" 
                                value={totalQuantitySold}
                                icon={Package}
                                loading={sellerOrdersLoading}
                            />
                            {renderStripeConnectCard()}
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4">Recent Sales</h3>
                            <Card>
                                <CardContent className="p-0">
                                    {sellerOrdersLoading ? (
                                        <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                    ) : sellerOrders.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Items Sold</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sellerOrders.slice(0, 5).map((order) => (
                                                    <TableRow key={order.id}>
                                                        <TableCell className="text-xs">{format((order.createdAt as Timestamp).toDate(), "MMM d, yyyy")}</TableCell>
                                                        <TableCell>{renderOrderItemsForSeller(order.items)}</TableCell>
                                                        <TableCell><Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge></TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="outline" size="sm" onClick={() => handleOpenLabelDialog(order)}>
                                                                <Truck className="mr-2 h-4 w-4" /> Create Label
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <p>Your recent sales will appear here.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="pt-4 flex justify-center">
                            <div className="w-full md:w-1/3">
                                {isProOrElite ? (
                                    <Button asChild className="w-full">
                                        <Link href="/seller/dashboard">
                                            <LayoutDashboard className="mr-2 h-4 w-4"/>
                                            Go to Seller Dashboard
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button asChild variant="upgrade" className="w-full">
                                        <Link href="/subscription">
                                            <Gem className="mr-2 h-4 w-4"/>
                                            Upgrade to Pro for Full Dashboard
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </>
        )}
      </Tabs>

       <CreateLabelDialog
            order={selectedOrder}
            isOpen={isLabelDialogOpen}
            onOpenChange={setIsLabelDialogOpen}
        />
    </div>
  );
}
