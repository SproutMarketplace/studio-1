
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
    name: "Ariocarpus F2 Fiss. x Lloydii ",
    description: "Beautiful Ariocarpus received from Big Cactus. Huge Root.",
    imageUrl: "/plant-images/ariocarpus.jpeg", 
    imageHint: "ariocarpus",
    type: "trade",
    seller: "GreenThumbSF",
    location: "Oakland, CA",
    tags: ["For Trade", "High Light"],
  },
  {
    id: "3",
    name: "Annie x Bert Variegated Trichocereus Hybrid",
    description: "Annie x Bert with one yellow pup and one green pup. Open to sale and trade!",
    imageUrl: "/plant-images/AnniexBert.jpeg", 
    imageHint: "AnniexBert Graft",
    price: 50,
    type: "sale_trade",
    seller: "IvyLeague",
    location: "Berkeley, CA",
    tags: ["For Sale", "For Trade", "Graft", "Beginner Friendly"],
  },
  {
    id: "4",
    name: "Ecuadorian Pachanoi",
    description: "Stunning Ecuadorian Pachanoi Stand Needs bright, direct light.",
    imageUrl: "/plant-images/pach.jpeg", 
    imageHint: "pach",
    price: 70,
    type: "sale",
    seller: "PachMan",
    location: "San Jose, CA",
    tags: ["For Sale", "Statement Plant", "Bright Light"],
  },
  {
    id: "5",
    name: "Bridgesii cv. Yehuda",
    description: "Rarely offereed Bridgesii with lots of girth. Get absolutely MASSIVE!",
    imageUrl: "/plant-images/yehuda.jpeg", 
    imageHint: "yehuda",
    type: "trade",
    seller: "SucculentKing",
    location: "Palo Alto, CA",
    tags: ["For Trade", "Trichocereus", "Cacti"],
  },
  {
    id: "6",
    name: "ZZ Plant",
    description: "Hardy ZZ Plant, perfect for beginners. Tolerates low light.",
    imageUrl: "/plant-images/zz.jpg", 
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
    imageUrl: "/plant-images/spiderplant.jpg", 
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
    imageUrl: "/plant-images/Calathea.jpg", 
    imageHint: "calathea plant",
    type: "trade",
    seller: "PrayerPlantsGalore",
    location: "Walnut Creek, CA",
    tags: ["For Trade", "Prayer Plant", "Humidity Lover"],
  },
];
