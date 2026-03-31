// ============================================================
//  DockLedger — Marina Database (25 Marinas)
//  Liveaboard-friendly marinas across the US
// ============================================================

const MARINAS = [
  {
    id: 1,
    name: "Harbor Island Marina",
    location: "San Diego, CA",
    lat: 32.7157,
    lng: -117.1611,
    price: 450,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Pool", "Pump-out", "Fuel Dock"],
    contact: "(619) 555-0123",
    website: "https://harborislandmarina.com"
  },
  {
    id: 2,
    name: "Sunset Bay Marina",
    location: "St. Petersburg, FL",
    lat: 27.7676,
    lng: -82.6403,
    price: 380,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Clubhouse", "Dockhand"],
    contact: "(727) 555-0145",
    website: "https://sunsetbaymarina.com"
  },
  {
    id: 3,
    name: "Coastal Harbor Marina",
    location: "Annapolis, MD",
    lat: 38.9784,
    lng: -76.4922,
    price: 520,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Restaurant", "Pump-out", "Pool"],
    contact: "(410) 555-0178",
    website: "https://coastalharbormarina.com"
  },
  {
    id: 4,
    name: "Gulf Breeze Marina",
    location: "Pensacola, FL",
    lat: 30.4410,
    lng: -87.2052,
    price: 340,
    liveaboard: true,
    amenities: ["WiFi", "Fuel Dock", "Pump-out", "Ship Store"],
    contact: "(850) 555-0199",
    website: "https://gulfbreezemarina.com"
  },
  {
    id: 5,
    name: "Bluewater Marina",
    location: "Key West, FL",
    lat: 24.5551,
    lng: -81.7800,
    price: 650,
    liveaboard: true,
    amenities: ["WiFi", "Pool", "Restaurant", "Laundry", "Tiki Bar"],
    contact: "(305) 555-0211",
    website: "https://bluewatermarina.com"
  },
  {
    id: 6,
    name: "Riviera Marina",
    location: "Fort Lauderdale, FL",
    lat: 26.1224,
    lng: -80.1373,
    price: 580,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Pool", "Gym", "Security"],
    contact: "(954) 555-0234",
    website: "https://rivieramarinafl.com"
  },
  {
    id: 7,
    name: "Lighthouse Point Marina",
    location: "Hampton, VA",
    lat: 37.0299,
    lng: -76.3452,
    price: 410,
    liveaboard: true,
    amenities: ["WiFi", "Pump-out", "Boat Launch", "Ship Store"],
    contact: "(757) 555-0256",
    website: "https://lighthousepointmarina.com"
  },
  {
    id: 8,
    name: "Marina del Rey Harbor",
    location: "Marina del Rey, CA",
    lat: 33.9802,
    lng: -118.4517,
    price: 480,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Pool", "Fuel Dock", "Restaurant"],
    contact: "(310) 555-0278",
    website: "https://marinadelreyharbor.com"
  },
  {
    id: 9,
    name: "Cedar Harbor Marina",
    location: "Seattle, WA",
    lat: 47.6062,
    lng: -122.3321,
    price: 550,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Heated Dock", "Pump-out"],
    contact: "(206) 555-0299",
    website: "https://cedarharbormarina.com"
  },
  {
    id: 10,
    name: "Seaside Marina",
    location: "Charleston, SC",
    lat: 32.7765,
    lng: -79.9311,
    price: 390,
    liveaboard: true,
    amenities: ["WiFi", "Pool", "Restaurant", "Ship Store"],
    contact: "(843) 555-0311",
    website: "https://seasidemarinasc.com"
  },
  {
    id: 11,
    name: "Bayview Marina",
    location: "San Francisco, CA",
    lat: 37.7749,
    lng: -122.4194,
    price: 620,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Security", "Fuel Dock"],
    contact: "(415) 555-0334",
    website: "https://bayviewmarinasf.com"
  },
  {
    id: 12,
    name: "Palm Beach Marina",
    location: "West Palm Beach, FL",
    lat: 26.7054,
    lng: -80.0533,
    price: 510,
    liveaboard: true,
    amenities: ["WiFi", "Pool", "Restaurant", "Tennis Court"],
    contact: "(561) 555-0356",
    website: "https://palmbeachmarina.com"
  },
  {
    id: 13,
    name: "Jacksonville Marina",
    location: "Jacksonville, FL",
    lat: 30.3322,
    lng: -81.6557,
    price: 360,
    liveaboard: true,
    amenities: ["WiFi", "Pump-out", "Boat Launch", "Ship Store"],
    contact: "(904) 555-0378",
    website: "https://jacksonvillemarina.com"
  },
  {
    id: 14,
    name: "Lake Cumberland Marina",
    location: "Russell Springs, KY",
    lat: 37.0528,
    lng: -84.8458,
    price: 280,
    liveaboard: true,
    amenities: ["WiFi", "Boat Launch", "Restaurant", "Swim Area"],
    contact: "(270) 555-0399",
    website: "https://lakecumberlandmarina.com"
  },
  {
    id: 15,
    name: "Gulfport Marina",
    location: "Gulfport, MS",
    lat: 30.3674,
    lng: -89.0928,
    price: 320,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Pool", "Fuel Dock"],
    contact: "(228) 555-0411",
    website: "https://gulfportmarinams.com"
  },
  {
    id: 16,
    name: "York River Yacht Haven",
    location: "Yorktown, VA",
    lat: 37.2554,
    lng: -76.5072,
    price: 440,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Pool", "Restaurant", "Ship Store"],
    contact: "(757) 555-0434",
    website: "https://yorkriveryachthaven.com"
  },
  {
    id: 17,
    name: "Brunswick Landing Marina",
    location: "Brunswick, GA",
    lat: 31.1499,
    lng: -81.4915,
    price: 380,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Pool", "Pump-out", "Fuel Dock"],
    contact: "(912) 555-0456",
    website: "https://brunswicklandingmarina.com"
  },
  {
    id: 18,
    name: "Islamorada Marina",
    location: "Islamorada, FL",
    lat: 24.9381,
    lng: -80.6178,
    price: 590,
    liveaboard: true,
    amenities: ["WiFi", "Pool", "Restaurant", "Diving Board"],
    contact: "(305) 555-0478",
    website: "https://islamoradamarina.com"
  },
  {
    id: 19,
    name: "Portland Harbor Marina",
    location: "Portland, OR",
    lat: 45.5152,
    lng: -122.6784,
    price: 490,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Heated Dock", "Pump-out"],
    contact: "(503) 555-0499",
    website: "https://portharbor.com"
  },
  {
    id: 20,
    name: "Sarasota Marina",
    location: "Sarasota, FL",
    lat: 27.3365,
    lng: -82.5307,
    price: 420,
    liveaboard: true,
    amenities: ["WiFi", "Pool", "Laundry", "Restaurant"],
    contact: "(941) 555-0521",
    website: "https://sarasotamarina.com"
  },
  {
    id: 21,
    name: "Oahu Harbor Marina",
    location: "Honolulu, HI",
    lat: 21.3069,
    lng: -157.8583,
    price: 680,
    liveaboard: true,
    amenities: ["WiFi", "Pool", "Security", "Fuel Dock", "Restaurant"],
    contact: "(808) 555-0543",
    website: "https://oahuharbormarina.com"
  },
  {
    id: 22,
    name: "Newport Bay Marina",
    location: "Newport Beach, CA",
    lat: 33.6189,
    lng: -117.9289,
    price: 720,
    liveaboard: true,
    amenities: ["WiFi", "Laundry", "Pool", "Gym", "Restaurant"],
    contact: "(949) 555-0565",
    website: "https://newportbaymarina.com"
  },
  {
    id: 23,
    name: "Intracoastal Marina",
    location: "Wilmington, NC",
    lat: 34.2257,
    lng: -77.9447,
    price: 370,
    liveaboard: true,
    amenities: ["WiFi", "Pump-out", "Ship Store", "Boat Launch"],
    contact: "(910) 555-0587",
    website: "https://intracomarina.com"
  },
  {
    id: 24,
    name: "Lake Texoma Marina",
    location: "Pottsboro, TX",
    lat: 33.7568,
    lng: -96.7697,
    price: 290,
    liveaboard: true,
    amenities: ["WiFi", "Restaurant", "Pool", "Boat Launch"],
    contact: "(903) 555-0609",
    website: "https://laketexomamarina.com"
  },
  {
    id: 25,
    name: "Moab Marina",
    location: "Moab, UT",
    lat: 38.5733,
    lng: -109.5498,
    price: 310,
    liveaboard: true,
    amenities: ["WiFi", "Ship Store", "Fuel Dock", "Pump-out"],
    contact: "(435) 555-0631",
    website: "https://moabmarina.com"
  }
];

// Expense categories
const EXPENSE_CATEGORIES = [
  "Dock/Fee",
  "Fuel",
  "Provisioning",
  "Maintenance",
  "Insurance",
  "Licensing/Permits",
  "Repairs",
  "Equipment",
  "Communication",
  "Healthcare",
  "Transportation",
  "Entertainment",
  "Other"
];

// Maintenance status options
const MAINTENANCE_STATUS = [
  "Pending",
  "In Progress",
  "Completed",
  "Needs Attention",
  "Scheduled"
];

// Maintenance categories
const MAINTENANCE_CATEGORIES = [
  "Engine",
  "Electrical",
  "Plumbing",
  "Hull",
  "Sails/Rigging",
  "Safety Equipment",
  "Electronics",
  "Sanitation",
  "Deck",
  "Interior",
  "Other"
];