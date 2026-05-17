# 🛒 Laptopshop - E-Commerce Platform

## Project Overview
A full-stack e-commerce web application for selling laptops and electronic devices, built with modern technologies and following best practices for scalability and maintainability.

**Repository:** github.com/minhtri1612/hoi_dan_IT_NODEJS

---

## 📝 Resume Description (Copy & Paste Ready)

### Short Version:
> **Laptopshop E-Commerce Platform** | Node.js, TypeScript, Express, MySQL, Docker
> - Developed a full-stack e-commerce application with RESTful APIs, user authentication (JWT & Session), and admin dashboard
> - Containerized application using Docker and Docker Compose with MySQL database, achieving consistent deployment across environments
> - Implemented Prisma ORM with database migrations, role-based access control, and secure password hashing with bcrypt

### Long Version:
> **Laptopshop - Full-Stack E-Commerce Platform**
> 
> Built a production-ready e-commerce platform for laptop sales featuring:
> - **Backend Architecture:** Designed and implemented RESTful API using Express.js 5.0 with TypeScript, following MVC pattern with service layer abstraction
> - **Database Design:** Architected MySQL database schema with Prisma ORM, implementing complex relationships (User-Role, Cart-CartDetail-Product, Order-OrderDetail) with 10+ migration versions
> - **Authentication & Security:** Implemented dual authentication system using Passport.js (session-based) for web and JWT for API endpoints, with bcrypt password hashing and role-based access control (RBAC)
> - **DevOps & Containerization:** Containerized entire application stack using Docker and Docker Compose, with health checks, volume persistence, and production-optimized multi-stage builds
> - **File Management:** Built file upload system with Multer for product images and user avatars
> - **Input Validation:** Implemented request validation using Zod schema validation library

---

## 💼 Skills Demonstrated

### Backend Development
| Skill | Technology | Implementation |
|-------|------------|----------------|
| Runtime | Node.js 18 | Server-side JavaScript execution |
| Language | TypeScript 5.7 | Type-safe development with path aliases |
| Framework | Express.js 5.0 | RESTful API & MVC web application |
| ORM | Prisma 6.3 | Database modeling, migrations, type-safe queries |
| Database | MySQL 8.0 | Relational database with complex relationships |
| Authentication | Passport.js + JWT | Session-based & token-based auth |
| Validation | Zod | Request body & schema validation |
| File Upload | Multer | Image upload handling |
| Password Security | bcrypt | Password hashing with salt rounds |
| Template Engine | EJS | Server-side rendering |

### DevOps & Infrastructure
| Skill | Technology | Implementation |
|-------|------------|----------------|
| Containerization | Docker | Multi-stage production builds |
| Orchestration | Docker Compose | Multi-container application management |
| Database Container | MySQL 8.0 | Persistent volume storage |
| Health Checks | Docker Healthcheck | Service dependency management |
| Environment Config | dotenv | Environment variable management |
| Process Management | Nodemon | Development hot-reloading |
| Build System | TypeScript Compiler | tsc + tsc-alias for path resolution |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Browser (EJS Views)          │     Mobile/Frontend (REST API)  │
│  - Bootstrap UI               │     - JSON responses            │
│  - Session Auth               │     - JWT Auth                  │
└───────────────┬───────────────┴────────────────┬────────────────┘
                │                                │
                ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Express.js 5.0 + TypeScript                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Web Routes │  │  API Routes │  │ Middleware  │             │
│  │  (/)        │  │  (/api)     │  │ Auth/Upload │             │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘             │
│         │                │                                      │
│  ┌──────▼──────┐  ┌──────▼──────┐                              │
│  │ Controllers │  │ Controllers │                              │
│  └──────┬──────┘  └──────┬──────┘                              │
│         │                │                                      │
│  ┌──────▼────────────────▼──────┐                              │
│  │         Services             │                              │
│  └──────────────┬───────────────┘                              │
└─────────────────┼───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Prisma ORM                                                     │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Models: User, Role, Product, Cart, CartDetail,     │       │
│  │          Order, OrderDetail, Session                │       │
│  └─────────────────────────┬───────────────────────────┘       │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  MySQL 8.0 (Docker Container)                                   │
│  - Volume: mysql_data                                           │
│  - Port: 3306 (internal) / 3307 (external)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

```
┌──────────────┐       ┌──────────────┐
│    roles     │       │   Session    │
├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │
│ name         │       │ sid          │
│ description  │       │ data         │
└──────┬───────┘       │ expiresAt    │
       │               └──────────────┘
       │ 1:N
       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   products   │       │   orders     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ username     │       │ name         │       │ totalPrice   │
│ password     │       │ price        │       │ status       │
│ fullName     │       │ image        │       │ paymentMethod│
│ address      │       │ detailDesc   │       │ userId (FK)  │
│ phone        │       │ shortDesc    │       │ cartId (FK)  │
│ accountType  │       │ quantity     │       └──────┬───────┘
│ avatar       │       │ sold         │              │
│ roleId (FK)  │       │ factory      │              │ 1:N
└──────┬───────┘       │ target       │              ▼
       │               └──────┬───────┘       ┌──────────────┐
       │ 1:1                  │               │ order_detail │
       ▼                      │               ├──────────────┤
┌──────────────┐              │               │ id (PK)      │
│    carts     │              │               │ price        │
├──────────────┤              │               │ quantity     │
│ id (PK)      │              │               │ orderId (FK) │
│ sum          │              │               │ productId(FK)│
│ userId (FK)  │              │               └──────────────┘
└──────┬───────┘              │
       │                      │
       │ 1:N                  │
       ▼                      │
┌──────────────┐              │
│ cart_detail  │◄─────────────┘
├──────────────┤      N:1
│ id (PK)      │
│ price        │
│ quantity     │
│ cartId (FK)  │
│ productId(FK)│
└──────────────┘
```

