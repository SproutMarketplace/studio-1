
"use client";

import { useState } from "react";
import { MessagesSquare, Search, Users, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

// Mock data for communities - replace with Firestore data later
const mockCommunities = [
  { id: "1", name: "Cactus Collectors", description: "A community for lovers of all things spiky.", members: 125, imageUrl: "https://placehold.co/600x400.png", imageHint: "cactus desert" },
  { id: "2", name: "Houseplant Heroes", description: "Share your indoor jungles and get care tips.", members: 340, imageUrl: "https://placehold.co/600x400.png", imageHint: "houseplants indoor" },
  { id: "3", name: "Rare Plant Traders", description: "For those hunting and trading unique specimens.", members: 88, imageUrl: "https://placehold.co/600x400.png", imageHint: "rare plant" },
  { id: "4", name: "Bonsai Beginners", description: "Learn the art of bonsai with fellow novices.", members: 55, imageUrl: "https://placehold.co/600x400.png", imageHint: "bonsai tree" },
];

export default function CommunityForumsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleJoinCommunity = (communityName: string) => {
    // Placeholder for actual join logic
    toast({
      title: "Joined Community (Simulated)",
      description: `You've joined the ${communityName} community! (This is a simulation)`,
    });
  };
  
  const handleCreateCommunity = () => {
     toast({
      title: "Create Community (Coming Soon)",
      description: "Functionality to create new communities will be added soon!",
    });
  }

  const filteredCommunities = mockCommunities.filter(community =>
    community.name.toLowerCase().includes(searchTerm) ||
    community.description.toLowerCase().includes(searchTerm)
  );

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full shadow-xl mb-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
            <MessagesSquare className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Community Forums</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Find, join, and participate in plant-loving communities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for communities..."
                className="w-full rounded-lg bg-background pl-10 pr-4 py-2 text-base"
                onChange={handleSearchChange}
                value={searchTerm}
              />
            </div>
            <Button onClick={handleCreateCommunity} className="text-base py-2 h-auto shrink-0">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Community
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <Card key={community.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl group">
              {/* Optional: Add community image here */}
              {/* <div className="relative w-full h-32 bg-muted">
                <Image src={community.imageUrl} alt={community.name} layout="fill" objectFit="cover" data-ai-hint={community.imageHint} />
              </div> */}
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {/* <Link href={`/forums/${community.id}`}> */}
                    {community.name}
                  {/* </Link> */}
                </CardTitle>
                 <Badge variant="outline" className="w-fit">
                    <Users className="mr-1.5 h-3.5 w-3.5"/> {community.members} Members
                 </Badge>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                  {community.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                {/* <Link href={`/forums/${community.id}`} className="w-full"> */}
                  <Button variant="outline" className="w-full" onClick={() => handleJoinCommunity(community.name)}>
                    View Community
                  </Button>
                {/* </Link> */}
                 {/* <Button className="w-full" onClick={() => handleJoinCommunity(community.name)}>
                    Join Community
                 </Button> */}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Search className="w-16 h-16 mb-4 text-muted-foreground" />
            <p className="text-xl font-semibold text-foreground">No Communities Found</p>
            <p className="text-muted-foreground">
              Try a different search term, or create a new community!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
