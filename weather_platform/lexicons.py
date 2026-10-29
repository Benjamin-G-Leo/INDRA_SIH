"""Shared reference data: hazards, India gazetteer, aliases, keyword lexicons."""
import re

# ---------------------------------------------------------------- hazards
HAZARDS = [
    "Heatwave", "Heavy Rainfall", "Very Heavy Rainfall", "Extremely Heavy Rainfall",
    "Cyclone", "Extreme Wind", "Strong Surface Winds", "Flood", "Thunderstorm",
    "Lightning", "Thunderstorm & Lightning", "Hailstorm", "Dust Storm",
    "Dust-Raising Winds", "Squall", "Hot Day", "Hot & Humid", "Warm Night",
    "Cold Wave", "Cold Day", "Fog", "Ground Frost", "Heavy Snowfall",
]


def _hk(s):
    """Normalise a hazard string for alias lookup."""
    s = str(s).lower().replace("&", " and ")
    s = re.sub(r"[-_/]+", " ", s)
    s = re.sub(r"[^a-z ]+", "", s)
    return re.sub(r"\s+", " ", s).strip()


_ALIAS_SRC = {
    "Heatwave": ["heat wave", "severe heat wave", "heatwave conditions"],
    "Heavy Rainfall": ["heavy rain", "heavy rains", "heavy rainfall warning"],
    "Very Heavy Rainfall": ["very heavy rain", "very heavy rains"],
    "Extremely Heavy Rainfall": ["extremely heavy rain", "extreme rainfall", "extremely heavy rains"],
    "Cyclone": ["cyclonic storm", "severe cyclonic storm", "cyclone warning"],
    "Extreme Wind": ["extreme winds", "extremely strong winds"],
    "Strong Surface Winds": ["strong winds", "strong surface wind", "strong surface winds"],
    "Flood": ["flooding", "flash flood", "floods"],
    "Thunderstorm": ["thunder storm", "thunderstorms"],
    "Lightning": ["lightning strike", "lightning strikes"],
    "Thunderstorm & Lightning": ["thunderstorm and lightning", "thunderstorm with lightning",
                                 "thunderstorm lightning", "thunderstorm/lightning"],
    "Hailstorm": ["hail storm", "hail", "hailstorms"],
    "Dust Storm": ["duststorm", "dust storms"],
    "Dust-Raising Winds": ["dust raising winds", "dust raising wind", "dust-raising wind"],
    "Squall": ["squalls", "squally weather", "squally winds"],
    "Hot Day": ["hot day conditions", "hot weather"],
    "Hot & Humid": ["hot and humid", "hot humid", "hot and humid weather"],
    "Warm Night": ["warm nights", "warm night conditions"],
    "Cold Wave": ["coldwave", "cold-wave", "severe cold wave"],
    "Cold Day": ["cold day conditions", "cold days"],
    "Fog": ["dense fog", "shallow fog", "very dense fog", "foggy conditions"],
    "Ground Frost": ["ground-frost", "frost"],
    "Heavy Snowfall": ["heavy snow", "snowfall", "heavy snowfall warning"],
}
HAZARD_ALIASES = {}
for _h in HAZARDS:
    HAZARD_ALIASES[_hk(_h)] = _h
    for _a in _ALIAS_SRC.get(_h, []):
        HAZARD_ALIASES[_hk(_a)] = _h


def normalize_hazard(x):
    return HAZARD_ALIASES.get(_hk(x)) if x is not None else None


