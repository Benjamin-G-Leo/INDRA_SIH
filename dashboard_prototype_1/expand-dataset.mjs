#!/usr/bin/env node
/* 
 * Expand the INDRA prototype dataset from the supplied CSV files.
 * This script processes public_sample_data.csv and imd_sample_data.csv
 * and updates test-data/indra-prototype.json with expanded records.
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// CSV Parsing
// ============================================================================

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    if (values.length === headers.length) {
      const record = {};
      headers.forEach((h, idx) => {
        record[h] = values[idx];
      });
      records.push(record);
    }
  }
  
  return records;
}

// ============================================================================
// Load existing fixture
// ============================================================================

const fixturePath = path.join('c:', 'Users', 'User', 'Documents', 'INDRA_SIH', 'dashboard_prototype_2', 'test-data', 'indra-prototype.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

console.log('=== Current Fixture State ===');
console.log(`Incidents: ${fixture.incidents.length}`);
console.log(`Public reports: ${fixture.sourceRecords.filter(r => r.kind === 'public').length}`);
console.log(`IMD observations: ${fixture.sourceRecords.filter(r => r.kind === 'imd').length}`);
console.log(`Alerts: ${fixture.alerts.length}`);

// ============================================================================
// Parse CSV data from conversation
// ============================================================================

const publicCsvPath = 'c:/Users/User/Downloads/public_sample_data.csv';
const imdCsvPath = 'c:/Users/User/Downloads/imd_sample_data.csv';

let publicRecords = [];
let imdRecords = [];

if (fs.existsSync(publicCsvPath)) {
  const publicCsv = fs.readFileSync(publicCsvPath, 'utf8');
  publicRecords = parseCSV(publicCsv);
  console.log('\nParsed', publicRecords.length, 'public reports from CSV');
} else {
  console.log('\nWARNING: public_sample_data.csv not found');
}

if (fs.existsSync(imdCsvPath)) {
  const imdCsv = fs.readFileSync(imdCsvPath, 'utf8');
  imdRecords = parseCSV(imdCsv);
  console.log('Parsed', imdRecords.length, 'IMD observations from CSV');
} else {
  console.log('WARNING: imd_sample_data.csv not found');
}

// ============================================================================
// Transform functions
// ============================================================================

function transformPublicReport(record) {
  return {
    kind: 'public',
    sourceRecordId: record.post_id,
    source: record.source,
    sourceKind: record.source_kind,
    authorHandle: record.author_handle || undefined,
    authorVerified: record.author_verified === 'True',
    authorFollowers: parseInt(record.author_followers) || undefined,
    language: record.language,
    text: record.text,
    hashtags: record.hashtags ? record.hashtags.split(',').filter(h => h) : [],
    postedAt: record.posted_at.replace(' ', 'T') + 'Z',
    scrapedAt: record.scraped_at ? record.scraped_at.replace(' ', 'T') + 'Z' : undefined,
    city: record.city || undefined,
    state: record.state,
    locality: record.locality || undefined,
    latitude: parseFloat(record.latitude),
    longitude: parseFloat(record.longitude),
    mediaType: record.media_type || undefined,
    likes: parseInt(record.likes) || undefined,
    reposts: parseInt(record.reposts) || undefined,
    disasterTypeClaimed: record.disaster_type_claimed || undefined,
    isRealCrisis: record.is_real_crisis === 'True',
    label: record.label,
    linkedEventId: record.linked_event_id || undefined,
    credibilityScore: parseFloat(record.credibility_score) || undefined,
    urgency: record.urgency,
    dataSource: record.data_source,
    isSynthetic: true
  };
}

function transformImdObservation(record) {
  const allHazards = record.all_hazards ? record.all_hazards.split('|') : [];
  return {
    kind: 'imd',
    recordId: record.record_id,
    observationDate: record.observation_date,
    observationTimeIst: record.observation_time_ist,
    year: parseInt(record.year),
    month: parseInt(record.month),
    season: record.season,
    stationId: record.station_id,
    stationName: record.station_name,
    state: record.state,
    district: record.district,
    latitude: parseFloat(record.latitude),
    longitude: parseFloat(record.longitude),
    tempMaxC: record.temp_max_c ? parseFloat(record.temp_max_c) : undefined,
    tempMinC: record.temp_min_c ? parseFloat(record.temp_min_c) : undefined,
    rainfallMm: record.rainfall_mm ? parseFloat(record.rainfall_mm) : undefined,
    disasterType: record.disaster_type || undefined,
    allHazards: allHazards.length > 0 ? allHazards : undefined,
    imdAlertColor: record.imd_alert_color || undefined,
    disasterProbabilityPct: record.disaster_probability_pct ? parseFloat(record.disaster_probability_pct) : undefined,
    dataSource: record.data_source,
    isSynthetic: true
  };
}

// ============================================================================
// Build canonical incidents from linked events
// ============================================================================

const eventGroups = {};
publicRecords.forEach(r => {
  if (r.linked_event_id) {
    if (!eventGroups[r.linked_event_id]) {
      eventGroups[r.linked_event_id] = [];
    }
    eventGroups[r.linked_event_id].push(r);
  }
});

const existingIncidentIds = new Set(fixture.incidents.map(i => i.incidentId));
const existingAlertIds = new Set(fixture.alerts.map(a => a.alertId));
const existingPublicIds = new Set(fixture.sourceRecords.filter(r => r.kind === 'public').map(r => r.sourceRecordId));
const existingImdIds = new Set(fixture.sourceRecords.filter(r => r.kind === 'imd').map(r => r.recordId));

console.log('\n=== Building New Records ===');

const newPublicRecords = publicRecords
  .filter(r => !existingPublicIds.has(r.post_id))
  .map(transformPublicReport);

console.log('New public reports to add:', newPublicRecords.length);

const newImdRecords = imdRecords
  .filter(r => !existingImdIds.has(r.record_id))
  .map(transformImdObservation);

console.log('New IMD observations to add:', newImdRecords.length);
const newCanonicalIncidents = [];
const newCanonicalAlerts = [];

Object.entries(eventGroups).forEach(([eventId, reports]) => {
  const canonicalId = 'IND-' + eventId;
  
  if (existingIncidentIds.has(canonicalId)) {
    return;
  }
  
  const realReports = reports.filter(r => r.is_real_crisis === 'True' && r.label === 'real');
  if (realReports.length === 0) {
    return;
  }
  
  const primary = realReports[0];
  const coords = realReports.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)]);
  const avgLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
  const avgLng = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
  
  const urgencyLevels = realReports.map(r => r.urgency);
  const hasHigh = urgencyLevels.includes('high');
  const hasMedium = urgencyLevels.includes('medium');
  
  let severity = 'moderate';
  if (hasHigh) severity = 'high';
  else if (!hasMedium) severity = 'low';
  
  const statuses = ['Detected', 'Verified', 'Acknowledged'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  let value = primary.disaster_type_claimed || 'Event';
  if (primary.disaster_type_claimed && primary.disaster_type_claimed.toLowerCase().includes('cold')) {
    value = '3°C';
  } else if (primary.disaster_type_claimed && primary.disaster_type_claimed.toLowerCase().includes('heat')) {
    value = '45°C';
  } else if (primary.disaster_type_claimed && primary.disaster_type_claimed.toLowerCase().includes('fog')) {
    value = 'Visibility below 50m';
  }
  
  const incident = {
    incidentId: canonicalId,
    linkedEventId: eventId,
    eventType: primary.disaster_type_claimed || 'Unknown',
    severity: severity,
    place: primary.city || primary.locality || 'Unknown',
    state: primary.state,
    district: primary.locality || undefined,
    latitude: avgLat,
    longitude: avgLng,
    observedAt: realReports.map(r => r.posted_at.replace(' ', 'T') + 'Z').sort()[0],
    updatedAt: realReports.map(r => r.scraped_at.replace(' ', 'T') + 'Z').sort().reverse()[0],
    confidence: Math.round(realReports.reduce((sum, r) => sum + (parseFloat(r.credibility_score) || 0.5), 0) / realReports.length * 100),
    sourceCount: realReports.length,
    supportingSourceIds: realReports.map(r => r.post_id),
    status: status,
    value: value,
    dataSource: 'synthetic_public',
    isSynthetic: true
  };
  
  newCanonicalIncidents.push(incident);
  
  const alert = {
    alertId: 'ALERT-' + canonicalId,
    incidentId: canonicalId,
    severity: severity,
    eventType: primary.disaster_type_claimed || 'Unknown',
    place: primary.city || primary.locality || 'Unknown',
    time: incident.updatedAt,
    text: primary.disaster_type_claimed + ' reported in ' + (primary.city || primary.locality) + ', ' + primary.state + '. ' + realReports.length + ' public reports confirm.',
    confidence: incident.confidence + '%',
    source: 'synthetic_public',
    status: status,
    createdAt: incident.updatedAt,
    updatedAt: incident.updatedAt,
    isSynthetic: true
  };
  
  newCanonicalAlerts.push(alert);
});

console.log('New canonical incidents to add:', newCanonicalIncidents.length);
console.log('New alerts to add:', newCanonicalAlerts.length);
fixture.sourceRecords.push(...newPublicRecords, ...newImdRecords);
fixture.incidents.push(...newCanonicalIncidents);
fixture.alerts.push(...newCanonicalAlerts);
fixture.generatedAt = new Date().toISOString();

// ============================================================================
// Validation
// ============================================================================

/**
 * Compute expected confidence for an incident using the documented formula:
 * Math.round(average(credibilityScore of supporting public reports) * 100)
 * with fallback 0.5 for missing/invalid credibilityScore.
 * Returns null if incident has no supporting public reports with valid scores.
 */
