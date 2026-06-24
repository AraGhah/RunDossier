import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isExcludedIcpLead,
  meetsColdEmailAgencyIcp,
  meetsConsultingIcp,
  parseProfileSegment,
  scoreIcpFit,
} from './icp-fit.js';

describe('icp-fit agency_main', () => {
  it('accepts cold email agency founder', () => {
    const input = {
      title: 'Founder',
      company: 'Cold Email Labs — lead generation agency',
      employeeCount: 18,
    };
    assert.equal(meetsColdEmailAgencyIcp(input, 50), true);
    assert.ok(scoreIcpFit(input, 'agency_main') >= 70);
  });

  it('rejects recruiter', () => {
    const input = { title: 'Founder', company: 'Tech Recruiting Staffing', employeeCount: 20 };
    assert.equal(isExcludedIcpLead(input, 'agency_main'), true);
    assert.equal(meetsColdEmailAgencyIcp(input), false);
  });

  it('rejects generic consulting without outbound signals', () => {
    const input = { title: 'Managing Director', company: 'Strategy Consulting Group', employeeCount: 40 };
    assert.equal(meetsColdEmailAgencyIcp(input), false);
  });

  it('rejects coach', () => {
    const input = { title: 'Executive Coach', company: 'Growth Coaching', employeeCount: 5 };
    assert.equal(isExcludedIcpLead(input), true);
  });

  it('accepts demand generation agency', () => {
    const input = {
      title: 'CEO',
      company: 'Demand Generation Partners — B2B outbound',
      employeeCount: 22,
    };
    assert.equal(meetsColdEmailAgencyIcp(input, 55), true);
  });
});

describe('icp-fit consulting', () => {
  it('accepts GTM outbound consultant', () => {
    const input = {
      title: 'Founder',
      company: 'Outbound Revenue Advisory — GTM consulting',
      employeeCount: 8,
    };
    assert.equal(meetsConsultingIcp(input, 50), true);
  });

  it('rejects generic management consulting', () => {
    const input = { title: 'Partner', company: 'Management Consulting LLP', employeeCount: 200 };
    assert.equal(meetsConsultingIcp(input), false);
  });
});

describe('parseProfileSegment', () => {
  it('detects consulting profile name', () => {
    assert.equal(parseProfileSegment('Dossier ICP — GTM & Outbound Consultants'), 'consulting');
    assert.equal(parseProfileSegment('Dossier ICP — Cold Email Agencies (Main)'), 'agency_main');
  });
});