# ---------------------------------------------------------------- geography
GEO = {
    "Rajasthan": {"Jaipur": (26.91, 75.79), "Jodhpur": (26.24, 73.02), "Bikaner": (28.02, 73.31), "Barmer": (25.75, 71.39)},
    "Uttar Pradesh": {"Lucknow": (26.85, 80.95), "Varanasi": (25.32, 82.97), "Agra": (27.18, 78.01), "Prayagraj": (25.43, 81.85)},
    "Delhi": {"New Delhi": (28.61, 77.21), "North Delhi": (28.70, 77.20), "South Delhi": (28.52, 77.21)},
    "Punjab": {"Ludhiana": (30.90, 75.86), "Amritsar": (31.63, 74.87), "Patiala": (30.34, 76.39)},
    "Haryana": {"Gurugram": (28.46, 77.03), "Hisar": (29.15, 75.72), "Ambala": (30.38, 76.78)},
    "Madhya Pradesh": {"Bhopal": (23.26, 77.41), "Indore": (22.72, 75.86), "Gwalior": (26.22, 78.18)},
    "Bihar": {"Patna": (25.59, 85.14), "Gaya": (24.80, 85.00), "Darbhanga": (26.15, 85.90), "Muzaffarpur": (26.12, 85.39)},
    "West Bengal": {"Kolkata": (22.57, 88.36), "Howrah": (22.59, 88.31), "Siliguri": (26.72, 88.43), "Purba Medinipur": (21.90, 87.70)},
    "Odisha": {"Bhubaneswar": (20.30, 85.82), "Puri": (19.81, 85.83), "Balasore": (21.49, 86.93), "Ganjam": (19.39, 85.00)},
    "Assam": {"Guwahati": (26.14, 91.74), "Dibrugarh": (27.48, 94.91), "Silchar": (24.83, 92.78)},
    "Gujarat": {"Ahmedabad": (23.02, 72.57), "Surat": (21.17, 72.83), "Kutch": (23.73, 69.86), "Rajkot": (22.30, 70.80)},
    "Maharashtra": {"Mumbai": (19.08, 72.88), "Pune": (18.52, 73.86), "Nagpur": (21.15, 79.09), "Nashik": (19.99, 73.79)},
    "Karnataka": {"Bengaluru": (12.97, 77.59), "Mangaluru": (12.91, 74.86), "Belagavi": (15.85, 74.50)},
    "Kerala": {"Thiruvananthapuram": (8.52, 76.94), "Kochi": (9.93, 76.27), "Kozhikode": (11.26, 75.78), "Wayanad": (11.69, 76.13)},
    "Tamil Nadu": {"Chennai": (13.08, 80.27), "Coimbatore": (11.02, 76.96), "Madurai": (9.92, 78.12), "Cuddalore": (11.75, 79.77)},
    "Andhra Pradesh": {"Visakhapatnam": (17.69, 83.22), "Vijayawada": (16.51, 80.65), "Tirupati": (13.63, 79.42)},
    "Telangana": {"Hyderabad": (17.38, 78.49), "Warangal": (17.97, 79.59), "Nizamabad": (18.67, 78.09)},
    "Jharkhand": {"Ranchi": (23.34, 85.31), "Jamshedpur": (22.80, 86.20)},
    "Chhattisgarh": {"Raipur": (21.25, 81.63), "Bilaspur": (22.08, 82.15)},
    "Himachal Pradesh": {"Shimla": (31.10, 77.17), "Kullu": (31.96, 77.11), "Lahaul and Spiti": (32.57, 77.03)},
    "Uttarakhand": {"Dehradun": (30.32, 78.03), "Chamoli": (30.40, 79.32), "Nainital": (29.38, 79.46)},
    "Jammu and Kashmir": {"Srinagar": (34.08, 74.80), "Jammu": (32.73, 74.86), "Anantnag": (33.73, 75.15)},
    "Ladakh": {"Leh": (34.15, 77.58), "Kargil": (34.56, 76.13)},
    "Sikkim": {"Gangtok": (27.33, 88.61), "Mangan": (27.51, 88.52)},
    "Meghalaya": {"East Khasi Hills": (25.27, 91.73), "West Garo Hills": (25.52, 90.22)},
    "Goa": {"North Goa": (15.50, 73.83), "South Goa": (15.27, 74.00)},
    "Arunachal Pradesh": {"Tawang": (27.59, 91.86), "Itanagar": (27.09, 93.62)},
}

