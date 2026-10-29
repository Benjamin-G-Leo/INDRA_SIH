"""
Generate a noisy 5000-record sample dataset (IMD bulletins + public/social reports)
for the India weather & disaster verification platform.

  python generate_dataset.py                 # 5000 raw rows (2000 IMD + 3000 public)
  python generate_dataset.py --total 8000 --seed 7

Output (data/):
  imd_records.csv     official observations / warnings (messy formats, units, duplicates)
  public_records.csv  social / news / citizen reports (spam, irrelevant posts, reposts, typos, Hinglish, Hindi)

Rows are linked through `event_id`.  Noise rows (spam / irrelevant) have no event_id.
`hazard_label` is the ground-truth label for ML; `_gt_noise` is ground truth used ONLY to
evaluate the cleaning pipeline (the pipeline never uses it to make decisions).
"""
import argparse, csv, os, random
from datetime import datetime, timedelta, timezone

from lexicons import GEO, HAZARDS, HAZARD_ALIASES, DISTRICT_ALIASES
from processing import clean_text  # only used to keep genuine posts textually distinct

IST = timezone(timedelta(hours=5, minutes=30))
U = lambda a, b: random.uniform(a, b)

# ------------------------------------------------------------------ region groups
NORTH = ["Punjab", "Haryana", "Delhi", "Uttar Pradesh", "Rajasthan", "Bihar"]
HEAT = NORTH + ["Madhya Pradesh", "Gujarat", "Maharashtra", "Telangana", "Andhra Pradesh", "Odisha", "Chhattisgarh", "Jharkhand"]
COASTAL = ["Kerala", "Karnataka", "Goa", "Maharashtra", "Gujarat", "Tamil Nadu", "Andhra Pradesh", "Odisha", "West Bengal"]
NE = ["Assam", "Meghalaya", "Arunachal Pradesh", "Sikkim"]
MONSOON = COASTAL + NE + ["Uttar Pradesh", "Bihar", "Madhya Pradesh", "Uttarakhand", "Himachal Pradesh", "Telangana",
                          "Jharkhand", "Chhattisgarh", "Rajasthan"]
SNOWY = ["Jammu and Kashmir", "Ladakh", "Himachal Pradesh", "Uttarakhand", "Sikkim", "Arunachal Pradesh"]
EXTREME_RAIN = ["Kerala", "Karnataka", "Maharashtra", "Assam", "Meghalaya", "Uttarakhand", "Himachal Pradesh",
                "Gujarat", "Odisha", "Goa", "West Bengal"]
FLOOD_ST = ["Assam", "Bihar", "Kerala", "Uttar Pradesh", "West Bengal", "Odisha", "Gujarat", "Maharashtra",
            "Telangana", "Andhra Pradesh", "Karnataka"]

# hazard -> (weight, months, states, metric generator)
SPECS = {
    "Heatwave": (40, [4, 5, 6], HEAT, lambda: dict(tmax=U(41, 47.5), tmin=U(25, 32), hum=U(8, 35), wind=U(8, 28), vis=U(3000, 8000))),
    "Heavy Rainfall": (60, [6, 7, 8, 9], MONSOON, lambda: dict(rain=U(64.5, 115.5), wind=U(12, 35), hum=U(80, 98), tmax=U(24, 31), tmin=U(22, 26), pres=U(996, 1004), vis=U(1000, 4000))),
    "Very Heavy Rainfall": (35, [6, 7, 8, 9], MONSOON, lambda: dict(rain=U(115.6, 204.4), wind=U(15, 45), hum=U(85, 100), tmax=U(23, 30), tmin=U(21, 25), pres=U(992, 1002), vis=U(300, 2000))),
    "Extremely Heavy Rainfall": (15, [6, 7, 8, 9], EXTREME_RAIN, lambda: dict(rain=U(204.5, 420), wind=U(20, 60), hum=U(90, 100), tmax=U(22, 28), tmin=U(20, 24), pres=U(985, 1000), vis=U(100, 1000))),
    "Cyclone": (15, [4, 5, 6, 10, 11, 12], ["Odisha", "West Bengal", "Andhra Pradesh", "Tamil Nadu", "Gujarat"], lambda: dict(wind=U(65, 200), rain=U(60, 300), pres=U(940, 995), hum=U(85, 100), vis=U(100, 2000), tmax=U(25, 31), tmin=U(22, 26))),
    "Extreme Wind": (10, [3, 4, 5, 6, 9, 10], COASTAL + NORTH, lambda: dict(wind=U(80, 140), rain=U(0, 20), hum=U(30, 80), vis=U(500, 5000))),
    "Strong Surface Winds": (25, [3, 4, 5, 6, 7], HEAT + COASTAL, lambda: dict(wind=U(28, 48), hum=U(20, 70), vis=U(3000, 9000))),
    "Flood": (35, [6, 7, 8, 9, 10], FLOOD_ST, lambda: dict(rain=U(80, 320), river=U(0.2, 3.5), hum=U(85, 100), wind=U(8, 30), vis=U(500, 3000), tmax=U(24, 31), tmin=U(21, 25))),
    "Thunderstorm": (45, [3, 4, 5, 6, 7, 8, 9], MONSOON + NORTH, lambda: dict(rain=U(5, 40), wind=U(35, 65), lightning=U(3, 25), hum=U(55, 90), tmax=U(26, 36), tmin=U(20, 26))),
    "Lightning": (25, [4, 5, 6, 7, 8, 9], ["Bihar", "Odisha", "Jharkhand", "West Bengal", "Uttar Pradesh", "Madhya Pradesh", "Assam", "Chhattisgarh", "Maharashtra"], lambda: dict(lightning=U(40, 160), rain=U(0, 12), wind=U(10, 30), hum=U(60, 90))),
    "Thunderstorm & Lightning": (30, [4, 5, 6, 7, 8, 9], MONSOON + NORTH, lambda: dict(lightning=U(40, 140), rain=U(15, 70), wind=U(40, 80), hum=U(65, 95), tmax=U(25, 34), tmin=U(20, 26))),
    "Hailstorm": (20, [2, 3, 4, 5], ["Maharashtra", "Telangana", "Punjab", "Madhya Pradesh", "Rajasthan", "Karnataka", "Haryana", "Uttar Pradesh"], lambda: dict(hail=U(5, 45), rain=U(5, 35), wind=U(35, 70), lightning=U(0, 40), tmax=U(22, 33), tmin=U(14, 22), hum=U(45, 85))),
    "Dust Storm": (20, [4, 5, 6], ["Rajasthan", "Delhi", "Uttar Pradesh", "Haryana", "Punjab", "Gujarat"], lambda: dict(vis=U(100, 800), wind=U(50, 95), hum=U(8, 30), tmax=U(36, 44), tmin=U(24, 30))),
    "Dust-Raising Winds": (15, [4, 5, 6], ["Rajasthan", "Delhi", "Uttar Pradesh", "Haryana", "Punjab", "Gujarat", "Madhya Pradesh"], lambda: dict(vis=U(800, 3500), wind=U(30, 50), hum=U(8, 35), tmax=U(34, 43), tmin=U(22, 30))),
    "Squall": (20, [3, 4, 5, 6, 7, 8, 9], ["Bihar", "West Bengal", "Odisha", "Jharkhand", "Assam", "Uttar Pradesh", "Delhi", "Kerala", "Maharashtra"], lambda: dict(wind=U(60, 100), rain=U(0, 25), hum=U(50, 90), vis=U(1000, 6000))),
    "Hot Day": (30, [3, 4, 5, 6], HEAT, lambda: dict(tmax=U(37, 40.8), tmin=U(22, 29), hum=U(15, 45), wind=U(6, 18))),
    "Hot & Humid": (25, [4, 5, 6, 7, 8, 9], COASTAL, lambda: dict(tmax=U(34, 39), tmin=U(27, 30), hum=U(72, 95), wind=U(4, 14), vis=U(3000, 7000))),
    "Warm Night": (15, [4, 5, 6], HEAT + COASTAL, lambda: dict(tmax=U(37, 43), tmin=U(28.5, 33), hum=U(25, 60))),
    "Cold Wave": (30, [12, 1, 2], NORTH + ["Madhya Pradesh", "Jharkhand"], lambda: dict(tmin=U(0.5, 4), tmax=U(10, 20), hum=U(55, 90), vis=U(300, 3000), wind=U(2, 12))),
    "Cold Day": (20, [12, 1, 2], NORTH + ["Madhya Pradesh"], lambda: dict(tmax=U(11, 17), tmin=U(4, 9), hum=U(75, 98), vis=U(200, 1500), wind=U(2, 10))),
    "Fog": (40, [11, 12, 1, 2], NORTH, lambda: dict(vis=U(20, 199), hum=U(88, 100), tmin=U(3, 10), tmax=U(12, 20), wind=U(0, 6))),
    "Ground Frost": (15, [12, 1, 2], ["Jammu and Kashmir", "Himachal Pradesh", "Uttarakhand", "Punjab", "Haryana", "Rajasthan", "Ladakh"], lambda: dict(tmin=U(-6, 1), tmax=U(2, 14), hum=U(50, 90), wind=U(0, 8))),
    "Heavy Snowfall": (20, [12, 1, 2, 3], SNOWY, lambda: dict(snow=U(15, 90), tmax=U(-8, 3), tmin=U(-18, -3), wind=U(10, 40), vis=U(50, 800), hum=U(70, 100))),
}
assert set(SPECS) == set(HAZARDS)
DEFAULTS = lambda: dict(tmax=U(26, 36), tmin=U(16, 26), rain=0.0, wind=U(4, 14), hum=U(40, 75), vis=U(5000, 10000),
                        pres=U(1004, 1014), snow=0.0, lightning=0.0, hail=0.0, river=None)
