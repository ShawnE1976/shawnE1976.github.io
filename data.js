// ============================================================
//  DockLedger — Marina Database
//  Marinas, anchorages, boatyards, and fuel docks
// ============================================================

const MARINAS = [

  // ── EAST COAST ────────────────────────────────────────────

  {
    id: 1,
    name: "Safe Harbor Marina — Annapolis",
    location: "Annapolis, MD",
    lat: 38.9784, lng: -76.4922,
    type: "full-service",
    region: "east-coast",
    liveaboard: true,
    slipRate: "$22/ft/month",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Laundry", "Showers", "Pump-out", "Ship Store", "Pool"],
    fuel: { gas: true, diesel: true },
    phone: "(410) 268-0129",
    description: "Full-service marina in the sailing capital of the US. Liveaboard-friendly with year-round slips. Walking distance to downtown Annapolis restaurants and chandleries.",
    rating: 4.5,
    reviews: 127
  },
  {
    id: 2,
    name: "Bahia Mar Marina",
    location: "Fort Lauderdale, FL",
    lat: 26.1003, lng: -80.1056,
    type: "full-service",
    region: "east-coast",
    liveaboard: true,
    slipRate: "$30/ft/month",
    amenities: ["Power (30/50/100A)", "Water", "Wi-Fi", "Laundry", "Showers", "Pump-out", "Restaurant", "Pool", "Fuel Dock"],
    fuel: { gas: true, diesel: true },
    phone: "(954) 764-2233",
    description: "Iconic Fort Lauderdale marina on the Intracoastal. Home to the Fort Lauderdale International Boat Show. Liveaboards welcome with full amenities.",
    rating: 4.3,
    reviews: 89
  },
  {
    id: 3,
    name: "Beaufort Town Docks",
    location: "Beaufort, NC",
    lat: 34.7182, lng: -76.6638,
    type: "full-service",
    region: "east-coast",
    liveaboard: true,
    slipRate: "$1.75/ft/day",
    amenities: ["Power (30/50A)", "Water", "Showers", "Laundry", "Pump-out", "Dinghy Dock"],
    fuel: { gas: false, diesel: false },
    phone: "(252) 728-2503",
    description: "Charming ICW stop in historic Beaufort. Popular with cruisers heading south. Free dinghy dock, walkable downtown. Great provisioning at nearby grocery stores.",
    rating: 4.6,
    reviews: 203
  },
  {
    id: 4,
    name: "Marathon Marina",
    location: "Marathon, FL (Keys)",
    lat: 24.7136, lng: -81.0937,
    type: "full-service",
    region: "east-coast",
    liveaboard: true,
    slipRate: "$25/ft/month",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Laundry", "Showers", "Pump-out", "Tiki Bar"],
    fuel: { gas: true, diesel: true },
    phone: "(305) 743-6575",
    description: "Mid-Keys full-service marina popular with liveaboards and cruisers. Protected harbor with easy access to both ocean and bay side fishing.",
    rating: 4.2,
    reviews: 76
  },
  {
    id: 5,
    name: "Charleston City Marina",
    location: "Charleston, SC",
    lat: 32.7791, lng: -79.9250,
    type: "full-service",
    region: "east-coast",
    liveaboard: false,
    slipRate: "$2.50/ft/day",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Showers", "Pump-out", "Restaurant"],
    fuel: { gas: true, diesel: true },
    phone: "(843) 723-5098",
    description: "Downtown Charleston waterfront location. Mega-yacht capable. Walking distance to historic district. Transient slips available.",
    rating: 4.4,
    reviews: 156
  },

  // ── WEST COAST ────────────────────────────────────────────

  {
    id: 6,
    name: "Emeryville Marina",
    location: "Emeryville, CA",
    lat: 37.8388, lng: -122.3144,
    type: "full-service",
    region: "west-coast",
    liveaboard: true,
    slipRate: "$12/ft/month",
    amenities: ["Power (30A)", "Water", "Laundry", "Showers", "Pump-out"],
    fuel: { gas: false, diesel: false },
    phone: "(510) 654-3716",
    description: "Affordable Bay Area marina with liveaboard permits. Great views of San Francisco skyline. Close to BART and shopping. Active liveaboard community.",
    rating: 4.0,
    reviews: 64
  },
  {
    id: 7,
    name: "Channel Islands Harbor Marina",
    location: "Oxnard, CA",
    lat: 34.1608, lng: -119.2262,
    type: "full-service",
    region: "west-coast",
    liveaboard: true,
    slipRate: "$14/ft/month",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Laundry", "Showers", "Pump-out", "Pool", "Fuel Dock"],
    fuel: { gas: true, diesel: true },
    phone: "(805) 985-6059",
    description: "Southern California marina with year-round mild weather. Liveaboard-friendly. Gateway to Channel Islands National Park. Full boatyard on site.",
    rating: 4.3,
    reviews: 91
  },
  {
    id: 8,
    name: "Shilshole Bay Marina",
    location: "Seattle, WA",
    lat: 47.6815, lng: -122.4040,
    type: "full-service",
    region: "west-coast",
    liveaboard: true,
    slipRate: "$15/ft/month",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Laundry", "Showers", "Pump-out", "Fuel Dock", "Haul-out"],
    fuel: { gas: true, diesel: true },
    phone: "(206) 787-3006",
    description: "Pacific Northwest's premier marina with 1,400 slips. Liveaboard community, views of the Olympic Mountains. Close to Ballard restaurants and breweries.",
    rating: 4.5,
    reviews: 178
  },
  {
    id: 9,
    name: "San Diego Shelter Island Marina",
    location: "San Diego, CA",
    lat: 32.7157, lng: -117.2290,
    type: "full-service",
    region: "west-coast",
    liveaboard: true,
    slipRate: "$18/ft/month",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Laundry", "Showers", "Pump-out", "Restaurant", "Pool"],
    fuel: { gas: true, diesel: true },
    phone: "(619) 222-0561",
    description: "Year-round perfect sailing weather. Active cruiser community, great jumping-off point for Mexico. Liveaboard-friendly with full amenities.",
    rating: 4.6,
    reviews: 214
  },

  // ── GULF COAST ────────────────────────────────────────────

  {
    id: 10,
    name: "Municipal Marina at Pensacola",
    location: "Pensacola, FL",
    lat: 30.4044, lng: -87.2108,
    type: "full-service",
    region: "gulf",
    liveaboard: true,
    slipRate: "$10/ft/month",
    amenities: ["Power (30/50A)", "Water", "Showers", "Laundry", "Pump-out"],
    fuel: { gas: false, diesel: false },
    phone: "(850) 436-5670",
    description: "Affordable Gulf Coast marina in historic Pensacola. Walking distance to downtown. Protected from weather. Popular with ICW cruisers and snowbirds.",
    rating: 4.1,
    reviews: 52
  },
  {
    id: 11,
    name: "Galveston Yacht Basin",
    location: "Galveston, TX",
    lat: 29.3087, lng: -94.7856,
    type: "full-service",
    region: "gulf",
    liveaboard: true,
    slipRate: "$9/ft/month",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Showers", "Laundry", "Pump-out", "Fuel Dock"],
    fuel: { gas: true, diesel: true },
    phone: "(409) 765-3737",
    description: "Texas Gulf Coast marina with deep-water access. Affordable liveaboard slips. Close to fishing grounds and Galveston's historic Strand district.",
    rating: 3.9,
    reviews: 45
  },
  {
    id: 12,
    name: "Dog River Marina",
    location: "Mobile, AL",
    lat: 30.6244, lng: -88.1101,
    type: "liveaboard",
    region: "gulf",
    liveaboard: true,
    slipRate: "$7/ft/month",
    amenities: ["Power (30A)", "Water", "Showers", "Laundry"],
    fuel: { gas: false, diesel: false },
    phone: "(251) 471-5449",
    description: "One of the most affordable liveaboard marinas in the US. Quiet Dog River location near Mobile Bay. Strong liveaboard community. Basic amenities.",
    rating: 3.8,
    reviews: 33
  },

  // ── GREAT LAKES ───────────────────────────────────────────

  {
    id: 13,
    name: "DuSable Harbor",
    location: "Chicago, IL",
    lat: 41.8699, lng: -87.6133,
    type: "full-service",
    region: "great-lakes",
    liveaboard: false,
    slipRate: "$150/ft/season",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Showers", "Pump-out", "Security"],
    fuel: { gas: false, diesel: false },
    phone: "(312) 742-3577",
    description: "Spectacular downtown Chicago location with skyline views. Seasonal slips (Apr–Nov). No liveaboard, but premium location for Great Lakes sailors.",
    rating: 4.4,
    reviews: 98
  },
  {
    id: 14,
    name: "Port Huron Municipal Marina",
    location: "Port Huron, MI",
    lat: 42.9747, lng: -82.4246,
    type: "full-service",
    region: "great-lakes",
    liveaboard: true,
    slipRate: "$10/ft/month",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Showers", "Laundry", "Pump-out"],
    fuel: { gas: true, diesel: true },
    phone: "(810) 984-9745",
    description: "Gateway to Lake Huron and the North Channel. Start of the annual Mackinac Race. Liveaboard-friendly during season. Excellent cruising grounds nearby.",
    rating: 4.2,
    reviews: 67
  },

  // ── CARIBBEAN ─────────────────────────────────────────────

  {
    id: 15,
    name: "Red Hook Marina",
    location: "St. Thomas, USVI",
    lat: 18.3358, lng: -64.8575,
    type: "full-service",
    region: "caribbean",
    liveaboard: true,
    slipRate: "$28/ft/month",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Showers", "Laundry", "Pump-out", "Fuel Dock", "Dinghy Dock"],
    fuel: { gas: true, diesel: true },
    phone: "(340) 775-6454",
    description: "USVI marina with easy access to BVI. Full-service with provisioning nearby. Hurricane hole options. Popular with Caribbean cruisers.",
    rating: 4.1,
    reviews: 82
  },
  {
    id: 16,
    name: "Puerto del Rey Marina",
    location: "Fajardo, Puerto Rico",
    lat: 18.2876, lng: -65.6311,
    type: "full-service",
    region: "caribbean",
    liveaboard: true,
    slipRate: "$20/ft/month",
    amenities: ["Power (30/50/100A)", "Water", "Wi-Fi", "Laundry", "Showers", "Pump-out", "Pool", "Restaurant", "Boatyard"],
    fuel: { gas: true, diesel: true },
    phone: "(787) 860-1000",
    description: "Largest marina in the Caribbean with 1,000+ slips. Full boatyard, haul-out to 150 tons. Hurricane rated. Liveaboard community. Great provisioning in nearby Fajardo.",
    rating: 4.5,
    reviews: 192
  },

  // ── ANCHORAGES ────────────────────────────────────────────

  {
    id: 17,
    name: "Boot Key Harbor Mooring Field",
    location: "Marathon, FL (Keys)",
    lat: 24.7080, lng: -81.1005,
    type: "anchorage",
    region: "east-coast",
    liveaboard: true,
    slipRate: "$16.16/day (mooring)",
    amenities: ["Dinghy Dock", "Showers", "Laundry", "Pump-out"],
    fuel: { gas: false, diesel: false },
    phone: "(305) 289-2274",
    description: "Legendary cruiser mooring field in the Florida Keys. Strong community of long-term liveaboards. City-operated with dinghy dock and shore facilities. Waitlist common in winter.",
    rating: 4.7,
    reviews: 312
  },
  {
    id: 18,
    name: "Dinner Key Mooring Field",
    location: "Coconut Grove, FL",
    lat: 25.7249, lng: -80.2379,
    type: "anchorage",
    region: "east-coast",
    liveaboard: true,
    slipRate: "$12/day (mooring)",
    amenities: ["Dinghy Dock", "Showers", "Pump-out"],
    fuel: { gas: false, diesel: false },
    phone: "(305) 329-4745",
    description: "Coconut Grove mooring field with access to Miami. Active sailing community. Walking distance to restaurants and stores. Popular with cruisers.",
    rating: 4.0,
    reviews: 145
  },
  {
    id: 19,
    name: "Richardson Bay Anchorage",
    location: "Sausalito, CA",
    lat: 37.8594, lng: -122.4830,
    type: "anchorage",
    region: "west-coast",
    liveaboard: true,
    slipRate: "Free (anchor)",
    amenities: ["Dinghy Dock (nearby)"],
    fuel: { gas: false, diesel: false },
    phone: "N/A",
    description: "Free anchorage in beautiful Richardson Bay with views of San Francisco. Limited to 72-hour stays (enforced variably). Active liveaboard community. Ferry access to SF.",
    rating: 3.7,
    reviews: 88
  },

  // ── BOATYARDS ─────────────────────────────────────────────

  {
    id: 20,
    name: "Lauderdale Marine Center",
    location: "Fort Lauderdale, FL",
    lat: 26.0924, lng: -80.1309,
    type: "boatyard",
    region: "east-coast",
    liveaboard: false,
    slipRate: "Haul-out: $16/ft",
    amenities: ["Haul-out (300 ton)", "Bottom Paint", "Fiberglass", "Rigging", "Electronics", "Canvas"],
    fuel: { gas: false, diesel: false },
    phone: "(954) 713-0300",
    description: "Full-service boatyard handling vessels up to 200ft. All trades on site. Popular with cruisers doing pre-departure refits. On the New River.",
    rating: 4.4,
    reviews: 134
  },
  {
    id: 21,
    name: "Deltaville Boatyard",
    location: "Deltaville, VA",
    lat: 37.5549, lng: -76.3299,
    type: "boatyard",
    region: "east-coast",
    liveaboard: false,
    slipRate: "Haul-out: $10/ft",
    amenities: ["Haul-out (75 ton)", "Bottom Paint", "Fiberglass", "Mechanical", "DIY Friendly"],
    fuel: { gas: false, diesel: false },
    phone: "(804) 776-8900",
    description: "Affordable Chesapeake Bay boatyard. DIY-friendly with reasonable rates. Popular with cruisers preparing for the ICW or offshore passages.",
    rating: 4.3,
    reviews: 78
  },

  // ── FUEL DOCKS ────────────────────────────────────────────

  {
    id: 22,
    name: "Riviera Beach Marina & Fuel",
    location: "Riviera Beach, FL",
    lat: 26.7765, lng: -80.0500,
    type: "fuel",
    region: "east-coast",
    liveaboard: false,
    slipRate: "Transient: $3/ft/day",
    amenities: ["Fuel Dock", "Pump-out", "Ice"],
    fuel: { gas: true, diesel: true },
    phone: "(561) 842-7806",
    description: "Convenient fuel stop near Lake Worth Inlet. Competitive fuel prices. Quick in-and-out for cruisers on the ICW. Diesel and gas available.",
    rating: 4.0,
    reviews: 56
  },
  {
    id: 23,
    name: "Harbortown Marina Fuel Dock",
    location: "Hilton Head, SC",
    lat: 32.1372, lng: -80.7516,
    type: "fuel",
    region: "east-coast",
    liveaboard: false,
    slipRate: "Transient: $3.50/ft/day",
    amenities: ["Fuel Dock", "Pump-out", "Ship Store", "Ice"],
    fuel: { gas: true, diesel: true },
    phone: "(843) 363-8335",
    description: "Hilton Head fuel dock and transient marina. Popular ICW stop with good facilities. Restaurant access and provisioning nearby.",
    rating: 4.2,
    reviews: 61
  },

  // ── MORE LIVEABOARD FAVORITES ─────────────────────────────

  {
    id: 24,
    name: "Regatta Pointe Marina",
    location: "Palmetto, FL",
    lat: 27.5217, lng: -82.5720,
    type: "full-service",
    region: "gulf",
    liveaboard: true,
    slipRate: "$15/ft/month",
    amenities: ["Power (30/50A)", "Water", "Wi-Fi", "Showers", "Laundry", "Pump-out", "Pool", "Fuel Dock"],
    fuel: { gas: true, diesel: true },
    phone: "(941) 729-0500",
    description: "Tampa Bay area marina on the Manatee River. Liveaboard-friendly with resort-style amenities. Close to cruising grounds and Gulf beaches.",
    rating: 4.4,
    reviews: 103
  },
  {
    id: 25,
    name: "Oriental Town Dock",
    location: "Oriental, NC",
    lat: 35.0274, lng: -76.6908,
    type: "liveaboard",
    region: "east-coast",
    liveaboard: true,
    slipRate: "$1.50/ft/day",
    amenities: ["Power (30A)", "Water", "Showers", "Pump-out", "Dinghy Dock"],
    fuel: { gas: false, diesel: false },
    phone: "(252) 249-0556",
    description: "The 'Sailing Capital of North Carolina.' Small-town charm with a strong cruising community. ICW waypoint. Free anchoring in the Neuse River nearby.",
    rating: 4.5,
    reviews: 167
  }
];

