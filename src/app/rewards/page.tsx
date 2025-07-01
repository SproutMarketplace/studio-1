
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getRewardTransactions } from "@/lib/firestoreService";
import type { RewardTransaction } from "@/models";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Sprout as SproutIcon, Leaf, Trees, Flower2, Gift, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const TIERS = [
  { name: 'Sproutling', minPoints: 0, Icon: SproutIcon },
  { name: 'Seedling', minPoints: 100, Icon: Leaf },
  { name: 'Grower', minPoints: 250, Icon: Trees },
  { name: 'Cultivator', minPoints: 500, Icon: Flower2 },
  { name: 'Botanist', minPoints: 1000, Icon: Award },
];

const getTierInfo = (points: number) => {
  let currentTier = TIERS[0];
  let nextTier = TIERS[1];

  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) {
      currentTier = TIERS[i];
      nextTier = TIERS[i + 1] || null; // null if it's the highest tier
      break;
    }
  }

  const pointsInCurrentTier = points - currentTier.minPoints;
  const pointsForNextTier = nextTier ? nextTier.minPoints - currentTier.minPoints : 0;
  const progress = nextTier ? Math.round((pointsInCurrentTier / pointsForNextTier) * 100) : 100;

  return { currentTier, nextTier, progress, pointsForNextTier };
};

export default function RewardsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      const fetchTransactions = async () => {
        setIsLoading(true);
        try {
          const fetchedTransactions = await getRewardTransactions(user.uid);
          setTransactions(fetchedTransactions);
        } catch (error) {
          console.error("Failed to fetch reward transactions:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTransactions();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-12">
        {authLoading ? <Loader2 className="h-12 w-12 animate-spin text-primary" /> : (
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>View Rewards</CardTitle>
              <CardDescription>Please log in to see your rewards progress.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild><Link href="/login">Login to View Rewards</Link></Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const points = profile?.rewardPoints || 0;
  const { currentTier, nextTier, progress } = getTierInfo(points);

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl flex items-center justify-center gap-3">
          <Award className="w-10 h-10" /> Your Rewards
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Earn points for being an active member of the Sprout community!
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl">Your Progress</CardTitle>
                        <div className="flex items-center gap-2 text-lg font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                            <currentTier.Icon className="w-5 h-5" />
                            <span>{currentTier.name}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center mb-4">
                        <p className="text-5xl font-bold text-primary">{points}</p>
                        <p className="text-muted-foreground">Total Points</p>
                    </div>
                    <Progress value={progress} className="h-4" />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>{currentTier.minPoints} pts</span>
                         {nextTier ? (
                            <span>Next level at {nextTier.minPoints} pts</span>
                        ) : (
                            <span>You've reached the highest level!</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A log of your points earned and spent.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : transactions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{format((tx.timestamp as Timestamp).toDate(), "MMM d, yyyy")}</TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell className={cn("text-right font-semibold", tx.type === 'earn' ? 'text-green-600' : 'text-destructive')}>
                                    {tx.type === 'earn' ? '+' : '-'}{tx.points}
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-primary"/> How to Earn Points</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center">
                        <PlusSquare className="w-8 h-8 mr-4 text-accent" />
                        <div>
                            <p className="font-semibold">List a Plant</p>
                            <p className="text-sm text-muted-foreground">+10 Points</p>
                        </div>
                    </div>
                     <div className="flex items-center">
                        <Leaf className="w-8 h-8 mr-4 text-accent" />
                        <div>
                            <p className="font-semibold">Complete a Trade/Sale</p>
                            <p className="text-sm text-muted-foreground">+25 Points</p>
                        </div>
                    </div>
                     <div className="flex items-center">
                        <Award className="w-8 h-8 mr-4 text-accent" />
                        <div>
                            <p className="font-semibold">Daily Login</p>
                            <p className="text-sm text-muted-foreground">+5 Points</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
