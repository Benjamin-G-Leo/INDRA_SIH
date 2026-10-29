import type { Incident, Alert } from './types'



export const lifecycle = ['Detected', 'Verified', 'Acknowledged', 'Assigned', 'Responding', 'Resolved'] as const



export const incidents: Incident[] = [

  {

    id: 1,

    event: 'Heatwave',

    name: 'Delhi NCR Heatwave',

    place: 'Delhi NCR',

    state: 'Delhi',

    district: 'Central Delhi',

    severity: 'critical',

    value: '45.2°C',

    source: 'IMD API',

    reports: 231,

    confidence: 96,

    consensus: 'High',

    independentSources: '4 / 5',

    status: 'Responding',

    impact: '12.4M residents · 84 hospitals · 3,120 km²',

    lat: 28.6139,

    lng: 77.2090,

    time: '41 min ago',

    alertText: 'Maximum temperature 6°C above seasonal average.',

    areaAffected: {

      area: '3,120 km²',

      population: '12.4M',

      hospitals: '84 hospitals',

      schools: '42 schools',

      roads: '8 major highways',

      infrastructure: '12 substations, 3 power plants',

      districts: '11 districts',

    },

    evidence: [

      { name: 'IMD API', status: 'verified' },

      { name: 'Satellite / sensor', status: 'verified' },

      { name: 'Citizen reports', status: 'verified' },

      { name: 'Public posts', status: 'pending' },

    ],

  },

  {

    id: 2,

    event: 'Heavy Rainfall',

    name: 'Bengaluru Urban Flooding',

    place: 'Bengaluru',

    state: 'Karnataka',

    district: 'Bengaluru Urban',

    severity: 'high',

    value: '142 mm',

    source: 'Citizen reports',

    reports: 148,

    confidence: 92,

    consensus: 'High',

    independentSources: '4 / 5',

    status: 'Acknowledged',

    impact: '2.1M residents · 18 transit corridors · 640 km²',

    lat: 12.9716,

    lng: 77.5946,

    time: '8 min ago',

    alertText: 'Urban flooding reported across 6 districts. 142 mm rainfall recorded.',

    areaAffected: {

      area: '640 km²',

      population: '2.1M',

      hospitals: '18 hospitals',

      schools: '67 schools',

      roads: '18 transit corridors',

      infrastructure: '6 drainage pumps, 2 metro lines',

      districts: '6 districts',

    },

    evidence: [

      { name: 'Citizen reports', status: 'verified' },

      { name: 'Weather API', status: 'verified' },

      { name: 'Public posts', status: 'verified' },

      { name: 'Government API', status: 'pending' },

    ],

  },

  {

    id: 3,

    event: 'Cyclone',

    name: 'Odisha Coast Cyclone',

    place: 'Odisha Coast',

    state: 'Odisha',

    district: 'Puri',

    severity: 'critical',

    value: '118 km/h',

    source: 'Satellite feed',

    reports: 392,

    confidence: 97,

    consensus: 'High',

    independentSources: '5 / 5',

    status: 'Verified',

    impact: '4.8M residents · 126 shelters · 14 coastal blocks',

    lat: 19.8135,

    lng: 85.8312,

    time: '14 min ago',

    alertText: 'Severe cyclonic storm moving north-west. Coastal evacuation advised.',

    areaAffected: {

      area: '14 coastal blocks',

      population: '4.8M',

      hospitals: '32 hospitals',

      schools: '126 schools (shelters)',

      roads: '4 national highways',

      infrastructure: '2 ports, 14 coastal blocks',

      districts: '14 districts',

    },

    evidence: [

      { name: 'Satellite / sensor', status: 'verified' },

      { name: 'IMD API', status: 'verified' },

      { name: 'Government API', status: 'verified' },

      { name: 'Citizen reports', status: 'verified' },

      { name: 'Public posts', status: 'verified' },

    ],

  },

  {

    id: 4,

    event: 'Extreme Wind',

    name: 'Rajasthan Windstorm',

    place: 'Rajasthan',

    state: 'Rajasthan',

    district: 'Jaisalmer',

    severity: 'moderate',

    value: '72 km/h',

    source: 'Weather API',

    reports: 62,

    confidence: 88,

    consensus: 'Medium',

    independentSources: '3 / 5',

    status: 'Detected',

    impact: '410k residents · 12 substations · 890 km²',

    lat: 26.9155,

    lng: 70.9083,

    time: '1 hr ago',

    alertText: 'High-velocity winds across desert districts. Structural damage risk.',

    areaAffected: {

      area: '890 km²',

      population: '410k',

      hospitals: '6 hospitals',

      schools: '23 schools',

      roads: '3 state highways',

      infrastructure: '12 substations, 4 wind farms',

      districts: '3 districts',

    },

    evidence: [

      { name: 'Weather API', status: 'verified' },

      { name: 'Satellite / sensor', status: 'verified' },

      { name: 'Public posts', status: 'pending' },

    ],

  },

  {

    id: 5,

    event: 'Flood',

    name: 'Siliguri Flood',

    place: 'Siliguri, West Bengal',

    state: 'West Bengal',

    district: 'Darjeeling',

    severity: 'high',

    value: 'Alert level 3',

    source: 'Public posts',

    reports: 186,

    confidence: 91,

    consensus: 'High',

    independentSources: '4 / 5',

    status: 'Assigned',

    impact: '1.6M residents · 42 schools · 1,200 km²',

    lat: 26.7271,

    lng: 88.3953,

    time: '26 min ago',

    alertText: 'River levels above danger mark near low-lying settlements.',

    areaAffected: {

      area: '1,200 km²',

      population: '1.6M',

      hospitals: '14 hospitals',

      schools: '42 schools',

      roads: 'NH-31, NH-10, 6 state roads',

      infrastructure: '2 railway junctions, 1 airport',

      districts: '4 districts',

    },

    evidence: [

      { name: 'Public posts', status: 'verified' },

      { name: 'Government API', status: 'verified' },

      { name: 'Citizen reports', status: 'verified' },

      { name: 'Satellite / sensor', status: 'pending' },

    ],

  },

  {

    id: 6,

    event: 'Thunderstorm',

    name: 'Maharashtra Thunderstorm',

    place: 'Maharashtra',

    state: 'Maharashtra',

    district: 'Pune',

    severity: 'low',

    value: '64 strikes/hr',

    source: 'Lightning API',

    reports: 44,

    confidence: 84,

    consensus: 'Medium',

    independentSources: '3 / 5',

    status: 'Detected',

    impact: '280k residents · 9 substations · 320 km²',

    lat: 18.5204,

    lng: 73.8567,

    time: '2 hr ago',

    alertText: 'Active lightning detected over western ghats region.',

    areaAffected: {

      area: '320 km²',

      population: '280k',

      hospitals: '9 hospitals',

      schools: '18 schools',

      roads: '2 state highways',

      infrastructure: '9 substations',

      districts: '2 districts',

    },

    evidence: [

      { name: 'Lightning API', status: 'verified' },

      { name: 'Weather API', status: 'verified' },

      { name: 'Citizen reports', status: 'pending' },

    ],

  },

  {

    id: 7,

    event: 'Heavy Rainfall',

    name: 'Synthetic Test â Bengaluru Heavy Rain',

    place: 'Bengaluru Urban',

    state: 'Karnataka',

    district: 'Bengaluru Urban',

    severity: 'critical',

    value: '185 mm',

    source: 'Synthetic Test Data',

    reports: 999,

    confidence: 98,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Responding',

    impact: 'Synthetic test record â not a real incident',

    lat: 12.9600,

    lng: 77.5800,

    time: 'SYNTHETIC',

    alertText: 'Synthetic critical test incident for Bengaluru Urban.',

    areaAffected: {

      area: '100 km²',

      population: '100k',

      hospitals: '5 hospitals',

      schools: '10 schools',

      roads: '2 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 8,

    event: 'Thunderstorm',

    name: 'Synthetic Test â Bengaluru Thunderstorm',

    place: 'Bengaluru Urban',

    state: 'Karnataka',

    district: 'Bengaluru Urban',

    severity: 'high',

    value: '70 strikes/hr',

    source: 'Synthetic Test Data',

    reports: 500,

    confidence: 94,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Acknowledged',

    impact: 'Synthetic test record â not a real incident',

    lat: 12.9800,

    lng: 77.6000,

    time: 'SYNTHETIC',

    alertText: 'Synthetic high test incident for Bengaluru Urban.',

    areaAffected: {

      area: '80 km²',

      population: '80k',

      hospitals: '4 hospitals',

      schools: '8 schools',

      roads: '1 main road',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

      { name: 'Synthetic Sensor', status: 'pending' },

    ],

  },

  {

    id: 9,

    event: 'Extreme Wind',

    name: 'Synthetic Test â Bengaluru Extreme Wind',

    place: 'Bengaluru Urban',

    state: 'Karnataka',

    district: 'Bengaluru Urban',

    severity: 'moderate',

    value: '65 km/h',

    source: 'Synthetic Test Data',

    reports: 120,

    confidence: 89,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Detected',

    impact: 'Synthetic test record â not a real incident',

    lat: 12.9900,

    lng: 77.6100,

    time: 'SYNTHETIC',

    alertText: 'Synthetic moderate test incident for Bengaluru Urban.',

    areaAffected: {

      area: '60 km²',

      population: '60k',

      hospitals: '3 hospitals',

      schools: '6 schools',

      roads: '1 main road',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 10,

    event: 'Heavy Rainfall',

    name: 'Synthetic Test â Mysuru Heavy Rain',

    place: 'Mysuru',

    state: 'Karnataka',

    district: 'Mysuru',

    severity: 'low',

    value: '45 mm',

    source: 'Synthetic Test Data',

    reports: 80,

    confidence: 87,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Verified',

    impact: 'Synthetic test record â not a real incident',

    lat: 12.3000,

    lng: 76.6400,

    time: 'SYNTHETIC',

    alertText: 'Synthetic low test incident for Mysuru.',

    areaAffected: {

      area: '50 km²',

      population: '50k',

      hospitals: '2 hospitals',

      schools: '4 schools',

      roads: '1 local road',

      infrastructure: '0 substations',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 11,

    event: 'Heavy Rainfall',

    name: 'Synthetic Test â Kodagu Heavy Rain',

    place: 'Kodagu',

    state: 'Karnataka',

    district: 'Kodagu',

    severity: 'high',

    value: '110 mm',

    source: 'Synthetic Test Data',

    reports: 300,

    confidence: 93,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Assigned',

    impact: 'Synthetic test record â not a real incident',

    lat: 12.4100,

    lng: 75.7400,

    time: 'SYNTHETIC',

    alertText: 'Synthetic high test incident for Kodagu.',

    areaAffected: {

      area: '90 km²',

      population: '90k',

      hospitals: '3 hospitals',

      schools: '5 schools',

      roads: '2 district roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

      { name: 'Synthetic Radar', status: 'verified' },

    ],

  },

  {

    id: 12,

    event: 'Thunderstorm',

    name: 'Synthetic Test â Mysuru Thunderstorm',

    place: 'Mysuru',

    state: 'Karnataka',

    district: 'Mysuru',

    severity: 'moderate',

    value: '55 strikes/hr',

    source: 'Synthetic Test Data',

    reports: 200,

    confidence: 90,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Detected',

    impact: 'Synthetic test record â not a real incident',

    lat: 12.2800,

    lng: 76.6200,

    time: 'SYNTHETIC',

    alertText: 'Synthetic moderate test incident for Mysuru.',

    areaAffected: {

      area: '70 km²',

      population: '70k',

      hospitals: '3 hospitals',

      schools: '5 schools',

      roads: '1 district road',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 13,

    event: 'Heavy Rainfall',

    name: 'Synthetic Test â Delhi Central Rain',

    place: 'Central Delhi',

    state: 'Delhi',

    district: 'Central Delhi',

    severity: 'critical',

    value: '145 mm',

    source: 'Synthetic Test Data',

    reports: 300,

    confidence: 95,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Responding',

    impact: 'Synthetic test record â not a real incident',

    lat: 28.6139,

    lng: 77.2090,

    time: 'SYNTHETIC',

    alertText: 'Synthetic critical test incident for Central Delhi.',

    areaAffected: {

      area: '120 km²',

      population: '200k',

      hospitals: '8 hospitals',

      schools: '15 schools',

      roads: '5 main roads',

      infrastructure: '2 substations',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 14,

    event: 'Thunderstorm',

    name: 'Synthetic Test â Delhi North Thunderstorm',

    place: 'North Delhi',

    state: 'Delhi',

    district: 'North Delhi',

    severity: 'high',

    value: '68 strikes/hr',

    source: 'Synthetic Test Data',

    reports: 180,

    confidence: 91,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Acknowledged',

    impact: 'Synthetic test record â not a real incident',

    lat: 28.7041,

    lng: 77.1025,

    time: 'SYNTHETIC',

    alertText: 'Synthetic high test incident for North Delhi.',

    areaAffected: {

      area: '90 km²',

      population: '150k',

      hospitals: '6 hospitals',

      schools: '12 schools',

      roads: '3 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

      { name: 'Synthetic Sensor', status: 'pending' },

    ],

  },

  {

    id: 15,

    event: 'Extreme Wind',

    name: 'Synthetic Test â Delhi South Wind',

    place: 'South Delhi',

    state: 'Delhi',

    district: 'South Delhi',

    severity: 'moderate',

    value: '58 km/h',

    source: 'Synthetic Test Data',

    reports: 95,

    confidence: 87,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Detected',

    impact: 'Synthetic test record â not a real incident',

    lat: 28.4089,

    lng: 77.3178,

    time: 'SYNTHETIC',

    alertText: 'Synthetic moderate test incident for South Delhi.',

    areaAffected: {

      area: '70 km²',

      population: '120k',

      hospitals: '5 hospitals',

      schools: '10 schools',

      roads: '2 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 16,

    event: 'Heatwave',

    name: 'Synthetic Test â Delhi East Heatwave',

    place: 'East Delhi',

    state: 'Delhi',

    district: 'East Delhi',

    severity: 'low',

    value: '42.1°C',

    source: 'Synthetic Test Data',

    reports: 65,

    confidence: 85,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Verified',

    impact: 'Synthetic test record â not a real incident',

    lat: 28.6672,

    lng: 77.3220,

    time: 'SYNTHETIC',

    alertText: 'Synthetic low test incident for East Delhi.',

    areaAffected: {

      area: '55 km²',

      population: '90k',

      hospitals: '4 hospitals',

      schools: '8 schools',

      roads: '2 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 17,

    event: 'Cyclone',

    name: 'Synthetic Test â Odisha Puri Cyclone',

    place: 'Puri',

    state: 'Odisha',

    district: 'Puri',

    severity: 'critical',

    value: '125 km/h',

    source: 'Synthetic Test Data',

    reports: 280,

    confidence: 94,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Responding',

    impact: 'Synthetic test record â not a real incident',

    lat: 19.8135,

    lng: 85.8312,

    time: 'SYNTHETIC',

    alertText: 'Synthetic critical test incident for Puri.',

    areaAffected: {

      area: '180 km²',

      population: '300k',

      hospitals: '10 hospitals',

      schools: '20 schools',

      roads: '6 main roads',

      infrastructure: '3 substations, 1 port',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 18,

    event: 'Flood',

    name: 'Synthetic Test â Odisha Cuttack Flood',

    place: 'Cuttack',

    state: 'Odisha',

    district: 'Cuttack',

    severity: 'high',

    value: 'Alert level 4',

    source: 'Synthetic Test Data',

    reports: 210,

    confidence: 90,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Acknowledged',

    impact: 'Synthetic test record â not a real incident',

    lat: 20.4624,

    lng: 85.8828,

    time: 'SYNTHETIC',

    alertText: 'Synthetic high test incident for Cuttack.',

    areaAffected: {

      area: '140 km²',

      population: '250k',

      hospitals: '7 hospitals',

      schools: '14 schools',

      roads: '4 main roads',

      infrastructure: '2 substations',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

      { name: 'Synthetic Radar', status: 'verified' },

    ],

  },

  {

    id: 19,

    event: 'Heavy Rainfall',

    name: 'Synthetic Test â Odisha Bhubaneswar Rain',

    place: 'Bhubaneswar',

    state: 'Odisha',

    district: 'Bhubaneswar',

    severity: 'moderate',

    value: '85 mm',

    source: 'Synthetic Test Data',

    reports: 140,

    confidence: 88,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Detected',

    impact: 'Synthetic test record â not a real incident',

    lat: 20.2961,

    lng: 85.8245,

    time: 'SYNTHETIC',

    alertText: 'Synthetic moderate test incident for Bhubaneswar.',

    areaAffected: {

      area: '100 km²',

      population: '180k',

      hospitals: '5 hospitals',

      schools: '10 schools',

      roads: '3 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],
  },

  {

    id: 20,

    event: 'Heatwave',

    name: 'Synthetic Test â Rajasthan Jaisalmer Heatwave',

    place: 'Jaisalmer',

    state: 'Rajasthan',

    district: 'Jaisalmer',

    severity: 'critical',

    value: '48.5°C',

    source: 'Synthetic Test Data',

    reports: 220,

    confidence: 93,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Responding',

    impact: 'Synthetic test record â not a real incident',

    lat: 26.9155,

    lng: 70.9083,

    time: 'SYNTHETIC',

    alertText: 'Synthetic critical test incident for Jaisalmer.',

    areaAffected: {

      area: '200 km²',

      population: '180k',

      hospitals: '6 hospitals',

      schools: '12 schools',

      roads: '4 main roads',

      infrastructure: '2 substations',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 21,

    event: 'Thunderstorm',

    name: 'Synthetic Test â Rajasthan Jaipur Thunderstorm',

    place: 'Jaipur',

    state: 'Rajasthan',

    district: 'Jaipur',

    severity: 'high',

    value: '75 strikes/hr',

    source: 'Synthetic Test Data',

    reports: 190,

    confidence: 92,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Acknowledged',

    impact: 'Synthetic test record â not a real incident',

    lat: 26.9124,

    lng: 75.7873,

    time: 'SYNTHETIC',

    alertText: 'Synthetic high test incident for Jaipur.',

    areaAffected: {

      area: '110 km²',

      population: '220k',

      hospitals: '7 hospitals',

      schools: '13 schools',

      roads: '4 main roads',

      infrastructure: '2 substations',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 22,

    event: 'Dust Storm',

    name: 'Synthetic Test â Rajasthan Jodhpur Dust Storm',

    place: 'Jodhpur',

    state: 'Rajasthan',

    district: 'Jodhpur',

    severity: 'moderate',

    value: '55 km/h',

    source: 'Synthetic Test Data',

    reports: 85,

    confidence: 86,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Detected',

    impact: 'Synthetic test record â not a real incident',

    lat: 26.2389,

    lng: 73.0243,

    time: 'SYNTHETIC',

    alertText: 'Synthetic moderate test incident for Jodhpur.',

    areaAffected: {

      area: '95 km²',

      population: '140k',

      hospitals: '5 hospitals',

      schools: '9 schools',

      roads: '3 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 23,

    event: 'Heavy Rainfall',

    name: 'Synthetic Test â Rajasthan Udaipur Rain',

    place: 'Udaipur',

    state: 'Rajasthan',

    district: 'Udaipur',

    severity: 'low',

    value: '55 mm',

    source: 'Synthetic Test Data',

    reports: 70,

    confidence: 84,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Verified',

    impact: 'Synthetic test record â not a real incident',

    lat: 24.5854,

    lng: 73.7125,

    time: 'SYNTHETIC',

    alertText: 'Synthetic low test incident for Udaipur.',

    areaAffected: {

      area: '60 km²',

      population: '80k',

      hospitals: '3 hospitals',

      schools: '7 schools',

      roads: '2 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 24,

    event: 'Landslide',

    name: 'Synthetic Test â West Bengal Darjeeling Landslide',

    place: 'Darjeeling',

    state: 'West Bengal',

    district: 'Darjeeling',

    severity: 'critical',

    value: 'High risk',

    source: 'Synthetic Test Data',

    reports: 160,

    confidence: 89,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Responding',

    impact: 'Synthetic test record â not a real incident',

    lat: 27.0410,

    lng: 88.2674,

    time: 'SYNTHETIC',

    alertText: 'Synthetic critical test incident for Darjeeling.',

    areaAffected: {

      area: '80 km²',

      population: '60k',

      hospitals: '3 hospitals',

      schools: '6 schools',

      roads: '2 mountain roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 25,

    event: 'Flood',

    name: 'Synthetic Test â West Bengal Kolkata Flood',

    place: 'Kolkata',

    state: 'West Bengal',

    district: 'Kolkata',

    severity: 'high',

    value: 'Alert level 3',

    source: 'Synthetic Test Data',

    reports: 250,

    confidence: 91,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Acknowledged',

    impact: 'Synthetic test record â not a real incident',

    lat: 22.5726,

    lng: 88.3639,

    time: 'SYNTHETIC',

    alertText: 'Synthetic high test incident for Kolkata.',

    areaAffected: {

      area: '150 km²',

      population: '350k',

      hospitals: '12 hospitals',

      schools: '25 schools',

      roads: '8 main roads',

      infrastructure: '4 substations',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

      { name: 'Synthetic Radar', status: 'verified' },

    ],

  },

  {

    id: 26,

    event: 'Heavy Rainfall',

    name: 'Synthetic Test â West Bengal Siliguri Rain',

    place: 'Siliguri',

    state: 'West Bengal',

    district: 'Darjeeling',

    severity: 'moderate',

    value: '95 mm',

    source: 'Synthetic Test Data',

    reports: 130,

    confidence: 87,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Detected',

    impact: 'Synthetic test record â not a real incident',

    lat: 26.7271,

    lng: 88.3953,

    time: 'SYNTHETIC',

    alertText: 'Synthetic moderate test incident for Siliguri.',

    areaAffected: {

      area: '90 km²',

      population: '140k',

      hospitals: '5 hospitals',

      schools: '9 schools',

      roads: '3 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 27,

    event: 'Flood',

    name: 'Synthetic Test â Maharashtra Mumbai Flood',

    place: 'Mumbai',

    state: 'Maharashtra',

    district: 'Mumbai',

    severity: 'critical',

    value: 'Alert level 5',

    source: 'Synthetic Test Data',

    reports: 320,

    confidence: 96,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Responding',

    impact: 'Synthetic test record â not a real incident',

    lat: 19.0760,

    lng: 72.8777,

    time: 'SYNTHETIC',

    alertText: 'Synthetic critical test incident for Mumbai.',

    areaAffected: {

      area: '180 km²',

      population: '400k',

      hospitals: '15 hospitals',

      schools: '30 schools',

      roads: '10 main roads',

      infrastructure: '5 substations',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 28,

    event: 'Thunderstorm',

    name: 'Synthetic Test â Maharashtra Pune Thunderstorm',

    place: 'Pune',

    state: 'Maharashtra',

    district: 'Pune',

    severity: 'high',

    value: '72 strikes/hr',

    source: 'Synthetic Test Data',

    reports: 175,

    confidence: 90,

    consensus: 'High',

    independentSources: '2 / 2',

    status: 'Acknowledged',

    impact: 'Synthetic test record â not a real incident',

    lat: 18.5204,

    lng: 73.8567,

    time: 'SYNTHETIC',

    alertText: 'Synthetic high test incident for Pune.',

    areaAffected: {

      area: '100 km²',

      population: '200k',

      hospitals: '8 hospitals',

      schools: '14 schools',

      roads: '5 main roads',

      infrastructure: '2 substations',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 29,

    event: 'Heatwave',

    name: 'Synthetic Test â Maharashtra Nagpur Heatwave',

    place: 'Nagpur',

    state: 'Maharashtra',

    district: 'Nagpur',

    severity: 'moderate',

    value: '43.2°C',

    source: 'Synthetic Test Data',

    reports: 105,

    confidence: 86,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Detected',

    impact: 'Synthetic test record â not a real incident',

    lat: 21.1458,

    lng: 79.0882,

    time: 'SYNTHETIC',

    alertText: 'Synthetic moderate test incident for Nagpur.',

    areaAffected: {

      area: '85 km²',

      population: '130k',

      hospitals: '6 hospitals',

      schools: '11 schools',

      roads: '3 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

  {

    id: 30,

    event: 'Heavy Rainfall',

    name: 'Synthetic Test â Maharashtra Nashik Rain',

    place: 'Nashik',

    state: 'Maharashtra',

    district: 'Nashik',

    severity: 'low',

    value: '60 mm',

    source: 'Synthetic Test Data',

    reports: 55,

    confidence: 83,

    consensus: 'Medium',

    independentSources: '2 / 2',

    status: 'Verified',

    impact: 'Synthetic test record â not a real incident',

    lat: 19.9975,

    lng: 73.7898,

    time: 'SYNTHETIC',

    alertText: 'Synthetic low test incident for Nashik.',

    areaAffected: {

      area: '50 km²',

      population: '70k',

      hospitals: '3 hospitals',

      schools: '6 schools',

      roads: '2 main roads',

      infrastructure: '1 substation',

      districts: '1 district',

    },

    evidence: [

      { name: 'Synthetic Test Data', status: 'verified' },

    ],

  },

]

export const alerts: Alert[] = [

  { sev: 'critical', event: 'Cyclone', place: 'Odisha Coast', time: '14 min ago', text: 'Severe cyclonic storm moving north-west. Coastal evacuation advised.', confidence: '97%', source: 'Satellite feed', incidentId: 3, status: 'Verified' },

  { sev: 'high', event: 'Heavy Rainfall', place: 'Bengaluru', time: '8 min ago', text: 'Urban flooding reported across 6 districts. 142 mm rainfall recorded.', confidence: '92%', source: 'Citizen reports', incidentId: 2, status: 'Acknowledged' },

  { sev: 'high', event: 'Flood', place: 'Siliguri, West Bengal', time: '26 min ago', text: 'River levels above danger mark near low-lying settlements.', confidence: '91%', source: 'Public posts', incidentId: 5, status: 'Assigned' },

  { sev: 'critical', event: 'Heatwave', place: 'Delhi NCR', time: '41 min ago', text: 'Maximum temperature 6°C above seasonal average.', confidence: '96%', source: 'IMD API', incidentId: 1, status: 'Responding' },

  { sev: 'moderate', event: 'Extreme Wind', place: 'Rajasthan', time: '1 hr ago', text: 'High-velocity winds across desert districts. Structural damage risk.', confidence: '88%', source: 'Weather API', incidentId: 4, status: 'Detected' },

  { sev: 'critical', event: 'Flood', place: 'Mumbai', time: 'SYNTHETIC', text: 'Synthetic critical test incident for Mumbai.', confidence: '96%', source: 'Synthetic Test Data', incidentId: 27, status: 'Responding' },

  { sev: 'high', event: 'Flood', place: 'Kolkata', time: 'SYNTHETIC', text: 'Synthetic high test incident for Kolkata.', confidence: '91%', source: 'Synthetic Test Data', incidentId: 25, status: 'Acknowledged' },

  { sev: 'moderate', event: 'Heatwave', place: 'Nagpur', time: 'SYNTHETIC', text: 'Synthetic moderate test incident for Nagpur.', confidence: '86%', source: 'Synthetic Test Data', incidentId: 29, status: 'Detected' },

  { sev: 'critical', event: 'Heavy Rainfall', place: 'Bengaluru Urban', time: 'SYNTHETIC', text: 'Synthetic critical test incident for Bengaluru Urban.', confidence: '98%', source: 'Synthetic Test Data', incidentId: 7, status: 'Responding' },

  { sev: 'high', event: 'Thunderstorm', place: 'Bengaluru Urban', time: 'SYNTHETIC', text: 'Synthetic high test incident for Bengaluru Urban.', confidence: '94%', source: 'Synthetic Test Data', incidentId: 8, status: 'Acknowledged' },

  { sev: 'moderate', event: 'Extreme Wind', place: 'Bengaluru Urban', time: 'SYNTHETIC', text: 'Synthetic moderate test incident for Bengaluru Urban.', confidence: '89%', source: 'Synthetic Test Data', incidentId: 9, status: 'Detected' },

  { sev: 'high', event: 'Heavy Rainfall', place: 'Kodagu', time: 'SYNTHETIC', text: 'Synthetic high test incident for Kodagu.', confidence: '93%', source: 'Synthetic Test Data', incidentId: 11, status: 'Assigned' },

  { sev: 'moderate', event: 'Thunderstorm', place: 'Mysuru', time: 'SYNTHETIC', text: 'Synthetic moderate test incident for Mysuru.', confidence: '90%', source: 'Synthetic Test Data', incidentId: 12, status: 'Detected' },

  { sev: 'critical', event: 'Heavy Rainfall', place: 'Central Delhi', time: 'SYNTHETIC', text: 'Synthetic critical test incident for Central Delhi.', confidence: '95%', source: 'Synthetic Test Data', incidentId: 13, status: 'Responding' },

  { sev: 'high', event: 'Thunderstorm', place: 'North Delhi', time: 'SYNTHETIC', text: 'Synthetic high test incident for North Delhi.', confidence: '91%', source: 'Synthetic Test Data', incidentId: 14, status: 'Acknowledged' },

  { sev: 'moderate', event: 'Extreme Wind', place: 'South Delhi', time: 'SYNTHETIC', text: 'Synthetic moderate test incident for South Delhi.', confidence: '87%', source: 'Synthetic Test Data', incidentId: 15, status: 'Detected' },

  { sev: 'critical', event: 'Cyclone', place: 'Puri', time: 'SYNTHETIC', text: 'Synthetic critical test incident for Puri.', confidence: '94%', source: 'Synthetic Test Data', incidentId: 17, status: 'Responding' },

  { sev: 'high', event: 'Flood', place: 'Cuttack', time: 'SYNTHETIC', text: 'Synthetic high test incident for Cuttack.', confidence: '90%', source: 'Synthetic Test Data', incidentId: 18, status: 'Acknowledged' },

  { sev: 'moderate', event: 'Heavy Rainfall', place: 'Bhubaneswar', time: 'SYNTHETIC', text: 'Synthetic moderate test incident for Bhubaneswar.', confidence: '88%', source: 'Synthetic Test Data', incidentId: 19, status: 'Detected' },

  { sev: 'critical', event: 'Heatwave', place: 'Jaisalmer', time: 'SYNTHETIC', text: 'Synthetic critical test incident for Jaisalmer.', confidence: '93%', source: 'Synthetic Test Data', incidentId: 20, status: 'Responding' },

  { sev: 'high', event: 'Thunderstorm', place: 'Jaipur', time: 'SYNTHETIC', text: 'Synthetic high test incident for Jaipur.', confidence: '92%', source: 'Synthetic Test Data', incidentId: 21, status: 'Acknowledged' },

  { sev: 'moderate', event: 'Dust Storm', place: 'Jodhpur', time: 'SYNTHETIC', text: 'Synthetic moderate test incident for Jodhpur.', confidence: '86%', source: 'Synthetic Test Data', incidentId: 22, status: 'Detected' },

  { sev: 'critical', event: 'Landslide', place: 'Darjeeling', time: 'SYNTHETIC', text: 'Synthetic critical test incident for Darjeeling.', confidence: '89%', source: 'Synthetic Test Data', incidentId: 24, status: 'Responding' },

  { sev: 'moderate', event: 'Heavy Rainfall', place: 'Siliguri', time: 'SYNTHETIC', text: 'Synthetic moderate test incident for Siliguri.', confidence: '87%', source: 'Synthetic Test Data', incidentId: 26, status: 'Detected' },

  { sev: 'high', event: 'Thunderstorm', place: 'Pune', time: 'SYNTHETIC', text: 'Synthetic high test incident for Pune.', confidence: '90%', source: 'Synthetic Test Data', incidentId: 28, status: 'Acknowledged' },

]

export const statesData: [string, number][] = [

  ['Odisha', 86],

  ['Karnataka', 72],

  ['West Bengal', 64],

  ['Maharashtra', 57],

  ['Rajasthan', 43],

]



export const sourcesData = [

  ['APIs', 46],

  ['Citizen reports', 24],

  ['Public posts', 15],

  ['Websites', 9],

  ['Datasets', 6],

]



export const incidentTypeData = [

  ['Heavy Rain', 82],

  ['Flood', 68],

  ['Heatwave', 54],

  ['Thunderstorm', 46],

  ['Cyclone', 30],

  ['Landslide', 21],

  ['Other', 12],

]



export const aiClassificationData = [

  ['Flood', 31],

  ['Heatwave', 24],

  ['Rainfall', 19],

  ['Cyclone', 14],

  ['Other', 12],

]



export const aiRiskRows = [

  ['Flood', 'Bengaluru', 'HIGH', '92%', '148'],

  ['Heatwave', 'Delhi NCR', 'HIGH', '96%', '231'],

  ['Cyclone', 'Odisha Coast', 'CRITICAL', '97%', '392'],

]



export const filterOptions = {

  state: ['all', 'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'],

  district: ['all'],

  eventType: [

  'all',

  'Heatwave',

  'Heavy Rainfall',

  'Very Heavy Rainfall',

  'Extremely Heavy Rainfall',

  'Cyclone',

  'Extreme Wind',

  'Strong Surface Winds',

  'Flood',

  'Thunderstorm',

  'Lightning',

  'Thunderstorm & Lightning',

  'Hailstorm',

  'Dust Storm',

  'Dust-Raising Winds',

  'Squall',

  'Hot Day',

  'Hot and Humid',

  'Warm Night',

  'Cold Wave',

  'Cold Day',

  'Fog',

  'Ground Frost',

  'Heavy Snowfall'

],

  severity: ['all', 'critical', 'high', 'moderate', 'low'],

  dataSource: ['all', 'IMD API', 'Citizen reports', 'Satellite feed', 'Weather API', 'Public posts', 'Lightning API'],

}