LOW_SEV = {"Hot Day", "Hot & Humid", "Warm Night", "Cold Day", "Fog", "Ground Frost", "Strong Surface Winds",
           "Dust-Raising Winds", "Thunderstorm", "Lightning"}

# ------------------------------------------------------------------ social-media text templates
T = {  # hazard -> (english[], hinglish[], hindi[])
"Heatwave": (["Heatwave alert in {place}! Mercury hits {tmax}°C, avoid going out between 12-4pm", "Unbearable heat wave at {place} today, {tmax} degrees and no relief", "Loo is back in {place}. {tmax}C at noon, roads empty"], ["{place} me bahut garmi hai, {tmax} degree, heatwave jaisa haal", "Garmi ne toh jaan nikal di {place} me, loo chal rahi hai"], ["{place} में भीषण गर्मी, तापमान {tmax} डिग्री, लू का प्रकोप"]),
"Heavy Rainfall": (["Heavy rainfall in {place} since morning, {rain} mm recorded, waterlogging in low areas", "Roads waterlogged after heavy rain at {place}, traffic crawling", "Continuous heavy rains in {place}, schools asked to close", "Match delayed at {place} stadium due to heavy rainfall, ground staff covering the pitch"], ["{place} me bhari barish ho rahi hai subah se, sadak pe paani bhar gaya"], ["{place} में भारी बारिश, कई इलाकों में जलभराव"]),
"Very Heavy Rainfall": (["Very heavy rainfall lashes {place}, {rain} mm in 24 hrs, IMD issues orange alert", "Torrential rain in {place}, visibility near zero, residents stuck indoors", "Non-stop downpour at {place}, {rain}mm overnight, drains overflowing"], ["{place} me bahut tez barish, {rain} mm, orange alert"], ["{place} में बहुत भारी बारिश, ऑरेंज अलर्ट जारी"]),
"Extremely Heavy Rainfall": (["Extremely heavy rainfall in {place}, {rain} mm in a day, red alert issued", "Cloudburst-like rain at {place}, {rain} mm, homes inundated", "Extreme rainfall emergency in {place}! Red alert, NDRF on standby"], ["{place} me ati bhari barish, red alert, {rain} mm record"], ["{place} में अत्यंत भारी बारिश, रेड अलर्ट"]),
"Cyclone": (["Cyclone approaching {place} coast, winds at {wind} kmph, fishermen asked to return", "Cyclonic storm landfall near {place}, trees uprooted, power lines down", "Cyclone warning for {state}: evacuation underway in {place}"], ["{place} me cyclone aa raha hai, hawa {wind} kmph, log shelter me"], ["{place} तट पर चक्रवात का खतरा, तेज हवाएं, लोगों को सुरक्षित स्थानों पर भेजा गया"]),
"Extreme Wind": (["Extremely violent winds of {wind} kmph hit {place}, hoardings collapsed", "Destructive gusts at {place}, roofs blown off, wind {wind} kmph", "Ferocious winds tearing through {place}, please stay inside"], ["{place} me tabahi wali hawa {wind} kmph, chhatein ud gayi"], ["{place} में विनाशकारी तेज हवाएं, होर्डिंग गिरे"]),
"Strong Surface Winds": (["Strong surface winds in {place} today, gusting {wind} kmph", "Very windy day at {place}, plastic flying around, {wind} km/h gusts", "Strong winds blowing across {place}, flights delayed"], ["{place} me aaj tez hawa chal rahi hai, {wind} kmph"], ["{place} में आज तेज सतही हवाएं"]),
"Flood": (["Flood situation grim in {place}, river above danger mark, villages submerged", "Flash flood in {place}! Water entering homes, rescue boats deployed", "Water everywhere in {place}, cars floating, need rescue help", "Flooding in {place} after overnight rain, NDRF rescuing families"], ["{place} me baadh aa gayi hai, gaon doob gaye, madad chahiye"], ["{place} में बाढ़ जैसे हालात, नदी खतरे के निशान के ऊपर"]),
"Thunderstorm": (["Thunderstorm hits {place} this evening, power cut across the area", "Dark clouds and loud thunder at {place}, gusty thunderstorm", "Thunderstorm with strong gusts in {place}, trees fell on the road"], ["{place} me aandhi aur thunderstorm, light chali gayi"], ["{place} में गरज के साथ तेज तूफान, बिजली गुल"]),
"Lightning": (["Lightning strikes in {place}, sky lit up all night", "Lightning struck a tree near {place}, terrifying flashes continue", "Frequent lightning over {place}, farmers warned to stay indoors"], ["{place} me aasman me bijli chamak rahi hai, bijli girne ka khatra"], ["{place} में आकाशीय बिजली गिरी, किसान सतर्क"]),
"Thunderstorm & Lightning": (["Thunderstorm and lightning together at {place}, heavy rain with frequent lightning", "Thunder, lightning and rain pounding {place} right now", "Severe thunderstorm with lightning in {place}, take shelter", "Cricket stopped, players off the field due to thunderstorm and lightning at {place}"], ["{place} me bijli chamak rahi hai aur gaj ke saath toofan, barish bhi"], ["{place} में बिजली कड़कने के साथ गरज और आंधी-तूफान"]),
"Hailstorm": (["Hailstorm in {place}! Ice balls of {hail} mm damaging crops", "Hail pelting {place}, car windshields cracked", "Hailstones fell across {place} this evening, farmers worried about standing crops"], ["{place} me ole gire, fasal kharab ho gayi"], ["{place} में ओलावृष्टि, फसलों को भारी नुकसान"]),
"Dust Storm": (["Massive dust storm hits {place}, visibility down to {vis} m", "Dust storm engulfs {place}, sky turned orange, can't see anything", "Severe dust storm in {place}, flights diverted, stay home"], ["{place} me dhool bhari aandhi, kuch dikh nahi raha"], ["{place} में धूल भरी आंधी, दृश्यता बेहद कम"]),
"Dust-Raising Winds": (["Dust raising winds across {place}, dusty haze everywhere", "Dusty winds blowing in {place}, eyes burning, {wind} kmph gusts", "Winds lifting loose dust in {place}, mild dust haze, drive carefully"], ["{place} me dhool udane wali hawa chal rahi hai"], ["{place} में धूल उड़ाने वाली हवाएं"]),
"Squall": (["Sudden squall at {place}, wind jumped to {wind} kmph in minutes", "Squall line crossing {place}, boats overturned, abrupt gusty winds", "Violent squall hit {place} without warning, hoardings down"], ["{place} me achanak tez hawa ka jhonka, squall jaisa"], ["{place} में अचानक तेज झोंकेदार हवा, स्क्वॉल"]),
"Hot Day": (["Hot day in {place}, {tmax}°C, much above normal", "Scorching day at {place}, {tmax} degrees by noon", "Temperature {tmax}°C in {place} today, hot and dry"], ["{place} me aaj bahut garam din, {tmax} degree"], ["{place} में आज गर्म दिन, तापमान {tmax} डिग्री"]),
"Hot & Humid": (["Hot and humid in {place}, {tmax}°C with {hum}% humidity, sweating all day", "Sticky humid heat at {place}, feels like {feels}°C", "Muggy weather in {place}, humidity {hum}%, AC not enough"], ["{place} me garmi aur umas, {hum}% humidity"], ["{place} में गर्मी और उमस से लोग बेहाल"]),
"Warm Night": (["Warm night in {place}, still {tmin}°C at midnight, can't sleep", "Hot sticky night at {place}, minimum temp {tmin}°C", "Nights are not cooling down in {place}, {tmin}°C at 2am"], ["{place} me raat bhi garam, {tmin} degree, neend nahi aa rahi"], ["{place} में रात का तापमान {tmin} डिग्री, गर्म रात"]),
"Cold Wave": (["Cold wave grips {place}, minimum {tmin}°C, shivering mornings", "Biting cold wave in {place}, {tmin} degrees, homeless suffering", "Cold wave alert in {place}, temperature dips to {tmin}°C"], ["{place} me shitlahar, {tmin} degree, thand se haal bura"], ["{place} में शीतलहर, न्यूनतम तापमान {tmin} डिग्री"]),
"Cold Day": (["Cold day in {place}, max only {tmax}°C and no sun", "Chilly cold day at {place}, sun hidden, maximum {tmax}°C", "Day temperature stuck at {tmax}°C in {place}, really cold day"], ["{place} me din bhar thand, dhoop nahi, max {tmax} degree"], ["{place} में ठंडा दिन, धूप नहीं, अधिकतम तापमान {tmax} डिग्री"]),
"Fog": (["Dense fog in {place}, visibility {vis} m, trains running late", "Thick fog blankets {place}, can't see beyond a few metres", "Fog chaos at {place}, flights delayed and highway accidents", "Match delayed because of dense fog at {place} ground"], ["{place} me ghana kohra, visibility {vis} meter, trains late"], ["{place} में घना कोहरा, दृश्यता {vis} मीटर"]),
"Ground Frost": (["Ground frost in {place} this morning, grass covered in white", "Frost on the ground at {place}, {tmin}°C, crops at risk", "White frost layer over fields in {place}, minimum {tmin}°C"], ["{place} me zameen par pala jam gaya, fasal ko khatra"], ["{place} में जमीन पर पाला, फसलों को नुकसान"]),
"Heavy Snowfall": (["Heavy snowfall in {place}, {snow} cm overnight, roads blocked", "Fresh heavy snow at {place}, highway closed, tourists stranded", "Snowfall continues in {place}, over {snow} cm, power lines down"], ["{place} me bhari barfbari, sadak band, {snow} cm"], ["{place} में भारी बर्फबारी, सड़कें बंद"]),
}
# More ways real people phrase the same event (still use hazard words, so the rule tagger can catch them).
EXTRA = {
"Heatwave": ["Loo ke thapede in {place}, {tmax}C and even night wont cool. Heat wave is real", "{place}: heat wave claims lives, hospitals report heatstroke cases, mercury {tmax}C", "Cant step outside in {place}, tar melting on road, heatwave day 3"],
"Hot Day": ["{place} hitting {tmax} today, proper hot day, fans on full", "Hot day in {place}. {tmax}C and not a breeze", "Garam din in {place}, {tmax} degree"],
"Hot & Humid": ["Hot and humid in {place} again, shirt drenched in 5 mins", "{place} humid af today, {hum}% humidity, power cut makes it worse", "Uff umas in {place}, {tmax} degree aur {hum}% humidity"],
"Warm Night": ["Warm night again in {place}, {tmin}C at 1am, AC running non stop", "Hot night at {place}, cant sleep, min temp {tmin}C"],
"Cold Wave": ["Cold wave in {place}, {tmin}C this morning, bonfires everywhere", "Shitlahar continues in {place}, {tmin} degree, schools shifted timings", "{place} shivering, cold wave alert, night shelters full"],
"Cold Day": ["Cold day in {place}, sun missing since morning, max {tmax}C", "Din bhar thand in {place}, sirf {tmax} degree, cold day"],
"Fog": ["Fog in {place} so thick, visibility {vis}m, flights diverted", "{place} expressway closed due to dense fog, pileup reported", "Kohra in {place}, gaadi chalana mushkil, visibility {vis} meter"],
"Ground Frost": ["Frost on cars and fields in {place}, {tmin}C overnight", "Pala pada hai {place} me, kheton me safedi, {tmin} degree"],
"Heavy Snowfall": ["Snowfall in {place} since last night, {snow} cm and counting, power cut", "Heavy snow at {place}, NH closed, tourists stuck in hotels", "Barfbari in {place}, {snow} cm, sadak band"],
"Heavy Rainfall": ["Heavy rain in {place} for 6 hrs now, {rain} mm, waterlogging near underpass", "Heavy rains lash {place}, offices asked to work from home", "{place} me bhari barish, {rain} mm, local trains slow"],
"Very Heavy Rainfall": ["Very heavy rain in {place}, {rain} mm, schools closed tomorrow", "Torrential rain since midnight in {place}, orange alert, underpasses flooded", "Bahut bhari barish {place} me, {rain} mm, log ghar me band"],
"Extremely Heavy Rainfall": ["Extremely heavy rain in {place}, {rain} mm, red alert, people on rooftops", "Cloudburst at {place}, {rain} mm in hours, NDRF called", "Ati bhari barish {place}, red alert, {rain} mm"],
"Cyclone": ["Cyclone landfall in {place} expected tonight, winds {wind} kmph, shelters open", "Cyclone update: {place} coast on high alert, ferries suspended", "Cyclone ke karan {place} me hawa {wind} kmph, bijli band"],
"Extreme Wind": ["Extreme winds in {place}, {wind} kmph, trees and poles down", "Destructive gusts hit {place}, sheds flew off, wind {wind} kmph"],
"Strong Surface Winds": ["Strong winds in {place} since afternoon, {wind} kmph gusts", "Very windy in {place}, dust in eyes, {wind} kmph", "Tez hawa chal rahi {place} me, {wind} kmph"],
"Flood": ["Flood water entering homes in {place}, rescue boats deployed, river above danger mark", "Flood alert for {place}: embankment breached, villages submerged", "Baadh ka pani {place} me ghus gaya, rescue boat chahiye"],
"Thunderstorm": ["Thunderstorm in {place}, trees down, power cut, {wind} kmph gusts", "Thunder and gusty thunderstorm over {place}, evening commute hit", "Aandhi toofan with thunder in {place}, light gayab"],
"Lightning": ["Lightning killed two farmers near {place}, villagers shaken", "Lightning flashes all over {place} sky, frequent strikes", "Bijli girne se {place} me gaay ki maut, lightning ka khatra"],
"Thunderstorm & Lightning": ["Thunderstorm and lightning over {place}, heavy rain, power cut", "Thunder lightning rain together in {place}, stay indoors", "{place} me gaj ke saath bijli chamak rahi hai aur thunderstorm"],
"Hailstorm": ["Hailstorm in {place}, hail size of marbles ({hail} mm), crops flattened", "Hail pelted {place} for 10 mins, rooftops dented", "Ole gire {place} me, fasal barbad"],
"Dust Storm": ["Dust storm in {place}, sky turned brown, visibility {vis} m", "Dust storm warning: {place} under thick dust, trains stopped", "Dhool bhari aandhi in {place}, kuch dikh nahi raha"],
"Dust-Raising Winds": ["Dust raising winds in {place}, dusty haze all day, {wind} kmph", "Dusty winds again in {place}, cars covered in dust"],
"Squall": ["Squall hit {place} suddenly, {wind} kmph gusts, boats tossed", "Squall at {place}, tin roofs flying, sudden gusty winds"],
}
# Posts that describe the event WITHOUT any hazard keyword -> the rule tagger cannot label them; an ML model has to.
INDIRECT = {
"Heatwave": ["Car thermometer showing {tmax}C in {place}, nobody on the roads at noon, cattle collapsing", "{place} feels like an oven. {tmax} degrees, hospital OPD full of sunstroke cases"],
"Hot Day": ["{tmax}C in {place} today, sweating through the shirt by 10am", "{place} is baking, {tmax} degrees and the fan just blows hot air"],
"Hot & Humid": ["{place}: {tmax}C with {hum}% air moisture, clothes never dry, constant sweat", "Sweating even in the shade at {place}, {hum}% air moisture"],
"Warm Night": ["Cant sleep, {tmin}C at midnight in {place}, pillows are hot", "Even at 2am it is {tmin} degrees in {place}, terrace full of people"],
"Cold Wave": ["{place} at {tmin}C, people burning tyres for warmth, rickshaw pullers in shawls", "Hands numb in {place}, {tmin} degrees, shelters full tonight"],
"Cold Day": ["No sun in {place} all day, stuck at {tmax}C, everybody wearing sweaters at noon", "Gloomy and freezing in {place}, {tmax} degree even at 2pm"],
"Fog": ["Cant see the car ahead in {place}, visibility {vis} m, trains running 4 hrs late", "Headlights on at 10am in {place}, white wall on the highway, {vis} meter visibility"],
"Ground Frost": ["White layer on the fields in {place}, {tmin}C, potato crop at risk", "Water pipes frozen in {place} this morning, {tmin} degrees, car windows iced"],
"Heavy Snowfall": ["Roads buried under {snow} cm white in {place}, tourists stuck in hotels", "Waking up to {snow} cm of white outside in {place}, highway shut, no electricity"],
"Heavy Rainfall": ["Water up to ankle on {place} main road, buses crawling, {rain} mm in the gauge", "Left office at 6, still stuck in {place}, roads are rivers, {rain} mm since noon"],
"Very Heavy Rainfall": ["Roads are rivers in {place}, {rain} mm since midnight, two wheelers abandoned", "Sky opened up over {place}, {rain} mm since night, drains gurgling over"],
"Extremely Heavy Rainfall": ["Never seen water like this in {place}, {rain} mm, houses cut off, calls for help everywhere", "Whole street under water in {place}, {rain} mm overnight, NDRF boats are on the way"],
"Cyclone": ["Whole coast of {place} being evacuated, winds {wind} kmph, sea is roaring, fishing boats pulled in", "Sea has swallowed the beach road at {place}, {wind} kmph, shelters open, NDRF at the coast"],
"Extreme Wind": ["Roofs ripped off in {place}, {wind} kmph, hoarding fell on parked cars", "{wind} kmph winds in {place} snapped poles like twigs, whole colony without light"],
"Strong Surface Winds": ["Windy in {place}, {wind} kmph, scooters struggling on the bridge", "Flags and banners flying sideways in {place}, {wind} kmph"],
"Flood": ["Water in our ground floor in {place}, cars floating down the lane, need rescue", "Whole village marooned near {place}, boats rescuing people, river over the bank"],
"Thunderstorm": ["Sky turned black and loud booms over {place}, branches down, power gone", "Sudden dark sky, strong gusts and big booms in {place}, power cut on the whole street"],
"Lightning": ["Sky lit up purple over {place} all night, farm worker struck near the pond", "Huge flashes near {place}, transformer blasted, two cows dead in the field"],
"Thunderstorm & Lightning": ["Booming sky, flashes and downpour over {place}, power cut, take cover", "Black clouds, flashes and loud booms with rain over {place}, power off since 7"],
"Hailstorm": ["Ice pellets {hail} mm falling on {place}, windshields cracked, crops battered", "White balls of ice pounding the roof in {place}, mango crop damaged"],
"Dust Storm": ["Orange sky in {place}, visibility {vis} m, cant breathe, eyes burning, trains halted", "Brown wall of dust rolled across {place}, visibility {vis} m, lights on at 4pm"],
"Dust-Raising Winds": ["Grit in the air and on every surface in {place}, {wind} kmph breeze, cars coated", "Fine dust flying everywhere in {place} since morning, {wind} kmph, eyes watery"],
"Squall": ["Out of nowhere a violent gust hit {place}, {wind} kmph, fishing boats tossed", "Sudden violent jolt of wind at {place}, {wind} kmph, shop signs crashing"],
}
# Awkward-but-real phrasings: vague, sarcastic, a question, a forecast share, a mixed-hazard report.
HARD = [
    "Is it just me or is {place} having {hz} right now?", "Lovely {hz} in {place}, exactly what I needed today 🙄",
    "IMD says {hz} likely over {place} next 48 hrs, be careful everyone", "{hz} in {place} and {hz2} too. What is going on with the weather",
    "Heard there is {hz} in {place}, anyone confirm?", "Reports of {hz} from {place}, authorities have not confirmed yet",
    "{place} feels like {hz} today honestly", "Just crossed {place}, {hz} for sure, pls stay safe",
]
HARD_NEG = [   # weather words, but nothing is happening -> should be rejected by the relevance filter
    "Planning a trip to {place} next week, hope the weather is good", "Monsoon is my favourite season, chai and pakoda time ☕",
    "Weather app says normal day in {place}, nothing to worry about", "Which umbrella should I buy for the rainy season?",
    "Throwback to the 2018 floods, we have come a long way as a state", "Winter collection launch in {place} this weekend, sweaters and jackets",
    "Heat pump or AC? Need advice for my new flat in {place}", "Beautiful sunset in {place} today, no clouds anywhere 🌅",
]
NEIGHBOUR = {   # hazards a tired annotator could mix up
    "Heavy Rainfall": ["Very Heavy Rainfall"], "Very Heavy Rainfall": ["Heavy Rainfall", "Extremely Heavy Rainfall"],
    "Extremely Heavy Rainfall": ["Very Heavy Rainfall"], "Thunderstorm": ["Thunderstorm & Lightning"], "Lightning": ["Thunderstorm & Lightning"],
    "Thunderstorm & Lightning": ["Thunderstorm", "Lightning"], "Hot Day": ["Heatwave"], "Heatwave": ["Hot Day"],
    "Cold Wave": ["Cold Day"], "Cold Day": ["Cold Wave"], "Dust Storm": ["Dust-Raising Winds"], "Dust-Raising Winds": ["Dust Storm"],
    "Strong Surface Winds": ["Extreme Wind"], "Extreme Wind": ["Strong Surface Winds", "Squall"], "Squall": ["Extreme Wind"],
    "Hot & Humid": ["Hot Day"], "Warm Night": ["Hot & Humid"],
}
LABEL_NOISE = .02
SMS = {"please": "pls", "heavy": "hvy", "tomorrow": "tmrw", "people": "ppl", "because": "bcoz", "continues": "contd", "today": "2day"}
LANDMARKS = ["near the main market", "near railway station", "near bus stand", "in the old city", "near the highway",
             "near the airport road", "near the river bridge", "near the central hospital", "in the colony area"]
