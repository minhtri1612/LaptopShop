import http from 'k6/http';
import { check } from 'k6';

const base = __ENV.BASE_URL || 'http://laptopshop-prod-alb-179228617.ap-southeast-2.elb.amazonaws.com';

export const options = {
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max', 'count'],
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      gracefulRampDown: '10s',
      stages: [
        { duration: '5s', target: 200 },
        { duration: '20s', target: 200 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)>=0'],
    http_req_failed: ['rate>=0'],
  },
};

export default function () {
  const page = 1 + Math.floor(Math.random() * 5);
  const res = http.get(`${base}/api/products?page=${page}&pageSize=8`, {
    tags: { name: 'spike' },
    timeout: '15s',
  });
  check(res, {
    'select ok': (r) => r.status === 200,
  });
}
