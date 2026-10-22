import type { Catalog } from "../src/shared";

export const sample: Catalog = {
  demo: true,
  ordersOpen: false,
  currency: "PKR",
  site: {
    heroTitle: "Furniture for\nthe way you live.",
    heroText:
      "Distinctive tables, considered seating, and furniture that makes a room your own.",
    heroImage: "/furniture-hero-v2.webp",
    logo: "/logo.jpeg",
    instagram: "https://www.instagram.com/lakkar.home/",
    announcement: "Furniture with character.",
    collectionTitle: "Find your next favourite piece.",
    collectionText:
      "Explore furniture for living rooms, bedrooms, and the spaces in between.",
    storyTitle: "A room comes together, piece by piece.",
    storyText:
      "A coffee table to gather around. A chair for your quiet corner. A bed to come home to. Discover furniture that brings comfort and character to your space.",
    storyImage: "/furniture-story-v2.webp",
    tagline: "Furniture for a home that feels like you.",
  },
  whatsapp: "",
  policies: {
    delivery:
      "Delivery availability and charges are shown at checkout. Contact the store for an estimated arrival date.",
    returns:
      "The store’s return and exchange policy will be available before orders open.",
    privacy:
      "Ordering is currently closed. Before launch, the store will publish how order contact details are used and retained.",
  },
  zones: [
    { id: "karachi", name: "Karachi (sample)", city: "Karachi", fee: 250 },
    { id: "lahore", name: "Lahore (sample)", city: "Lahore", fee: 350 },
    {
      id: "islamabad",
      name: "Islamabad (sample)",
      city: "Islamabad",
      fee: 350,
    },
  ],
  products: [
    {
      id: "tray",
      name: "The everyday tray",
      category: "Serveware",
      price: 3200,
      stock: 8,
      image:
        "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1000&q=85",
      description:
        "A simple wooden tray for the things you reach for every day. Sample product; final materials and finish to be confirmed.",
      dimensions: "Sample: 35 × 25 cm",
      care: "Wipe clean with a soft, slightly damp cloth. Do not soak.",
    },

    {
      id: "bowl",
      name: "A bowl for gathering",
      category: "Serveware",
      price: 2400,
      stock: 6,
      image: "https://images.unsplash.com/photo-151 otherwise",
      description:
        "A sculptural accent for your table. Sample product; food-contact suitability to be confirmed.",
      dimensions: "Sample: 22 cm diameter",
      care: "Wipe clean. Keep away from standing water.",
    },

    {
      id: "vase",
      name: "The quiet corner vase",
      category: "Decor",
      price: 2800,
      stock: 5,
      image:
        "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1000&q=85",
      description:
        "An understated shape for a shelf, a sideboard, a little corner of home. Sample product.",
      dimensions: "Sample: 20 cm high",
      care: "For dry stems only. Dust with a soft cloth.",
    },

    {
      id: "board",
      name: "The hosting board",
      category: "Serveware",
      price: 3800,
      stock: 4,
      image:
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1000&q=85",
      description:
        "Bring a natural texture to your next gathering. Sample product; final specifications to be confirmed.",
      dimensions: "Sample: 40 × 20 cm",
      care: "Wipe clean and dry immediately.",
    },
  ],
};

sample.products.forEach((p) => (p.image = "/" + p.id + ".webp"));