TAILS = ["Stay safe everyone.", "Authorities please act.", "Situation getting worse.", "Please avoid travel.",
         "Kids stuck at school.", "No help yet.", "Local admin informed.", "Unreal scenes here.", "Never seen this before."]
PREFIXES = ["Update:", "Now:", "Just now:", "Ground report:", "Live:"]
HAZ_EMOJI = ["🌧️", "⚠️", "🔥", "🌪️", "❄️", "⚡", "🌫️", "😰", "🙏"]

IRRELEVANT = [
    "Cyclone is the name of my new playlist 🎶 go stream it", "IND vs AUS match today, what a thunder of a six by Kohli! 🏏 #cricket",
    "Just watched the movie Flood, honestly a storm of emotions", "My ex is a hurricane, I am done lol",
    "Hot take: pineapple on pizza is fine", "Cold coffee at {place} cafe is the best, must try",
    "Lightning McQueen is my kid's favourite, Cars 3 marathon tonight", "Sensex crashes, market in a fog of uncertainty #stocks",
    "Political storm in parliament over new bill, opposition walks out", "Fog of War game new season is out, new maps",
    "Heat (1995) is still the best crime film, rewatching tonight", "New song 'Barish' by Arijit is trending, lyrics are fire 🎧",
    "Best biryani in {place}, you must try, 10/10", "Good morning friends from {place}, have a nice day 🌞",
    "{place} traffic is insane today, 2 hours stuck on the flyover", "आज की फिल्म की समीक्षा, तूफ़ान जैसी एक्शन",
    "Aaj ka match dekha? Dhoni ne toofani batting ki 🏏", "Tufan movie ka trailer aa gaya, Shah Rukh ki entry 🔥",
    "New phone launch in {place} next week, pre-orders open", "Flood of memories coming back after school reunion ❤️",
    "Winter is coming, new web series episode drops tonight", "Squall is such a cool nickname, my cousin calls himself that lol",
    "Exam results out, my heart is on fire 🔥🔥", "Thunder bolt striker wins the final, what a game on PS5",
]
SPAM = [
    "🎁 WIN a FREE iPhone 15! Click here bit.ly/{r} limited offer!!!", "Earn ₹5000 daily working from home. WhatsApp +91 {phone} now",
    "Heavy rain offer! Buy raincoats at 70% OFF, click bit.ly/{r} 🌧️🌧️", "Instant loan approved in 5 mins no documents, apply tinyurl.com/{r}",
    "Follow back / follow for follow 🔥🔥 #followforfollow #like4like #f4f #instagood #love", "Bitcoin to the moon!!! Join our crypto signals group t.me/{r}",
    "Summer SALE! AC cooler fan 50% off — use promo code HEAT50, buy now", "Check my profile for hot videos 18+ DM for more",
    "Lucky draw winner! Claim your jackpot prize now http://rb.gy/{r}", "Weather alert: Your account has been compromised, verify now at http://bit.ly/{r}",
    "Free recharge Jio Airtel 599 plan click link cutt.ly/{r}", "Cyclone Casino bonus 200% deposit, bet now!!! bit.ly/{r}",
    "FLOOD OF DISCOUNTS!!! Winter sale 60% off, limited offer, whatsapp {phone}", "Make money online earn lakhs from home, DM for details 💰💰💰",
]
SOURCES = {"twitter_x": .35, "facebook": .15, "news_portal": .15, "citizen_app": .20, "whatsapp_forward": .10, "youtube_comment": .05}
GEO_TAG_P = {"citizen_app": .9, "news_portal": .8, "twitter_x": .5, "facebook": .5, "whatsapp_forward": .3, "youtube_comment": .2}