---

## 🐳 DevOps Configuration

### Docker Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────┐      │
│  │     app (Node.js)   │      │    db (MySQL 8.0)   │      │
│  ├─────────────────────┤      ├─────────────────────┤      │
│  │ Image: node:18-alpine│      │ Image: mysql:8.0    │      │
│  │ Port: 3000:3000     │─────▶│ Port: 3307:3306     │      │
│  │ Depends: db         │      │ Health: mysqladmin  │      │
│  │ Restart: unless-stop│      │ Restart: unless-stop│      │
│  └──────────┬──────────┘      └──────────┬──────────┘      │
│             │                            │                  │
│             ▼                            ▼                  │
│  ┌─────────────────────┐      ┌─────────────────────┐      │
│  │  Volume: ./public   │      │ Volume: mysql_data  │      │
│  │  (Bind Mount)       │      │ (Named Volume)      │      │
│  └─────────────────────┘      └─────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dockerfile Features:
- ✅ Multi-stage build ready
- ✅ Alpine-based for minimal image size
- ✅ Non-root user execution (nodejs:1001)
- ✅ Prisma client generation at build time
- ✅ TypeScript compilation
- ✅ Automatic database migrations on startup

---

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with auto salt generation |
| Session Security | express-session with Prisma store |
| JWT Authentication | jsonwebtoken with secret key |
| Role-Based Access | Admin/User roles with middleware guards |
| Input Validation | Zod schema validation |
| SQL Injection Prevention | Prisma parameterized queries |
| CORS | Configurable CORS middleware |

---

## 📁 Project Structure

```
hoi_dan_IT_NODEJS/
├── 📁 src/
│   ├── 📄 app.ts                 # Application entry point
│   ├── 📁 config/
│   │   ├── client.ts             # Prisma client instance
│   │   ├── constant.ts           # App constants
│   │   ├── database.ts           # Database connection
│   │   └── seed.ts               # Database seeding
│   ├── 📁 controllers/
│   │   ├── user.controller.ts    # User CRUD operations
│   │   ├── 📁 admin/             # Admin panel controllers
│   │   └── 📁 client/            # Client-facing controllers
│   ├── 📁 middleware/
│   │   ├── auth.ts               # Authentication guards
│   │   ├── jwt.middleware.ts     # JWT validation
│   │   ├── multer.ts             # File upload handling
│   │   └── passport.local.ts     # Passport configuration
│   ├── 📁 routes/
│   │   ├── api.ts                # REST API routes
│   │   └── web.ts                # Web page routes
│   ├── 📁 services/              # Business logic layer
│   ├── 📁 types/                 # TypeScript definitions
│   ├── 📁 validation/            # Zod schemas
│   └── 📁 views/                 # EJS templates
├── 📁 prisma/
│   ├── schema.prisma             # Database schema
│   └── 📁 migrations/            # 10+ migration files
├── 📁 public/                    # Static assets
├── 📄 Dockerfile                 # Container configuration
├── 📄 docker-compose.yml         # Multi-container setup
├── 📄 package.json               # Dependencies
└── 📄 tsconfig.json              # TypeScript config
```

---

## 🚀 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | User login (returns JWT) |
| GET | `/api/account` | Get current user (requires JWT) |

### Users (CRUD)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/add-product-to-cart` | Add product to cart |

---

## 🛠️ Commands

```bash
# Development
npm run dev              # Start with hot-reload (nodemon + ts-node)
npm run start:debug      # Start with debugger on port 9229

# Production
npm run build            # Compile TypeScript + copy views
npm run start            # Run compiled JavaScript

# Database
npx prisma migrate dev   # Create/apply migrations
npx prisma generate      # Generate Prisma Client
npx prisma studio        # Open database GUI

# Docker
docker compose up --build    # Build and start containers
docker compose down          # Stop containers
docker compose logs -f app   # View app logs
```

---

## 📊 Technical Highlights for Interview

1. **Why TypeScript?**
   - Type safety catches errors at compile time
   - Better IDE support with autocomplete
   - Path aliases for clean imports (`config/*`, `services/*`)

2. **Why Prisma over raw SQL?**
   - Type-safe database queries
   - Auto-generated TypeScript types
   - Easy migration management
   - Prevents SQL injection

3. **Why Docker?**
   - Consistent environment across development/production
   - Easy deployment with single command
   - Database isolation with health checks
   - Volume persistence for data durability

4. **Authentication Strategy:**
   - Web routes: Session-based (Passport.js) for traditional form login
   - API routes: JWT tokens for stateless mobile/SPA clients
   - Both share the same user database

5. **Security Measures:**
   - Non-root Docker user
   - Password hashing with bcrypt
   - Environment variables for secrets
   - Role-based access control middleware

---

## 📈 Potential Improvements (Discussion Points)

- [ ] Add Redis for session storage and caching
- [ ] Implement rate limiting for API endpoints
- [ ] Add Swagger/OpenAPI documentation
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add unit and integration tests (Jest)
- [ ] Implement logging with Winston
- [ ] Add monitoring with Prometheus + Grafana
- [ ] Deploy to AWS/GCP with Kubernetes

---

**Built by:** Minh Tri  
**Tech Stack:** Node.js | TypeScript | Express | MySQL | Prisma | Docker
