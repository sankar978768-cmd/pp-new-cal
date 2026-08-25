import { Bird, Nakshatra, City } from './types';

export const BIRDS: Record<string, Bird> = {
  vulture: { key: 'vulture', name: "Vulture", tamil: "வல்லூறு", sanskrit: "Bherunda", icon: "🦅", element: "Fire" },
  owl: { key: 'owl', name: "Owl", tamil: "ஆந்தை", sanskrit: "Pingala", icon: "🦉", element: "Water" },
  crow: { key: 'crow', name: "Crow", tamil: "காகம்", sanskrit: "Kaka", icon: "🐦‍⬛", element: "Earth" },
  cock: { key: 'cock', name: "Cock", tamil: "சேவல்", sanskrit: "Kukkuta", icon: "🐓", element: "Air" },
  peacock: { key: 'peacock', name: "Peacock", tamil: "மயில்", sanskrit: "Mayura", icon: "🦚", element: "Ether" }
};

export const NAKSHATRAS: Nakshatra[] = [
  { id: 1, name: "Aswini", tamil: "அஸ்வினி", rasiIds: [1] },
  { id: 2, name: "Bharani", tamil: "பரணி", rasiIds: [1] },
  { id: 3, name: "Karthigai", tamil: "கார்த்திகை", rasiIds: [1, 2] },
  { id: 4, name: "Rohini", tamil: "ரோகிணி", rasiIds: [2] },
  { id: 5, name: "Mrigasirisham", tamil: "மிருகசீரிஷம்", rasiIds: [2, 3] },
  { id: 6, name: "Thiruvathirai", tamil: "திருவாதிரை", rasiIds: [3] },
  { id: 7, name: "Punarpusam", tamil: "புனர்பூசம்", rasiIds: [3, 4] },
  { id: 8, name: "Poosam", tamil: "பூசம்", rasiIds: [4] },
  { id: 9, name: "Ayilyam", tamil: "ஆயில்யம்", rasiIds: [4] },
  { id: 10, name: "Makam", tamil: "மகம்", rasiIds: [5] },
  { id: 11, name: "Pooram", tamil: "பூரம்", rasiIds: [5] },
  { id: 12, name: "Uthiram", tamil: "உத்திரம்", rasiIds: [5, 6] },
  { id: 13, name: "Hastham", tamil: "ஹஸ்தம் (அஸ்தம்)", rasiIds: [6] },
  { id: 14, name: "Chithirai", tamil: "சித்திரை", rasiIds: [6, 7] },
  { id: 15, name: "Swathi", tamil: "சுவாதி", rasiIds: [7] },
  { id: 16, name: "Visakam", tamil: "விசாகம்", rasiIds: [7, 8] },
  { id: 17, name: "Anusham", tamil: "அனுஷம்", rasiIds: [8] },
  { id: 18, name: "Kettai", tamil: "கேட்டை", rasiIds: [8] },
  { id: 19, name: "Moolam", tamil: "மூலம்", rasiIds: [9] },
  { id: 20, name: "Pooradam", tamil: "பூராடம்", rasiIds: [9] },
  { id: 21, name: "Uthiradam", tamil: "உத்திராடம்", rasiIds: [9, 10] },
  { id: 22, name: "Thiruvonam", tamil: "திருவோணம்", rasiIds: [10] },
  { id: 23, name: "Avittam", tamil: "அவிட்டம்", rasiIds: [10, 11] },
  { id: 24, name: "Sathayam", tamil: "சதயம்", rasiIds: [11] },
  { id: 25, name: "Poorattathi", tamil: "பூரட்டாதி", rasiIds: [11, 12] },
  { id: 26, name: "Uthirattathi", tamil: "உத்திரட்டாதி", rasiIds: [12] },
  { id: 27, name: "Revathi", tamil: "ரேவதி", rasiIds: [12] }
];

export const RASIS = [
  { id: 1, name: "Mesha", tamil: "மேஷம்", symbol: "♈" },
  { id: 2, name: "Rishaba", tamil: "ரிஷபம்", symbol: "♉" },
  { id: 3, name: "Mithuna", tamil: "மிதுனம்", symbol: "♊" },
  { id: 4, name: "Kataka", tamil: "கடகம்", symbol: "♋" },
  { id: 5, name: "Simha", tamil: "சிம்மம்", symbol: "♌" },
  { id: 6, name: "Kanya", tamil: "கன்னி", symbol: "♍" },
  { id: 7, name: "Thula", tamil: "துலாம்", symbol: "♎" },
  { id: 8, name: "Vrischika", tamil: "விருச்சிகம்", symbol: "♏" },
  { id: 9, name: "Dhanus", tamil: "தனுசு", symbol: "♐" },
  { id: 10, name: "Makara", tamil: "மகரம்", symbol: "♑" },
  { id: 11, name: "Kumbha", tamil: "கும்பம்", symbol: "♒" },
  { id: 12, name: "Meena", tamil: "மீனம்", symbol: "♓" }
];