# ------------------------------------------------------------------ helpers
def jit(v, pct):
    return None if v is None else v * (1 + random.uniform(-pct, pct))


def severity_for(h, m):
    if h in ("Heavy Rainfall",): return "Yellow" if m["rain"] < 90 else "Orange"
    if h == "Very Heavy Rainfall": return "Orange" if m["rain"] < 160 else "Red"
    if h == "Extremely Heavy Rainfall": return "Red"
    if h == "Heatwave": return "Red" if m["tmax"] >= 45 else "Orange" if m["tmax"] >= 43 else "Yellow"
    if h == "Cyclone": return "Red" if m["wind"] >= 118 else "Orange" if m["wind"] >= 88 else "Yellow"
    if h in LOW_SEV: return random.choices(["Green", "Yellow", "Orange"], [.1, .7, .2])[0]
    return random.choices(["Yellow", "Orange", "Red"], [.5, .35, .15])[0]


def centre_for(lat, lon):
    if lon > 90: return "RMC Guwahati"
    if lat > 28 or (lon < 76 and lat > 24): return "RMC New Delhi"
    if lon > 85 and lat > 21: return "RMC Kolkata"
    if lat < 16: return "RMC Chennai"
    if lon < 75: return "RMC Mumbai"
    return "RMC Nagpur"


