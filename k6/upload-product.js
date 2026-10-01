import http from 'k6/http';
import { check } from 'k6';

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

export const options = {
  vus: 5,
  duration: '10s',
};

const base = __ENV.BASE_URL || 'http://laptopshop-prod-alb-179228617.ap-southeast-2.elb.amazonaws.com';

export default function () {
  if (__ITER === 0) {
    const login = http.post(`${base}/login`, {
      username: __ENV.USERNAME || 'hoidanit@gmail.com',
      password: __ENV.PASSWORD || '123456',
    }, { redirects: 0 });

    const location = login.headers.Location || login.headers.location || '';
    check(login, {
      'login accepted': (r) => r.status === 302 && location.includes('success-redirect'),
    });
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
  });

  check(res, {
    'upload reached the app': (r) => r.status === 200 && !r.url.includes('/login') && !r.url.includes('/status/403'),
  });
}