STATE_ALIASES = {
    "orissa": "Odisha", "up": "Uttar Pradesh", "u p": "Uttar Pradesh", "mp": "Madhya Pradesh",
    "tn": "Tamil Nadu", "wb": "West Bengal", "bengal": "West Bengal", "j&k": "Jammu and Kashmir",
    "jk": "Jammu and Kashmir", "jammu kashmir": "Jammu and Kashmir", "jammu & kashmir": "Jammu and Kashmir",
    "delhi ncr": "Delhi", "nct of delhi": "Delhi", "new delhi": "Delhi", "uttaranchal": "Uttarakhand",
    "ap": "Andhra Pradesh", "hp": "Himachal Pradesh", "mh": "Maharashtra", "maharastra": "Maharashtra",
    "karnatka": "Karnataka", "raj": "Rajasthan", "guj": "Gujarat", "tg": "Telangana", "kl": "Kerala",
}
DISTRICT_ALIASES = {
    "bangalore": "Bengaluru", "bombay": "Mumbai", "calcutta": "Kolkata", "madras": "Chennai",
    "trivandrum": "Thiruvananthapuram", "vizag": "Visakhapatnam", "gurgaon": "Gurugram",
    "allahabad": "Prayagraj", "banaras": "Varanasi", "benares": "Varanasi", "belgaum": "Belagavi",
    "mangalore": "Mangaluru", "cochin": "Kochi", "calicut": "Kozhikode", "poona": "Pune",
    "cherrapunji": "East Khasi Hills", "shillong": "East Khasi Hills", "kutchh": "Kutch",
    "bhubaneshwar": "Bhubaneswar", "orissa puri": "Puri", "lahaul spiti": "Lahaul and Spiti",
}

# ---------------------------------------------------------------- hazard keyword lexicon
# (regex, weight) — English / Hinglish / Hindi.  Matched on lower-cased cleaned text.
_P = lambda *items: [(re.compile(r, re.I), w) for r, w in items]
PATTERNS = {
    "Heatwave": _P((r"heat ?wave", 3), (r"\bloo\b", 3), ("लू", 2), ("भीषण गर्मी", 3), (r"scorching", 1)),
    "Hot Day": _P((r"hot ?day", 3), ("गर्म दिन", 3), (r"garam din", 3), (r"scorching day", 3), (r"above normal", 1)),
    "Hot & Humid": _P((r"hot ?(and|&)? ?humid", 3), (r"humid", 2), (r"muggy", 2), (r"sticky", 1), (r"\bumas\b|उमस", 3)),
    "Warm Night": _P((r"warm ?night", 3), (r"hot (sticky )?night", 3), (r"raat bhi garam", 3), ("गर्म रात", 3),
                     (r"nights? (are )?not cooling", 3)),
    "Cold Wave": _P((r"cold ?wave", 3), (r"shitlahar|शीतलहर", 3), (r"biting cold", 1)),
    "Cold Day": _P((r"cold ?day", 3), (r"thanda din|ठंडा दिन", 3), (r"din bhar thand", 3), (r"chilly", 1)),
    "Fog": _P((r"\bfog\b", 3), (r"foggy", 3), (r"kohra|कोहरा", 3)),
    "Ground Frost": _P((r"ground ?frost", 4), (r"\bfrost\b", 3), (r"\bpala\b|पाला", 3)),
    "Heavy Snowfall": _P((r"snowfall|\bsnow\b", 3), (r"barfbari|बर्फबारी", 3)),
    "Heavy Rainfall": _P((r"heavy ?rain(fall|s)?", 3), (r"bhari barish|भारी बारिश", 3), (r"waterlogg", 1)),
    "Very Heavy Rainfall": _P((r"very ?heavy ?rain", 4), (r"torrential", 3), (r"non-?stop downpour", 3),
                              (r"bahut (tez|bhari) barish", 4), ("बहुत भारी बारिश", 4), (r"orange alert", 1)),
    "Extremely Heavy Rainfall": _P((r"extremely ?heavy ?rain|extreme ?rainfall", 5), (r"ati bhari barish", 5),
                                   ("अत्यंत भारी", 5), (r"red alert", 1), (r"cloudburst", 3)),
    "Cyclone": _P((r"cyclon", 4), ("चक्रवात", 4), (r"landfall", 2)),
    "Extreme Wind": _P((r"extremely violent wind|destructive gust|ferocious wind|extreme ?winds?", 4),
                       (r"tabahi wali hawa", 4), ("विनाशकारी", 4)),
    "Strong Surface Winds": _P((r"strong ?(surface ?)?winds?", 3), (r"very windy", 3), (r"tez hawa", 3),
                               ("तेज (सतही )?हवा", 3)),
    "Flood": _P((r"flood", 3), (r"baadh|बाढ़", 3), (r"danger mark|खतरे के निशान", 2), (r"submerged|inundat", 2),
                (r"rescue boat", 2)),
    "Thunderstorm": _P((r"thunder ?storm", 3), (r"\bthunder\b", 2), (r"\bgaj\b", 2), ("गरज", 2), (r"aandhi", 1), (r"toofan|तूफान", 1)),
    "Lightning": _P((r"lightning", 3), (r"bijli (gir|chamak)", 3), ("आकाशीय बिजली", 3), ("बिजली गिरी", 3),
                    ("बिजली कड़क", 3)),
    "Hailstorm": _P((r"hail", 4), (r"\bole gire\b|\bole\b", 3), ("ओलावृष्टि", 4)),
    "Dust Storm": _P((r"dust ?storm", 4), (r"dhool bhari aandhi", 4), ("धूल भरी आंधी", 4)),
    "Dust-Raising Winds": _P((r"dust[- ]?raising", 4), (r"dusty winds?", 3), (r"lifting (loose )?dust|dust haze|dusty haze", 3), (r"dhool udane", 4), ("धूल उड़ाने", 4)),
    "Squall": _P((r"squall", 4), ("झोंकेदार", 2)),
}
# generic weather vocabulary — counts only when no hazard-specific lexeme matched
GENERIC_WEATHER = re.compile(
    r"weather|\brain|barish|बारिश|mausam|मौसम|temperature|तापमान|\bstorm|\bwinds?\b|हवा|\bhawa\b|garmi|गर्मी|"
    r"\bthand\b|ठंड|forecast|monsoon|downpour|drizzle", re.I)