def make_events(n):
    hz = list(HAZARDS) * 10
    weights = [SPECS[h][0] for h in HAZARDS]
    hz += random.choices(HAZARDS, weights, k=max(0, n - len(hz)))
    random.shuffle(hz)
    events = []
    for i, h in enumerate(hz[:n], 1):
        _, months, states, gen = SPECS[h]
        state = random.choice(states)
        district = random.choice(list(GEO[state]))
        m = DEFAULTS(); m.update(gen())
        m["tmax"] = max(m["tmax"], m["tmin"] + U(3, 9))   # day max must exceed night min
        month = random.choice(months)
        year = random.choice([2022, 2023, 2024, 2025])
        start = datetime(year, month, random.randint(1, 28), random.randint(0, 23), random.choice([0, 15, 30, 45]), tzinfo=IST)
        events.append(dict(event_id=f"EVT-{i:05d}", hazard=h, state=state, district=district, start=start, m=m))
    return events


def spread(n_total, n_events, cap=12):
    """>=1 record per event, rest distributed with a heavy tail (a few big events)."""
    w = [min(random.paretovariate(1.4), cap) for _ in range(n_events)]
    extra = random.choices(range(n_events), w, k=max(0, n_total - n_events))
    counts = [1] * n_events
    for e in extra: counts[e] += 1
    return counts


