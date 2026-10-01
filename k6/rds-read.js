import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

const base = __ENV.BASE_URL || 'http://laptopshop-prod-alb-179228617.ap-southeast-2.elb.amazonaws.com';

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
    read: {
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
  const res = http.get(`${base}/api/products?pageSize=20`);
  const ids = res.json('data').map((product) => product.id).filter((id) => id);
  if (!ids.length) throw new Error('no products');
  return { ids };
}

export default function (data) {
  const stage = stageOf(exec.instance.vusActive);
  const roll = Math.random();
  let res;
  if (roll < 0.5) {
    const page = 1 + Math.floor(Math.random() * 5);
    res = http.get(`${base}/api/products?page=${page}&pageSize=8`, {
      tags: { stage, name: 'list' },
      timeout: '15s',
    });
  } else if (roll < 0.8) {
    res = http.get(`${base}/api/products?factory=ASUS&target=GAMING&pageSize=8`, {
      tags: { stage, name: 'filter' },
      timeout: '15s',
    });
  } else {
    const id = data.ids[Math.floor(Math.random() * data.ids.length)];
    res = http.get(`${base}/api/products/${id}`, {
      tags: { stage, name: 'detail' },
      timeout: '15s',
    });
  }

  check(res, {
    'select ok': (r) => r.status === 200,
  }, { stage });
}
