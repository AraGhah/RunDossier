import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertValidSalesNavSearchUrl,
  describeSalesNavSearchUrl,
  isValidSalesNavSearchUrl,
} from './sales-nav-url.js';

const VALID =
  'https://www.linkedin.com/sales/search/people?query=(recentSearchParam%3A(1%3Atrue))';

describe('sales-nav-url', () => {
  it('accepts full Sales Navigator URLs', () => {
    assert.equal(isValidSalesNavSearchUrl(VALID), true);
  });

  it('rejects bare LinkedIn query tokens', () => {
    const token = 'AQEDAWdxVSYANfB2AAABnvUboFoAAAGfGSgkWlYAMYmuwev1sKyRXJZskuVs_IcCKEi3I7XwkRneFhb6vOdRXUO4YeSt9Nzp';
    assert.equal(isValidSalesNavSearchUrl(token), false);
    const review = describeSalesNavSearchUrl(token);
    assert.equal(review.valid, false);
    assert.match(review.issue ?? '', /URL complète/i);
  });

  it('assertValidSalesNavSearchUrl throws with helpful message for tokens', () => {
    assert.throws(
      () => assertValidSalesNavSearchUrl('AQEDAWdxVSYANfB2AAABnvUboFo'),
      /full URL/i
    );
  });
});