# ---- messy formatters
def fmt_ts(dt, style=None):
    style = style or random.choices(["iso", "dmy", "long", "epoch"], [.6, .2, .15, .05])[0]
    if style == "iso": return dt.astimezone(IST).isoformat(timespec="seconds")
    if style == "dmy": return dt.astimezone(IST).strftime("%d-%m-%Y %H:%M")
    if style == "long": return dt.astimezone(IST).strftime("%d %b %Y %H:%M") + " IST"
    return str(int(dt.timestamp()))


def fmt_metric(v, kind, messy):
    if v is None: return ""
    if random.random() < .04: return ""   # missing value
    if not messy: return f"{v:.1f}"
    if kind == "temp": return random.choice([f"{v:.1f} °C", f"{v * 9 / 5 + 32:.1f} F", f"{v:.1f}C"])
    if kind == "rain": return random.choice([f"{v:.1f}mm", f"{v / 10:.2f} cm", f"{v:.1f} mm"])
    if kind == "wind": return random.choice([f"{v:.0f} kmph", f"{v / 1.852:.0f} kt", f"{v / 3.6:.1f} m/s"])
    return f"{v:.1f}"


def typo(s):
    """Swap two letters, drop one, or double one."""
    if len(s) < 8: return s
    i = random.randint(1, len(s) - 3)
    kind = random.choice(["swap", "drop", "double"])
    if kind == "swap": return s[:i] + s[i + 1] + s[i] + s[i + 2:]
    if kind == "drop": return s[:i] + s[i + 1:]
    return s[:i] + s[i] + s[i:]


def rand_handle():
    return "@" + random.choice(["weather", "desi", "city", "news", "citizen", "rahul", "priya", "amit", "neha", "kolkata", "mumbai", "bharat"]) + \
        random.choice(["_", "", "."]).replace(".", "") + str(random.randint(1, 99999))