// Category display info
const CATEGORY_INFO = {
  slip:          { label: 'Slip & Dock',       icon: '⚓', color: '#4fc3f7' },
  maintenance:   { label: 'Maintenance',        icon: '🔧', color: '#f59e0b' },
  rigging:       { label: 'Rigging',            icon: '⛵', color: '#ef4444' },
  provisioning:  { label: 'Provisioning',       icon: '🛒', color: '#22c55e' },
  fuel:          { label: 'Fuel',               icon: '⛽', color: '#fb923c' },
  insurance:     { label: 'Insurance',          icon: '🛡️', color: '#a78bfa' },
  electronics:   { label: 'Electronics',        icon: '📡', color: '#38bdf8' },
  safety:        { label: 'Safety Equipment',   icon: '🧯', color: '#f43f5e' },
  other:         { label: 'Other',              icon: '📋', color: '#94a3b8' }
};

const MAINT_CATEGORY_INFO = {
  engine:     { label: 'Engine',           icon: '⚙️' },
  hull:       { label: 'Hull & Bottom',    icon: '🚢' },
  rigging:    { label: 'Rigging & Sails',  icon: '⛵' },
  electrical: { label: 'Electrical',       icon: '⚡' },
  plumbing:   { label: 'Plumbing',         icon: '🔧' },
  safety:     { label: 'Safety Equipment', icon: '🧯' },
  cosmetic:   { label: 'Cosmetic',         icon: '🎨' },
  other:      { label: 'Other',            icon: '📋' }
};