function computeExpectedConfidence(incident, sourceRecords) {
  const publicReports = sourceRecords.filter(r => r.kind === 'public');
  const publicById = new Map(publicReports.map(r => [r.sourceRecordId, r]));
  
  const creds = incident.supportingSourceIds
    .map(sid => {
      const src = publicById.get(sid);
      return src ? parseFloat(src.credibilityScore) : NaN;
    })
    .filter(c => !isNaN(c));
  
  if (creds.length === 0) {
    return null; // no computable confidence
  }
  
  // Formula from expansion script: average of credibility scores (with 0.5 fallback)
  // Note: the script uses `parseFloat(r.credibility_score) || 0.5` on raw CSV,
  // but here we use the already-parsed fixture values. For missing/invalid,
  // we apply the same 0.5 fallback.
  const withFallback = incident.supportingSourceIds.map(sid => {
    const src = publicById.get(sid);
    const score = src ? parseFloat(src.credibilityScore) : NaN;
    return isNaN(score) ? 0.5 : score;
  });
  
  const avg = withFallback.reduce((a, b) => a + b, 0) / withFallback.length;
  return Math.round(avg * 100);
}

function validateFixture(f) {
  const errors = [];
  const incidentIds = new Set();
  f.incidents.forEach(i => {
    if (incidentIds.has(i.incidentId)) {
      errors.push('Duplicate incident ID: ' + i.incidentId);
    }
    incidentIds.add(i.incidentId);
  });
  
  const alertIds = new Set();
  f.alerts.forEach(a => {
    if (alertIds.has(a.alertId)) {
      errors.push('Duplicate alert ID: ' + a.alertId);
    }
    alertIds.add(a.alertId);
  });
  
  f.alerts.forEach(a => {
    if (!incidentIds.has(a.incidentId)) {
      errors.push('Alert ' + a.alertId + ' references unknown incident ' + a.incidentId);
    }
  });
  
  const publicIds = new Set();
  f.sourceRecords.filter(r => r.kind === 'public').forEach(r => {
    if (publicIds.has(r.sourceRecordId)) {
      errors.push('Duplicate public report ID: ' + r.sourceRecordId);
    }
    publicIds.add(r.sourceRecordId);
  });
  
  const imdIds = new Set();
  f.sourceRecords.filter(r => r.kind === 'imd').forEach(r => {
    if (imdIds.has(r.recordId)) {
      errors.push('Duplicate IMD record ID: ' + r.recordId);
    }
    imdIds.add(r.recordId);
  });
  
  f.sourceRecords.forEach(r => {
    if (!r.isSynthetic) {
      errors.push('Record ' + (r.sourceRecordId || r.recordId) + ' not marked isSynthetic');
    }
  });
  
  f.incidents.forEach(i => {
    if (!i.isSynthetic) {
      errors.push('Incident ' + i.incidentId + ' not marked isSynthetic');
    }
  });
  
  f.alerts.forEach(a => {
    if (!a.isSynthetic) {
      errors.push('Alert ' + a.alertId + ' not marked isSynthetic');
    }
  });
  
  // Confidence consistency check
  f.incidents.forEach(inc => {
    if (inc.confidence !== undefined && inc.confidence !== null) {
      const expected = computeExpectedConfidence(inc, f.sourceRecords);
      if (expected !== null) {
        const diff = Math.abs(inc.confidence - expected);
        if (diff > 1) { // allow ±1 for rounding edge cases
          errors.push(
            'Confidence mismatch for ' + inc.incidentId +
            ': expected ' + expected + ', actual ' + inc.confidence +
            ' (diff ' + diff + ')'
          );
        }
      }
    }
  });
  
  return errors;
}

const errors = validateFixture(fixture);
if (errors.length > 0) {
  console.log('\n=== VALIDATION ERRORS ===');
  errors.forEach(e => console.log('  ERROR:', e));
  process.exit(1);
} else {
  console.log('\n=== VALIDATION PASSED ===');
}

fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
console.log('\n=== Fixture Updated ===');
console.log('Incidents:', fixture.incidents.length);
console.log('Public reports:', fixture.sourceRecords.filter(r => r.kind === 'public').length);
console.log('IMD observations:', fixture.sourceRecords.filter(r => r.kind === 'imd').length);
console.log('Alerts:', fixture.alerts.length);
console.log('Written to:', fixturePath);