# ------------------------------------------------------------------ IMD rows
def imd_row(ev, rtype, state=None, district=None):
    state = state or ev["state"]
    if district is None:
        district = ev["district"] if (state == ev["state"] and random.random() < .7) else random.choice(list(GEO[state]))
    lat, lon = GEO[state][district]
    pct = .05 if rtype == "observation" else .15
    m = {k: (v if k == "river" else jit(v, .003) if k == "pres" else jit(v, pct)) for k, v in ev["m"].items()}
    for k in ("hum",): m[k] = min(100, m[k])
    for k in ("rain", "wind", "snow", "hail", "lightning", "vis"):
        if m.get(k) is not None and m[k] < 0: m[k] = 0
    valid = ev["start"] + timedelta(minutes=random.randint(-30, 180))
    issued = valid + timedelta(minutes=random.randint(0, 120)) if rtype == "observation" else valid - timedelta(hours=U(3, 48))
    sev = severity_for(ev["hazard"], m)
    h = ev["hazard"]
    messy = random.random() < .12
    hz_txt = h if random.random() < .9 else random.choice([a for a, c in HAZARD_ALIASES.items() if c == h]).title()
    if random.random() < .03: hz_txt = hz_txt.upper()
    state_txt = state
    if random.random() < .04: state_txt = {"Odisha": "Orissa", "Uttar Pradesh": "UP", "West Bengal": "WB", "Tamil Nadu": "TN", "Jammu and Kashmir": "J&K", "Madhya Pradesh": "MP"}.get(state, state)
    dist_txt = district
    if random.random() < .04:
        for alias, canon in DISTRICT_ALIASES.items():
            if canon == district: dist_txt = alias.title(); break
    desc = f"{h} {'observed' if rtype == 'observation' else 'likely'} over {district}, {state}. {sev} category."
    if m["rain"] and m["rain"] > 1: desc += f" Rainfall {m['rain']:.0f} mm/24h."
    if h in ("Heatwave", "Hot Day", "Warm Night", "Cold Wave", "Cold Day", "Ground Frost"): desc += f" Tmax {m['tmax']:.1f}C Tmin {m['tmin']:.1f}C."
    if m["wind"] > 28: desc += f" Winds {m['wind']:.0f} kmph."
    r = dict(
        record_id="", event_id=ev["event_id"], source="IMD", record_type=rtype,
        bulletin_no=f"IMD/{centre_for(lat, lon)[4:7].upper()}/{valid.year}/{random.randint(1, 99999):05d}",
        issued_at=fmt_ts(issued), valid_at=fmt_ts(valid), state=state_txt, district=dist_txt,
        latitude=f"{lat + U(-.08, .08):.4f}" if random.random() > .05 else "",
        longitude=f"{lon + U(-.08, .08):.4f}" if random.random() > .05 else "",
        hazard_type=hz_txt, severity=sev if random.random() > .1 else random.choice([sev.upper(), sev.lower() + " alert"]),
        temp_max_c=fmt_metric(m["tmax"], "temp", messy), temp_min_c=fmt_metric(m["tmin"], "temp", messy),
        rainfall_mm_24h=fmt_metric(m["rain"], "rain", messy), wind_speed_kmph=fmt_metric(m["wind"], "wind", messy),
        humidity_pct=fmt_metric(m["hum"], "x", False), visibility_m=fmt_metric(m["vis"], "x", False),
        pressure_hpa=fmt_metric(m["pres"], "x", False), snowfall_cm=fmt_metric(m["snow"], "x", False),
        lightning_strikes_hr=fmt_metric(m["lightning"], "x", False), hail_size_mm=fmt_metric(m["hail"], "x", False),
        river_level_above_danger_m=fmt_metric(m["river"], "x", False) if m["river"] is not None else "",
        description=desc, issuing_centre=centre_for(lat, lon), _gt_noise="",
    )
    if random.random() < .01:  # physically impossible value
        bad = random.choice([("humidity_pct", "134"), ("rainfall_mm_24h", "-12"), ("temp_max_c", "99.9"), ("wind_speed_kmph", "999")])
        r[bad[0]] = bad[1]; r["_gt_noise"] = "invalid_value"
    return r


def build_imd(events, n_total):
    n_dup = round(n_total * .03)
    counts = spread(n_total - n_dup, len(events))
    rows = []
    for ev, c in zip(events, counts):
        for _ in range(c):
            rows.append(imd_row(ev, random.choices(["observation", "warning"], [.65, .35])[0]))
    originals = [r for r in rows if r["_gt_noise"] == ""]
    for _ in range(n_dup):  # bulletin re-sent: same content, different formatting / bulletin number
        o = random.choice(originals)
        d = dict(o)
        # identical timestamps/values; only the bulletin number and casing differ
        d["bulletin_no"] = o["bulletin_no"][:-5] + f"{random.randint(1, 99999):05d}"
        d["hazard_type"] = o["hazard_type"].upper() if random.random() < .5 else o["hazard_type"]
        d["_gt_noise"] = "duplicate"; d["_orig"] = o
        rows.append(d)
    random.shuffle(rows)
    return number(rows, "IMD")


def number(rows, prefix):
    """Assign record ids, then record which row each duplicate was copied from (evaluation only)."""
    for i, r in enumerate(rows, 1): r["record_id"] = f"{prefix}-{i:06d}"
    for r in rows:
        o = r.pop("_orig", None); r["_gt_dup_of"] = o["record_id"] if o else ""
    return rows


# ------------------------------------------------------------------ public rows
def pick_place(ev):
    state = ev["state"]
    d = ev["district"] if random.random() < .75 else random.choice(list(GEO[state]))
    shown = d
    if random.random() < .08:
        for alias, canon in DISTRICT_ALIASES.items():
            if canon == d: shown = alias.title(); break
    return state, d, shown


def public_text(ev, source, place_shown, state):
    h = ev["hazard"]
    en, hing, hi = T[h]
    lang = random.choices(["en", "hing", "hi"], [.6, .25, .15])[0]
    roll = random.random()
    if roll < .12: tpl = random.choice(INDIRECT[h])            # no hazard keyword: only ML can label these
    elif roll < .20: tpl = random.choice(HARD)                  # vague / sarcastic / question / forecast / mixed
    elif roll < .45: tpl = random.choice(EXTRA[h])
    else: tpl = random.choice({"en": en, "hing": hing, "hi": hi}[lang])
    m = {k: jit(v, .08) for k, v in ev["m"].items() if v is not None}
    loc = place_shown + (" " + random.choice(LANDMARKS) if random.random() < .6 else "")
    plain = lambda x: x.lower().replace("&", "and").replace("-", " ")
    text = tpl.format(place=loc, state=state, hz=plain(h), hz2=plain(random.choice(NEIGHBOUR.get(h) or [h])),
                      tmax=f"{m['tmax']:.1f}", tmin=f"{m['tmin']:.1f}", rain=f"{m['rain']:.0f}",
                      wind=f"{m['wind']:.0f}", vis=f"{m['vis']:.0f}", snow=f"{m['snow']:.0f}", hail=f"{m['hail']:.0f}",
                      hum=f"{min(100, m['hum']):.0f}", feels=f"{m['tmax'] + (m['hum'] - 40) * .1:.0f}")
    if random.random() < .3: text = random.choice(PREFIXES) + " " + text
    if random.random() < .5: text += " " + random.choice(TAILS)
    if random.random() < .25: text += " " + random.choice(HAZ_EMOJI)
    if random.random() < .3: text += " #" + h.replace(" ", "").replace("&", "And").replace("-", "") + random.choice(["", " #IMD", " #Weather"])
    if random.random() < .08: text = typo(text)
    if random.random() < .06: text = " ".join(SMS.get(w.lower(), w) for w in text.split())
    if random.random() < .03: text = text.upper()
    if source == "news_portal": text = random.choice(["BREAKING: ", "", ""]) + text + random.choice([" | Staff Reporter", " | Our Bureau", ""])
    elif source == "whatsapp_forward": text = "Forwarded many times: " + text + " Please share to all 🙏"
    elif source == "youtube_comment": text = text.lower()
    return text


