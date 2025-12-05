// Test fixtures - mock data for testing

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: '$2b$10$hashedpassword',
  fullName: 'Test User',
  phone: '0123456789',
  address: '123 Test Street',
  avatar: 'default-avatar.png',
  roleId: 2,
  role: {
    id: 2,
    name: 'USER',
  },
};

export const mockAdmin = {
  id: 2,
  email: 'admin@example.com',
  password: '$2b$10$hashedpassword',
  fullName: 'Admin User',
  phone: '0987654321',
  address: '456 Admin Street',
  avatar: 'admin-avatar.png',
  roleId: 1,
  role: {
    id: 1,
    name: 'ADMIN',
  },
};

export const mockUsers = [mockUser, mockAdmin];

export const mockProduct = {
  id: 1,
  name: 'Laptop Dell XPS 15',
  price: 25000000,
  image: 'dell-xps-15.jpg',
  detailDesc: 'High performance laptop with Intel Core i7',
  shortDesc: 'Dell XPS 15 - Premium Laptop',
  quantity: 50,
  sold: 10,
  factory: 'DELL',
  target: 'Gaming',
};

export const mockProducts = [
  mockProduct,
  {
    id: 2,
    name: 'MacBook Pro 14',
    price: 45000000,
    image: 'macbook-pro-14.jpg',
    detailDesc: 'Apple M3 Pro chip, 18GB RAM',
    shortDesc: 'MacBook Pro 14 inch',
    quantity: 30,
    sold: 15,
    factory: 'APPLE',
    target: 'Đồ họa - Kỹ thuật',
  },
  {
    id: 3,
    name: 'Asus ROG Strix',
    price: 35000000,
    image: 'asus-rog.jpg',
    detailDesc: 'Gaming laptop with RTX 4070',
    shortDesc: 'Asus ROG Strix Gaming',
    quantity: 25,
    sold: 8,
    factory: 'ASUS',
    target: 'Gaming',
  },
];

export const mockCart = {
  id: 1,
  userId: 1,
  sum: 2,
  cartDetails: [
    {
      id: 1,
      cartId: 1,
      productId: 1,
      quantity: 1,
      price: 25000000,
      product: mockProduct,
    },
    {
      id: 2,
      cartId: 1,
      productId: 2,
      quantity: 1,
      price: 45000000,
      product: mockProducts[1],
    },
  ],
};

export const mockOrder = {
  id: 1,
  userId: 1,
  totalPrice: 70000000,
  receiverName: 'Test User',
  receiverAddress: '123 Test Street',
  receiverPhone: '0123456789',
  status: 'PENDING',
  createdAt: new Date(),
  orderDetails: [
    {
      id: 1,
      orderId: 1,
      productId: 1,
      quantity: 1,
      price: 25000000,
      product: mockProduct,
    },
    {
      id: 2,
      orderId: 1,
      productId: 2,
      quantity: 1,
      price: 45000000,
      product: mockProducts[1],
    },
  ],
};

export const mockOrders = [
  mockOrder,
  {
    id: 2,
    userId: 1,
    totalPrice: 35000000,
    receiverName: 'Test User',
    receiverAddress: '123 Test Street',
    receiverPhone: '0123456789',
    status: 'COMPLETED',
    createdAt: new Date(),
    orderDetails: [
      {
        id: 3,
        orderId: 2,
        productId: 3,
        quantity: 1,
        price: 35000000,
        product: mockProducts[2],
      },
    ],
  },
];

export const newUserInput = {
  email: 'newuser@example.com',
  password: 'password123',
  fullName: 'New User',
  phone: '0111222333',
  address: '789 New Street',
};

export const newProductInput = {
  name: 'New Laptop',
  price: 20000000,
  detailDesc: 'Brand new laptop',
  shortDesc: 'New Laptop Short Desc',
  quantity: 100,
  factory: 'LENOVO',
  target: 'Văn phòng',
};
