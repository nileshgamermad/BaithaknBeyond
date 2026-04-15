export const sections = [
  { id: "home", label: "Home" },
  { id: "stories", label: "Stories" },
  { id: "planner", label: "Planner" },
  { id: "map", label: "Map" },
  { id: "about", label: "About" },
  { id: "profile", label: "Profile" },
];

export const stories = [
  {
    id: "triveni-sangam",
    slug: "triveni-sangam.html",
    category: "history",
    categoryLabel: "Heritage Story",
    trending: true,
    editorsPick: true,
    isNew: false,
    title: "The Legends of Triveni Sangam",
    image:
      "https://dharmikbharatyatra.com/wp-content/uploads/2024/12/Boat-ride-in-prayagraj-1024x576.webp",
    alt: "Boats gathered near the riverbank",
    summary:
      "Walk through layered myths, pilgrim rituals, and living memory at Prayagraj's most sacred meeting point.",
    detail:
      "The Sangam is more than a landmark. It is a living stage for devotion, winter light, whispered legends, and the daily rhythm of the city beside the river.",
    excerpt:
      "A riverfront morning here feels ceremonial even before the rituals begin. Boats drift through the mist, chants travel softly over the water, and every visitor arrives carrying a different story.",
    location: "Triveni Sangam",
    readTime: "6 min read",
    accent: "",
    tags: ["heritage", "riverside", "spiritual", "sunrise"],
    mapEmbed: "https://www.google.com/maps?q=25.423,81.878&z=15&output=embed",
  },
  {
    id: "allahabad-fort",
    slug: "allahabad-fort.html",
    category: "history",
    categoryLabel: "Heritage Story",
    trending: true,
    editorsPick: false,
    isNew: false,
    title: "Inside Allahabad Fort",
    image: "https://www.optimatravels.com/images/allahabad-images/allahabad-fort-head.jpg",
    alt: "Historic fort architecture lit by sunlight",
    summary:
      "Discover Mughal grandeur, hidden courtyards, and the riverfront presence of one of the city's iconic landmarks.",
    detail:
      "Built under Akbar and layered by later eras, the fort still anchors conversations about empire, geography, and the spiritual pull of the confluence nearby.",
    excerpt:
      "The fort carries scale in a quiet way. Walls, gateways, and stone surfaces hold together memory, defense, and faith with surprising calm.",
    location: "Allahabad Fort",
    readTime: "5 min read",
    accent: "",
    tags: ["heritage", "mughal", "architecture", "history"],
    mapEmbed: "https://www.google.com/maps?q=25.429,81.867&z=16&output=embed",
  },
  {
    id: "netram-kachori",
    slug: "netram-kachori.html",
    category: "food",
    categoryLabel: "Food Story",
    trending: false,
    editorsPick: true,
    isNew: true,
    title: "The Legendary Netram Kachori",
    image:
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2f/c8/46/f9/caption.jpg?w=1000&h=1000&s=1",
    alt: "Fresh kachori served with curry",
    summary:
      "A crisp, comforting classic locals swear by, served with spiced sabzi and stories that begin long before breakfast.",
    detail:
      "Netram is part meal and part ritual. You arrive early, stand in line with everyone else, and leave with a plate that feels stitched into the city's everyday identity.",
    excerpt:
      "The first bite explains the queue. Hot kachori, soft sabzi, and the kind of confident seasoning that only comes from repetition over years.",
    location: "Loknath, Prayagraj",
    readTime: "4 min read",
    accent: "gold",
    tags: ["food", "breakfast", "street food", "local favourite"],
    mapEmbed: "https://www.google.com/maps?q=25.434,81.829&z=16&output=embed",
  },
  {
    id: "chowk-street-food",
    slug: "chowk-street-food.html",
    category: "food",
    categoryLabel: "Food Story",
    trending: false,
    editorsPick: false,
    isNew: true,
    title: "Street Food of Chowk",
    image:
      "https://www.thecitizen.in/h-upload/old_images/1500x900_155909-c4a62b6e399ac05a08d9e8e5bb402dc6.webp",
    alt: "Busy Indian street food lane with shops and crowds",
    summary:
      "From quick chaat stops to deep-fried favourites, Chowk remains a delicious map of everyday life in the old city.",
    detail:
      "Every lane offers a new rhythm, from evening snack circuits to old sweet shops. The best route is usually the one handed to you by someone local at the right moment.",
    excerpt:
      "Chowk is not a single stall. It is momentum. Smoke, spice, chatter, steel plates, and a crowd that somehow always knows where to stop next.",
    location: "Chowk, Prayagraj",
    readTime: "5 min read",
    accent: "gold",
    tags: ["food", "street food", "chaat", "evening"],
    mapEmbed: "https://www.google.com/maps?q=25.438,81.832&z=16&output=embed",
  },
];

export const plannerOptions = {
  mood: [
    { value: "calm", label: "Calm riverside" },
    { value: "heritage", label: "Heritage walk" },
    { value: "food", label: "Food trail" },
  ],
  time: [
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "evening", label: "Evening" },
  ],
};

export const plannerSuggestions = {
  "calm-morning": "Start at Triveni Sangam for a quiet boat ride, then move into an unhurried chai stop.",
  "calm-afternoon": "Take a slower riverside detour and linger in a shaded baithak before sunset plans.",
  "calm-evening": "Choose a sunset walk near the river and keep dinner light and local.",
  "heritage-morning": "Begin with Allahabad Fort and nearby heritage stops before the streets fill out.",
  "heritage-afternoon": "Spend the afternoon tracing layered architecture, shrines, and the old city edge.",
  "heritage-evening": "Pick an old-city stroll with architecture spotting and one classic sweet stop.",
  "food-morning": "Go straight to Netram for breakfast, then follow recommendations toward Loknath.",
  "food-afternoon": "Build a short tasting route with chaat, lassi, and one old-school dessert shop.",
  "food-evening": "Head to Chowk for the liveliest street-food circuit and stay flexible.",
};

export const categories = [
  {
    id: 'history',
    label: 'Heritage',
    description: 'Forts, temples, and timeless streets',
    image: 'https://www.optimatravels.com/images/allahabad-images/allahabad-fort-head.jpg',
  },
  {
    id: 'food',
    label: 'Food Trails',
    description: 'Breakfast classics, street food, and evening eats',
    image: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2f/c8/46/f9/caption.jpg?w=1000&h=1000&s=1',
  },
  {
    id: 'culture',
    label: 'Culture',
    description: 'Festivals, traditions, and everyday rituals',
    image: 'https://dharmikbharatyatra.com/wp-content/uploads/2024/12/Boat-ride-in-prayagraj-1024x576.webp',
  },
  {
    id: 'travel',
    label: 'Travel',
    description: 'Day trips, routes, and neighbourhood walks',
    image: 'https://www.thecitizen.in/h-upload/old_images/1500x900_155909-c4a62b6e399ac05a08d9e8e5bb402dc6.webp',
  },
];

export const mapStops = [
  {
    title: "Triveni Sangam",
    subtitle: "Best for sunrise boat rides and ritual riverside views",
    href: "https://www.google.com/maps/search/?api=1&query=25.423,81.878",
  },
  {
    title: "Allahabad Fort",
    subtitle: "Historic riverfront anchor near the Sangam zone",
    href: "https://www.google.com/maps/search/?api=1&query=25.429,81.867",
  },
  {
    title: "Loknath Market",
    subtitle: "Dense food lanes with breakfast legends and local bustle",
    href: "https://www.google.com/maps/search/?api=1&query=25.434,81.829",
  },
];
