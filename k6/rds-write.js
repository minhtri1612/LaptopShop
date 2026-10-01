import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

const base = __ENV.BASE_URL || 'http://laptopshop-prod-alb-179228617.ap-southeast-2.elb.amazonaws.com';
const jsonHeaders = { 'Content-Type': 'application/json' };

const plateaus = ['50', '100'];

function stageOf(vus) {
  const bands = [
    ['50', 45, 55],
    ['100', 90, 110],
  ];
  for (let i = 0; i < bands.length; i++) {
    if (vus >= bands[i][1] && vus <= bands[i][2]) return bands[i][0];
  }
  return 'ramp';
}

const thresholds = {};
for (let i = 0; i < plateaus.length; i++) {
  thresholds[`http_req_duration{stage:${plateaus[i]}}`] = ['p(95)>=0'];
  thresholds[`http_req_failed{stage:${plateaus[i]}}`] = ['rate>=0'];
}

export const options = {
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max', 'count'],
  scenarios: {
    write: {
      executor: 'ramping-vus',
      startVUs: 0,
      gracefulRampDown: '10s',
      stages: [
        { duration: '10s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '10s', target: 100 },
        { duration: '30s', target: 100 },
      ],
    },
  },
  thresholds,
};

export function setup() {
  const list = http.get(`${base}/api/products?pageSize=20`);
  const ids = list.json('data').map((product) => product.id).filter((id) => id);
  const login = http.post(`${base}/api/login`, JSON.stringify({
    username: __ENV.K6_USERNAME || 'hoidanit@gmail.com',
    password: __ENV.K6_PASSWORD || '123456',
  }), { headers: jsonHeaders });
  const token = login.json('data.access_token');
  if (!ids.length || !token) throw new Error('setup failed');
  return { ids, token };
}

export default function (data) {
  const stage = stageOf(exec.instance.vusActive);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };
  const roll = Math.random();
  let res;
  let ok;

  if (roll < 0.5) {
    const productId = data.ids[Math.floor(Math.random() * data.ids.length)];
    res = http.post(`${base}/api/cart/items`, JSON.stringify({ productId, quantity: 1 }), {
      headers,
      tags: { stage, name: 'cart' },
      timeout: '15s',
    });
    ok = (r) => r.status === 200;
  } else if (roll < 0.8) {
    res = http.post(`${base}/api/orders`, JSON.stringify({
      receiverName: 'k6',
      receiverAddress: 'k6',
      receiverPhone: '0900000000',
    }), {
      headers,
      tags: { stage, name: 'order' },
      timeout: '15s',
      responseCallback: http.expectedStatuses(201, 400),
    });
    ok = (r) => r.status === 201 || r.status === 400;
  } else {
    res = http.post(`${base}/api/admin/products`, JSON.stringify({
      name: `k6-rds-${__VU}-${__ITER}`,
      price: 1000,
      detailDesc: 'k6 rds',
      shortDesc: 'k6',
      quantity: 10,
      factory: 'ASUS',
      target: 'GAMING',
    }), {
      headers,
      tags: { stage, name: 'insert' },
      timeout: '15s',
    });
    ok = (r) => r.status === 201;
  }

  check(res, { 'write reached the db': ok }, { stage });
}
