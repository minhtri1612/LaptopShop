import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

const images = JSON.parse(open('./images.json')).map((path) => {
  const name = path.split('/').pop();
  const ext = name.split('.').pop().toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  return {
    name,
    contentType,
    data: open(path, 'b'),
  };
});

const plateaus = ['50', '100', '300', '500', '1000'];

function stageOf(vus) {
  const bands = [
    ['50', 45, 55],
    ['100', 90, 110],
    ['300', 280, 320],
    ['500', 480, 520],
    ['1000', 950, 1100],
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
  thresholds[`checks{stage:${plateaus[i]}}`] = ['rate>=0'];
}

export const options = {
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max', 'count'],
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      gracefulRampDown: '10s',
      stages: [
        { duration: '10s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '10s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '20s', target: 300 },
        { duration: '30s', target: 300 },
        { duration: '20s', target: 500 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 1000 },
        { duration: '30s', target: 1000 },
      ],
    },
  },
  thresholds,
};

const base = __ENV.BASE_URL || 'http://laptopshop-prod-alb-179228617.ap-southeast-2.elb.amazonaws.com';
let sessionId = '';

export default function () {
  const stage = stageOf(exec.instance.vusActive);
  const jar = http.cookieJar();

  if (__ITER === 0) {
    const login = http.post(`${base}/login`, {
      username: __ENV.K6_USERNAME || 'hoidanit@gmail.com',
      password: __ENV.K6_PASSWORD || '123456',
    }, { redirects: 0, tags: { stage } });

    const location = String(login.headers.Location || login.headers.location || '');
    check(login, {
      'login accepted': (r) => r.status === 302 && location.includes('success-redirect'),
    }, { stage });
    const sid = jar.cookiesForURL(base)['connect.sid'];
    sessionId = sid && sid.length > 0 ? sid[0] : '';
  }

  if (sessionId) {
    jar.set(base, 'connect.sid', sessionId, { path: '/' });
  }

  const image = images[Math.floor(Math.random() * images.length)];
  const res = http.post(`${base}/admin/create-product`, {
    name: `k6-${__VU}-${__ITER}`,
    price: '1000',
    detailDesc: 'k6 upload',
    shortDesc: 'k6',
    quantity: '1',
    factory: 'ASUS',
    target: 'GAMING',
    image: http.file(image.data, image.name, image.contentType),
  }, { redirects: 0, tags: { stage } });

  const location = String(res.headers.Location || res.headers.location || '');
  check(res, {
    'upload reached the app': (r) => r.status === 302 && location.includes('/admin/product'),
  }, { stage });
}