# physical / impact cues that make a short post credible weather news
IMPACT_CUES = re.compile(
    r"alert|\bimd\b|evacuat|rescue|ndrf|sdrf|waterlog|visibility|kmph|km/h|\bmm\b|\bcm\b|°c|degrees?|power cut|"
    r"stranded|damage|uprooted|shelter|delayed|covering|floating|collapsed|blocked|"
    r"stopped|suspended|cancelled|halted|sadak band|fasal|madad|light chali|gaon|सड़क|फसल|बिजली गुल|अलर्ट|"
    r"दृश्यता|तापमान|जलभराव|बंद|marooned|rescuing|struck|transformer|branches down|power gone|heat ?stroke|sun ?stroke|"
    r"cattle|crops?\b", re.I)
QUANTITY = re.compile(r"\d+(?:\.\d+)?\s*(?:mm|cm|kmph|km/h|°c|°|degrees?|m\b|metres?|meters?|%)", re.I)

# contexts that make weather words figurative / entertainment / unrelated
NEGATIVE_CONTEXT = re.compile(
    r"\b(cricket|ipl|t20|odi|wicket|innings|six by|match today|vs\b|movie|film|trailer|song|album|playlist|lyrics|"
    r"episode|web series|bollywood|netflix|ott|box office|memes?|my ex|boyfriend|girlfriend|crush|storm of emotions|"
    r"flood of (emotions|tears|memories)|heat of the moment|cold coffee|cold war|fog of (war|uncertainty)|"
    r"lightning mcqueen|cars 3|pubg|bgmi|ps5|gta|recipe|biryani|sensex|nifty|stocks?|parliament|opposition|"
    r"hot take|hot seat|heated debate|political storm|perfect storm|brainstorm|rewatch(ing)?|streaming|stream it|"
    r"shah rukh|dhoni|kohli|arijit|tufan|"
    r"planning a trip|hope the weather|favou?rite season|which umbrella|throwback|collection launch|heat pump|"
    r"nothing to worry|cool nickname|calls himself)\b|फिल्म|समीक्षा|गाना", re.I)

# ---------------------------------------------------------------- spam lexicon
SHORTENERS = re.compile(r"\b(?:bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|is\.gd|t\.me|wa\.me|goo\.gl|shorturl\.at)/", re.I)
SPAM_PHRASES = re.compile(
    r"\b(win|won|winner|free|giveaway|click( here| the link)?|subscribe|follow ?back|follow for follow|f4f|"
    r"like4like|earn|work from home|loan|casino|bet(ting)?|bitcoin|crypto|signals?|discount|\d+% ?off|"
    r"buy now|limited offer|promo ?code|sale|dm for|whatsapp|18\+|lottery|jackpot|recharge|claim|prize|"
    r"verify (now|your)|account (has been )?(compromised|suspended)|instant|deposit|bonus)\b", re.I)
PHONE = re.compile(r"(?:\+91[\s-]?)?[6-9]\d{9}\b")