export const CITIES: City[] = [
  // Afghanistan
  { name: "Afghanistan - Kabul", lat: 34.5553, lon: 69.2075, timezone: 4.5 },
  // Argentina
  { name: "Argentina - Buenos Aires", lat: -34.6037, lon: -58.3816, timezone: -3.0 },
  // Australia
  { name: "Australia - Adelaide", lat: -34.9285, lon: 138.6007, timezone: 9.5 },
  { name: "Australia - Brisbane", lat: -27.4698, lon: 153.0251, timezone: 10.0 },
  { name: "Australia - Darwin", lat: -12.4634, lon: 130.8456, timezone: 9.5 },
  { name: "Australia - Melbourne", lat: -37.8136, lon: 144.9631, timezone: 10.0 },
  { name: "Australia - Perth", lat: -31.9505, lon: 115.8605, timezone: 8.0 },
  { name: "Australia - Sydney", lat: -33.8688, lon: 151.2093, timezone: 10.0 },
  // Austria
  { name: "Austria - Vienna", lat: 48.2082, lon: 16.3738, timezone: 1.0 },
  // Bahamas
  { name: "Bahamas - Nassau", lat: 25.0343, lon: -77.3963, timezone: -5.0 },
  // Bahrain
  { name: "Bahrain - Manama", lat: 26.2285, lon: 50.5860, timezone: 3.0 },
  // Bangladesh
  { name: "Bangladesh - Dhaka", lat: 23.8103, lon: 90.4125, timezone: 6.0 },
  // Belgium
  { name: "Belgium - Brussels", lat: 50.8503, lon: 4.3517, timezone: 1.0 },
  // Belize
  { name: "Belize - Belize City", lat: 17.5046, lon: -88.1962, timezone: -6.0 },
  // Bermuda
  { name: "Bermuda - Hamilton", lat: 32.2948, lon: -64.7813, timezone: -4.0 },
  // Bhutan
  { name: "Bhutan - Thimphu", lat: 27.4728, lon: 89.6393, timezone: 6.0 },
  // Botswana
  { name: "Botswana - Gaborone", lat: -24.6282, lon: 25.9231, timezone: 2.0 },
  // Brazil
  { name: "Brazil - Rio de Janeiro", lat: -22.9068, lon: -43.1729, timezone: -3.0 },
  { name: "Brazil - Sao Paulo", lat: -23.5505, lon: -46.6333, timezone: -3.0 },
  { name: "Brazil - Manaus", lat: -3.1190, lon: -60.0217, timezone: -4.0 },
  // Bulgaria
  { name: "Bulgaria - Sofia", lat: 42.6977, lon: 23.3219, timezone: 2.0 },
  // Cambodia
  { name: "Cambodia - Phnom Penh", lat: 11.5564, lon: 104.9282, timezone: 7.0 },
  // Cameroon
  { name: "Cameroon - Yaounde", lat: 3.8480, lon: 11.5021, timezone: 1.0 },
  // Canada
  { name: "Canada - Calgary", lat: 51.0447, lon: -114.0719, timezone: -7.0 },
  { name: "Canada - Halifax", lat: 44.6488, lon: -63.5752, timezone: -4.0 },
  { name: "Canada - Montreal", lat: 45.5017, lon: -73.5673, timezone: -5.0 },
  { name: "Canada - Toronto", lat: 43.6532, lon: -79.3832, timezone: -5.0 },
  { name: "Canada - Vancouver", lat: 49.2827, lon: -123.1207, timezone: -8.0 },
  { name: "Canada - Winnipeg", lat: 49.8951, lon: -97.1384, timezone: -6.0 },
  // Cayman Islands
  { name: "Cayman Islands - George Town", lat: 19.3133, lon: -81.2546, timezone: -5.0 },
  // Chile
  { name: "Chile - Santiago", lat: -33.4489, lon: -70.6693, timezone: -4.0 },
  // China
  { name: "China - Beijing", lat: 39.9042, lon: 116.4074, timezone: 8.0 },
  { name: "China - Shanghai", lat: 31.2304, lon: 121.4737, timezone: 8.0 },
  // Cook Islands
  { name: "Cook Islands - Avarua", lat: -21.2070, lon: -159.7710, timezone: -10.0 },
  // Costa Rica
  { name: "Costa Rica - San Jose", lat: 9.9281, lon: -84.0907, timezone: -6.0 },
  // Croatia
  { name: "Croatia - Zagreb", lat: 45.8150, lon: 15.9819, timezone: 1.0 },
  // Cyprus
  { name: "Cyprus - Nicosia", lat: 35.1856, lon: 33.3823, timezone: 2.0 },
  // Czech Republic
  { name: "Czech Republic - Prague", lat: 50.0755, lon: 14.4378, timezone: 1.0 },
  // Denmark
  { name: "Denmark - Copenhagen", lat: 55.6761, lon: 12.5683, timezone: 1.0 },
  // Estonia
  { name: "Estonia - Tallinn", lat: 59.4370, lon: 24.7536, timezone: 2.0 },
  // Eswatini
  { name: "Eswatini - Mbabane", lat: -26.3055, lon: 31.1367, timezone: 2.0 },
  // Falkland Islands
  { name: "Falkland Islands - Stanley", lat: -51.6977, lon: -57.8517, timezone: -3.0 },
  // Fiji
  { name: "Fiji - Suva", lat: -18.1248, lon: 178.4501, timezone: 12.0 },
  // Finland
  { name: "Finland - Helsinki", lat: 60.1699, lon: 24.9384, timezone: 2.0 },
  // France
  { name: "France - Paris", lat: 48.8566, lon: 2.3522, timezone: 1.0 },
  // Gambia
  { name: "Gambia - Banjul", lat: 13.4549, lon: -16.5790, timezone: 0.0 },
  // Germany
  { name: "Germany - Berlin", lat: 52.5200, lon: 13.4050, timezone: 1.0 },
  { name: "Germany - Frankfurt", lat: 50.1109, lon: 8.6821, timezone: 1.0 },
  // Ghana
  { name: "Ghana - Accra", lat: 5.6037, lon: -0.1870, timezone: 0.0 },
  // Gibraltar
  { name: "Gibraltar", lat: 36.1408, lon: -5.3536, timezone: 1.0 },
  // Greece
  { name: "Greece - Athens", lat: 37.9838, lon: 23.7275, timezone: 2.0 },
  // Guernsey
  { name: "Guernsey - St Peter Port", lat: 49.4585, lon: -2.5359, timezone: 0.0 },
  // Hong Kong
  { name: "Hong Kong", lat: 22.3193, lon: 114.1694, timezone: 8.0 },
  // Hungary
  { name: "Hungary - Budapest", lat: 47.4979, lon: 19.0402, timezone: 1.0 },
  // India
  { name: "India - Bangalore", lat: 12.9716, lon: 77.5946, timezone: 5.5 },
  { name: "India - Chennai", lat: 13.0827, lon: 80.2707, timezone: 5.5 },
  { name: "India - Delhi", lat: 28.7041, lon: 77.1025, timezone: 5.5 },
  { name: "India - Kolkata", lat: 22.5726, lon: 88.3639, timezone: 5.5 },
  { name: "India - Mumbai", lat: 19.0760, lon: 72.8777, timezone: 5.5 },
  // Indonesia
  { name: "Indonesia - Bali (Denpasar)", lat: -8.6705, lon: 115.2126, timezone: 8.0 },
  { name: "Indonesia - Jakarta", lat: -6.2088, lon: 106.8456, timezone: 7.0 },
  // Iran
  { name: "Iran - Tehran", lat: 35.6892, lon: 51.3890, timezone: 3.5 },
  // Ireland
  { name: "Ireland - Dublin", lat: 53.3498, lon: -6.2603, timezone: 0.0 },
  // Isle of Man
  { name: "Isle of Man - Douglas", lat: 54.1515, lon: -4.4861, timezone: 0.0 },
  // Israel
  { name: "Israel - Jerusalem", lat: 31.7683, lon: 35.2137, timezone: 2.0 },
  // Italy
  { name: "Italy - Rome", lat: 41.9028, lon: 12.4964, timezone: 1.0 },
  // Ivory Coast
  { name: "Ivory Coast - Yamoussoukro", lat: 6.8276, lon: -5.2767, timezone: 0.0 },
  // Japan
  { name: "Japan - Tokyo", lat: 35.6762, lon: 139.6503, timezone: 9.0 },
  { name: "Japan - Osaka", lat: 34.6937, lon: 135.5023, timezone: 9.0 },
  // Jersey
  { name: "Jersey - Saint Helier", lat: 49.1812, lon: -2.1054, timezone: 0.0 },
  // Kenya
  { name: "Kenya - Nairobi", lat: -1.2921, lon: 36.8219, timezone: 3.0 },
  // Kuwait
  { name: "Kuwait - Kuwait City", lat: 29.3759, lon: 47.9774, timezone: 3.0 },
  // Lesotho
  { name: "Lesotho - Maseru", lat: -29.3151, lon: 27.4869, timezone: 2.0 },
  // Luxembourg
  { name: "Luxembourg", lat: 49.6116, lon: 6.1319, timezone: 1.0 },
  // Malawi
  { name: "Malawi - Lilongwe", lat: -13.9626, lon: 33.7741, timezone: 2.0 },
  // Malaysia
  { name: "Malaysia - Kuala Lumpur", lat: 3.1390, lon: 101.6869, timezone: 8.0 },
  // Maldives
  { name: "Maldives - Male", lat: 4.1755, lon: 73.5093, timezone: 5.0 },
  // Mali
  { name: "Mali - Bamako", lat: 12.6392, lon: -8.0029, timezone: 0.0 },
  // Malta
  { name: "Malta - Valletta", lat: 35.8992, lon: 14.5141, timezone: 1.0 },
  // Mexico
  { name: "Mexico - Mexico City", lat: 19.4326, lon: -99.1332, timezone: -6.0 },
  // Mongolia
  { name: "Mongolia - Ulaanbaatar", lat: 47.8864, lon: 106.9057, timezone: 8.0 },
  // Mozambique
  { name: "Mozambique - Maputo", lat: -25.9692, lon: 32.5732, timezone: 2.0 },
  // Myanmar
  { name: "Myanmar - Yangon", lat: 16.8409, lon: 96.1735, timezone: 6.5 },
  // Namibia
  { name: "Namibia - Windhoek", lat: -22.5609, lon: 17.0658, timezone: 2.0 },
  // Nepal
  { name: "Nepal - Kathmandu", lat: 27.7172, lon: 85.3240, timezone: 5.75 },
  // Netherlands
  { name: "Netherlands - Amsterdam", lat: 52.3676, lon: 4.9041, timezone: 1.0 },
  // New Zealand
  { name: "New Zealand - Auckland", lat: -36.8485, lon: 174.7633, timezone: 12.0 },
  { name: "New Zealand - Wellington", lat: -41.2865, lon: 174.7762, timezone: 12.0 },
  // Nigeria
  { name: "Nigeria - Lagos", lat: 6.5244, lon: 3.3792, timezone: 1.0 },
  // Norway
  { name: "Norway - Oslo", lat: 59.9139, lon: 10.7522, timezone: 1.0 },
  // Oman
  { name: "Oman - Muscat", lat: 23.5880, lon: 58.3829, timezone: 4.0 },
  // Pakistan
  { name: "Pakistan - Islamabad", lat: 33.6844, lon: 73.0479, timezone: 5.0 },
  { name: "Pakistan - Karachi", lat: 24.8607, lon: 67.0011, timezone: 5.0 },
  { name: "Pakistan - Lahore", lat: 31.5204, lon: 74.3587, timezone: 5.0 },
  // Panama
  { name: "Panama - Panama City", lat: 8.9824, lon: -79.5199, timezone: -5.0 },
  // Papua New Guinea
  { name: "Papua New Guinea - Port Moresby", lat: -9.4438, lon: 147.1803, timezone: 10.0 },
  // Peru
  { name: "Peru - Lima", lat: -12.0464, lon: -77.0428, timezone: -5.0 },
  // Philippines
  { name: "Philippines - Manila", lat: 14.5995, lon: 120.9842, timezone: 8.0 },
  // Portugal
  { name: "Portugal - Lisbon", lat: 38.7223, lon: -9.1393, timezone: 0.0 },
  // Qatar
  { name: "Qatar - Doha", lat: 25.2854, lon: 51.5310, timezone: 3.0 },
  // Romania
  { name: "Romania - Bucharest", lat: 44.4268, lon: 26.1025, timezone: 2.0 },
  // Rwanda
  { name: "Rwanda - Kigali", lat: -1.9441, lon: 30.0619, timezone: 2.0 },
  // Saint Helena
  { name: "Saint Helena - Jamestown", lat: -15.9244, lon: -5.7180, timezone: 0.0 },
  // Samoa
  { name: "Samoa - Apia", lat: -13.8333, lon: -171.7667, timezone: 13.0 },
  // Saudi Arabia
  { name: "Saudi Arabia - Riyadh", lat: 24.7136, lon: 46.6753, timezone: 3.0 },
  { name: "Saudi Arabia - Mecca", lat: 21.3891, lon: 39.8579, timezone: 3.0 },
  // Serbia
  { name: "Serbia - Belgrade", lat: 44.7866, lon: 20.4489, timezone: 1.0 },
  // Singapore
  { name: "Singapore", lat: 1.3521, lon: 103.8198, timezone: 8.0 },
  // Slovenia
  { name: "Slovenia - Ljubljana", lat: 46.0569, lon: 14.5058, timezone: 1.0 },
  // South Africa
  { name: "South Africa - Cape Town", lat: -33.9249, lon: 18.4241, timezone: 2.0 },
  { name: "South Africa - Johannesburg", lat: -26.2041, lon: 28.0473, timezone: 2.0 },
  // South Korea
  { name: "South Korea - Seoul", lat: 37.5665, lon: 126.9780, timezone: 9.0 },
  // Spain
  { name: "Spain - Madrid", lat: 40.4168, lon: -3.7038, timezone: 1.0 },
  // Sri Lanka
  { name: "Sri Lanka - Colombo", lat: 6.9271, lon: 79.8612, timezone: 5.5 },
  // Sweden
  { name: "Sweden - Stockholm", lat: 59.3293, lon: 18.0686, timezone: 1.0 },
  // Switzerland
  { name: "Switzerland - Zurich", lat: 47.3769, lon: 8.5417, timezone: 1.0 },
  // Tajikistan
  { name: "Tajikistan - Dushanbe", lat: 38.5598, lon: 68.7870, timezone: 5.0 },
  // Tanzania
  { name: "Tanzania - Dar es Salaam", lat: -6.7924, lon: 39.2083, timezone: 3.0 },
  // Thailand
  { name: "Thailand - Bangkok", lat: 13.7563, lon: 100.5018, timezone: 7.0 },
  // Turkey
  { name: "Turkey - Istanbul", lat: 41.0082, lon: 28.9784, timezone: 3.0 },
  // Uganda
  { name: "Uganda - Kampala", lat: 0.3476, lon: 32.5825, timezone: 3.0 },
  // UAE
  { name: "UAE - Dubai", lat: 25.2048, lon: 55.2708, timezone: 4.0 },
  { name: "UAE - Abu Dhabi", lat: 24.4539, lon: 54.3773, timezone: 4.0 },
  // UK
  { name: "UK - London", lat: 51.5074, lon: -0.1278, timezone: 0.0 },
  { name: "UK - Manchester", lat: 53.4808, lon: -2.2426, timezone: 0.0 },
  { name: "UK - Edinburgh (Scotland)", lat: 55.9533, lon: -3.1883, timezone: 0.0 },
  // USA
  { name: "USA - Anchorage", lat: 61.2181, lon: -149.9003, timezone: -9.0 },
  { name: "USA - Chicago", lat: 41.8781, lon: -87.6298, timezone: -6.0 },
  { name: "USA - Denver", lat: 39.7392, lon: -104.9903, timezone: -7.0 },
  { name: "USA - Honolulu", lat: 21.3069, lon: -157.8583, timezone: -10.0 },
  { name: "USA - Los Angeles", lat: 34.0522, lon: -118.2437, timezone: -8.0 },
  { name: "USA - New York", lat: 40.7128, lon: -74.0060, timezone: -5.0 },
  { name: "USA - Phoenix", lat: 33.4484, lon: -112.0740, timezone: -7.0 },
  { name: "USA - San Francisco", lat: 37.7749, lon: -122.4194, timezone: -8.0 },
  { name: "USA - Washington DC", lat: 38.9072, lon: -77.0369, timezone: -5.0 },
  // West Indies (Selected Islands)
  { name: "West Indies - Barbados", lat: 13.1132, lon: -59.5988, timezone: -4.0 },
  { name: "West Indies - Jamaica", lat: 17.9712, lon: -76.7928, timezone: -5.0 },
  { name: "West Indies - Trinidad", lat: 10.6549, lon: -61.5022, timezone: -4.0 },
  // Zimbabwe
  { name: "Zimbabwe - Harare", lat: -17.8216, lon: 31.0492, timezone: 2.0 },
  // Custom
  { name: "Custom", lat: 0, lon: 0, timezone: 5.5 }
];