def public_row(ev, source=None):
    source = source or random.choices(list(SOURCES), list(SOURCES.values()))[0]
    state, d, shown = pick_place(ev)
    text = public_text(ev, source, shown, state)
    lat, lon = GEO[state][d]
    posted = ev["start"] + timedelta(hours=min(random.expovariate(1 / .7), 18))
    tag = random.random() < GEO_TAG_P[source]
    has_geo = (source == "citizen_app" and random.random() < .8) or (source == "twitter_x" and random.random() < .15)
    la, lo = (lat + U(-.05, .05), lon + U(-.05, .05)) if has_geo else (None, None)
    if has_geo and random.random() < .015: la, lo = random.choice([(0.0, 0.0), (lo, la)])  # garbage coordinates
    ts_style = "twitter" if source == "twitter_x" and random.random() < .5 else None
    ts = posted.astimezone(timezone.utc).strftime("%a %b %d %H:%M:%S +0000 %Y") if ts_style else fmt_ts(posted)
    label = ev["hazard"]
    if random.random() < LABEL_NOISE and label in NEIGHBOUR: label = random.choice(NEIGHBOUR[label])   # annotator mix-up
    return dict(
        record_id="", event_id=ev["event_id"], source=source, source_handle=rand_handle(), posted_at=ts, text=text,
        state=state if tag else "", district=shown if tag and random.random() < .8 else "",
        latitude=f"{la:.5f}" if la is not None else "", longitude=f"{lo:.5f}" if lo is not None else "",
        followers=int(random.lognormvariate(6, 2)), likes=int(random.expovariate(1 / 8)), shares=int(random.expovariate(1 / 3)),
        has_media=int(random.random() < (.4 if source == "citizen_app" else .15)), hazard_label=label, _gt_hazard=ev["hazard"], _gt_noise="", _dt=posted,
    )


def noise_row(kind):
    when = datetime(random.choice([2022, 2023, 2024, 2025]), random.randint(1, 12), random.randint(1, 28), random.randint(0, 23), random.randint(0, 59), tzinfo=IST)
    st = random.choice(list(GEO)); d = random.choice(list(GEO[st]))
    tpl = random.choice(SPAM if kind == "spam" else IRRELEVANT + HARD_NEG)
    text = tpl.format(r="".join(random.choices("abcdefghjkmnpqrstuvwxyz23456789", k=6)), phone=f"9{random.randint(100000000, 999999999)}", place=d)
    source = random.choices(list(SOURCES), list(SOURCES.values()))[0]
    spam = kind == "spam"
    return dict(
        record_id="", event_id="", source=source, source_handle=rand_handle(), posted_at=fmt_ts(when), text=text,
        state=st if random.random() < .3 else "", district="", latitude="", longitude="",
        followers=int(random.lognormvariate(2.5, 1.2)) if spam else int(random.lognormvariate(6, 2)),
        likes=int(random.expovariate(1 / 3)), shares=int(random.expovariate(1 / 150)) if spam else int(random.expovariate(1 / 3)),
        has_media=int(random.random() < .1), hazard_label="", _gt_hazard="", _gt_noise=kind,
    )


def make_dup(o):
    d = dict(o)
    kind = random.choice(["exact", "repost", "near"])
    d["source_handle"] = o["source_handle"] if kind == "exact" else rand_handle()
    if kind == "repost":
        if o["source"] == "twitter_x": d["text"] = f"RT {o['source_handle']}: " + o["text"]
        else: d["text"] = "Forwarded many times: " + o["text"] + " pls share"
        if random.random() < .4: d["text"] = d["text"] + " " + random.choice(HAZ_EMOJI)
    elif kind == "near":
        words = o["text"].split()
        if len(words) > 4: words.insert(random.randint(1, len(words) - 1), random.choice(["urgent", "again", "very", "still"]))
        d["text"] = " ".join(words)
        if random.random() < .5: d["text"] = typo(d["text"])
    d["_gt_noise"] = f"duplicate_{kind}"; d["_orig"] = o
    # posted slightly later than the original
    d["_dt"] = o["_dt"] + timedelta(minutes=random.randint(1, 90))
    d["posted_at"] = fmt_ts(d["_dt"], "iso")
    return d


def build_public(events, n_total):
    n_spam, n_irr, n_dup = round(n_total * .06), round(n_total * .07), round(n_total * .10)
    n_gen = n_total - n_spam - n_irr - n_dup
    counts = spread(n_gen, len(events), cap=20)
    rows, seen = [], set()
    for ev, c in zip(events, counts):
        for _ in range(c):
            for _try in range(10):          # genuine posts must be textually distinct
                r = public_row(ev); key = clean_text(r["text"])["text_norm"]
                if key not in seen: break
            seen.add(key); rows.append(r)
    genuine = list(rows)
    rows += [make_dup(random.choice(genuine)) for _ in range(n_dup)]
    rows += [noise_row("spam") for _ in range(n_spam)] + [noise_row("irrelevant") for _ in range(n_irr)]
    random.shuffle(rows)
    for r in rows: r.pop("_dt", None)
    return number(rows, "PUB")


def write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    print(f"wrote {len(rows):>5} rows -> {path}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--total", type=int, default=5000, help="total raw rows (IMD 40%% / public 60%%)")
    ap.add_argument("--events", type=int, default=700)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="data")
    a = ap.parse_args()
    random.seed(a.seed)
    os.makedirs(a.out, exist_ok=True)
    n_imd = round(a.total * .4)
    events = make_events(a.events)
    write_csv(os.path.join(a.out, "imd_records.csv"), build_imd(events, n_imd))
    write_csv(os.path.join(a.out, "public_records.csv"), build_public(events, a.total - n_imd))
