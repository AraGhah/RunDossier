import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE}/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has ok': (r) => r.json('status') === 'ok',
  });
  sleep(0.1);
}
