
export interface Plant {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  price?: number;
  type: "sale" | "trade" | "sale_trade";
  seller: string;
  location: string;
  tags?: string[];
}

export const mockPlants: Plant[] = [
  {
    id: "1",
    name: "Monstera Deliciosa",
    description: "Large, healthy Monstera with beautiful fenestrations. Easy to care for.",
    imageUrl: "/plant-images/monstera.jpg", // Corrected path
    imageHint: "monstera plant",
    price: 45,
    type: "sale",
    seller: "PlantLover123",
    location: "San Francisco, CA",
    tags: ["For Sale", "Easy Care", "Popular"],
  },
  {
    id: "2",
    name: "Snake Plant (Sansevieria)",
    description: "Tall and vibrant Snake Plant. Great for air purification. Low maintenance.",
    imageUrl: "/images/plants/snake-plant.png", 
    imageHint: "snake plant",
    type: "trade",
    seller: "GreenThumbSF",
    location: "Oakland, CA",
    tags: ["For Trade", "Air Purifying", "Low Light"],
  },
  {
    id: "3",
    name: "Pothos Collection",
    description: "Various Pothos cuttings: Golden, Marble Queen, Neon. Willing to sell or trade.",
    imageUrl: "/images/plants/pothos-collection.png", 
    imageHint: "pothos cuttings",
    price: 5,
    type: "sale_trade",
    seller: "IvyLeague",
    location: "Berkeley, CA",
    tags: ["For Sale", "For Trade", "Cuttings", "Beginner Friendly"],
  },
  {
    id: "4",
    name: "Fiddle Leaf Fig",
    description: "Stunning Fiddle Leaf Fig, about 3ft tall. Needs bright, indirect light.",
    imageUrl: "/images/plants/fiddle-leaf-fig.png", 
    imageHint: "fiddle leaf",
    price: 70,
    type: "sale",
    seller: "FiggySmalls",
    location: "San Jose, CA",
    tags: ["For Sale", "Statement Plant", "Bright Light"],
  },
  {
    id: "5",
    name: "String of Pearls",
    description: "Delicate String of Pearls succulent in a hanging pot. Thrives in bright light.",
    imageUrl: "/images/plants/string-of-pearls.png", 
    imageHint: "string pearls",
    type: "trade",
    seller: "SucculentQueen",
    location: "Palo Alto, CA",
    tags: ["For Trade", "Succulent", "Hanging Plant"],
  },
  {
    id: "6",
    name: "ZZ Plant",
    description: "Hardy ZZ Plant, perfect for beginners. Tolerates low light.",
    imageUrl: "/images/plants/zz-plant.png", 
    imageHint: "zz plant",
    price: 30,
    type: "sale",
    seller: "EasyGreens",
    location: "Fremont, CA",
    tags: ["For Sale", "Drought Tolerant", "Low Maintenance"],
  },
  {
    id: "7",
    name: "Spider Plant",
    description: "Classic Spider Plant with many plantlets. Easy to propagate.",
    imageUrl: "/images/plants/spider-plant.png", 
    imageHint: "spider plant",
    price: 15,
    type: "sale_trade",
    seller: "WebOfPlants",
    location: "Daly City, CA",
    tags: ["For Sale", "For Trade", "Easy to Propagate", "Pet Friendly"],
  },
  {
    id: "8",
    name: "Calathea Orbifolia",
    description: "Beautiful Calathea Orbifolia with large, striped leaves. Loves humidity.",
    imageUrl: "/images/plants/calathea-orbifolia.png", 
    imageHint: "calathea plant",
    type: "trade",
    seller: "PrayerPlantsGalore",
    location: "Walnut Creek, CA",
    tags: ["For Trade", "Prayer Plant", "Humidity Lover"],
  },
];
