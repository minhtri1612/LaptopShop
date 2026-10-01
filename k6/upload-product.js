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

const plateaus = ['50', '100', '200'];

function stageOf(vus) {
  const bands = [
    ['50', 45, 55],
    ['100', 90, 110],
    ['200', 180, 220],
  ];
  for (let i = 0; i < bands.length; i++) {
    if (vus >= bands[i][1] && vus <= bands[i][2]) return bands[i][0];
  }
  return 'ramp';
}

const thresholds = {};
for (let i = 0; i < plateaus.length; i++) {
  thresholds[`http_req_duration{name:s3,stage:${plateaus[i]}}`] = ['p(95)>=0'];
  thresholds[`http_req_failed{name:s3,stage:${plateaus[i]}}`] = ['rate>=0'];
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
        { duration: '10s', target: 200 },
        { duration: '30s', target: 200 },
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
    }, { redirects: 0, tags: { stage, name: 'login' } });

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
  const ticket = http.post(`${base}/admin/product-upload-url`, JSON.stringify({
    contentType: image.contentType,
    size: image.data.byteLength,
  }), {
    headers: { 'Content-Type': 'application/json' },
    redirects: 0,
    tags: { stage, name: 'presign' },
  });

  check(ticket, {
    'presign accepted': (r) => r.status === 200,
  }, { stage });
  if (ticket.status !== 200) return;

  const signed = ticket.json();
  const put = http.put(signed.uploadUrl, image.data, {
    headers: { 'Content-Type': signed.contentType },
    redirects: 0,
    tags: { stage, name: 's3' },
  });
  check(put, {
    's3 accepted the file': (r) => r.status === 200,
  }, { stage });
  if (put.status !== 200) return;

  const res = http.post(`${base}/admin/create-product`, {
    name: `k6-${__VU}-${__ITER}`,
    price: '1000',
    detailDesc: 'k6 upload',
    shortDesc: 'k6',
    quantity: '1',
    factory: 'ASUS',
    target: 'GAMING',
    imageUrl: signed.publicUrl,
  }, { redirects: 0, tags: { stage, name: 'create' } });

  const location = String(res.headers.Location || res.headers.location || '');
  check(res, {
    'product saved': (r) => r.status === 302 && location.includes('/admin/product'),
  }, { stage });
}
