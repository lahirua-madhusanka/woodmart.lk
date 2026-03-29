# Woodmart.lk - Full-Stack Premium eCommerce

Production-oriented eCommerce application with a React frontend and Node.js/Express/MongoDB backend, including JWT auth, cart/wishlist sync, checkout flow, Stripe payment integration, order history, and a full admin dashboard.

## Stack
- Frontend: React, React Router, Tailwind CSS, Framer Motion, Axios, React Toastify, Stripe Elements
- Backend: Node.js, Express.js, MongoDB (Mongoose), JWT, bcrypt, express-validator, Stripe

## Brand Theme
- Primary color: #0959a4

## Project Structure

```text
.
|-- src
|   |-- components
|   |   |-- auth
|   |   |   `-- PrivateRoute.jsx
|   |   |-- admin
|   |   |-- home
|   |   |-- layout
|   |   `-- products
|   |-- context
|   |   |-- AuthContext.jsx
|   |   `-- StoreContext.jsx
|   |-- data
|   |-- pages
|   |   |-- admin
|   |   |-- AboutPage.jsx
|   |   |-- AuthPage.jsx
|   |   |-- CartPage.jsx
|   |   |-- CheckoutPage.jsx
|   |   |-- ContactPage.jsx
|   |   |-- HomePage.jsx
|   |   |-- OrderConfirmationPage.jsx
|   |   |-- OrdersPage.jsx
|   |   |-- ProductDetailsPage.jsx
|   |   |-- ShopPage.jsx
|   |   `-- WishlistPage.jsx
|   |-- routes
|   |   `-- AdminRoute.jsx
|   `-- services
|       |-- adminApi
|       |-- apiClient.js
|       |-- authService.js
|       |-- cartService.js
|       |-- orderService.js
|       |-- productService.js
|       `-- wishlistService.js
`-- server
    |-- config
    |   |-- db.js
    |   `-- env.js
    |-- controllers
    |-- middleware
    |-- models
    |-- routes
    |-- .env.example
    `-- server.js
```

## Environment Variables

### Frontend (`.env`)
Copy from `.env.example`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
```

### Backend (`server/.env`)
Copy from `server/.env.example`:

```bash
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/atelier_oak
JWT_SECRET=replace_with_a_secure_long_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_replace_me
```

## Install

### 1. Root (frontend)
```bash
npm install
```

### 2. Backend
```bash
npm install --prefix server
```

## Run

### Frontend only
```bash
npm run dev
```

### Backend only
```bash
npm run server
```

### Full stack together
```bash
npm run dev:full
```

## Build Frontend
```bash
npm run build
npm run preview
```

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Products
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `POST /api/products/:id/reviews` (auth)

### Cart
- `GET /api/cart`
- `POST /api/cart/add`
- `PUT /api/cart/update`
- `DELETE /api/cart/remove`

### Wishlist
- `GET /api/wishlist`
- `POST /api/wishlist/add`
- `DELETE /api/wishlist/remove`

### Orders / Payments
- `POST /api/orders/create-payment-intent`
- `POST /api/orders/create`
- `GET /api/orders/user`
- `GET /api/orders/:id`

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:id/status`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/role`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/categories`
- `GET /api/admin/reviews`

## Checkout Flow Implemented
1. Cart review
2. Shipping address
3. Order summary
4. Payment selection (Stripe card or COD)
5. Order confirmation

## Security Included
- Password hashing with bcrypt
- JWT-based authentication
- Protected/private routes
- Admin-only product management routes
- Input validation with express-validator
- Helmet + CORS + HTTP-only auth cookie support
- Stock validation before order creation

## Example Axios Calls

```js
// Login
await apiClient.post("/auth/login", {
  email: "john@example.com",
  password: "secret123",
});

// Add to cart
await apiClient.post("/cart/add", {
  productId: "67ff123abcde4567890f1234",
  quantity: 2,
});

// Create payment intent
await apiClient.post("/orders/create-payment-intent", {
  amount: 149.99,
});

// Create order
await apiClient.post("/orders/create", {
  shippingAddress: {
    fullName: "John Doe",
    line1: "12 Main Street",
    line2: "",
    city: "Colombo",
    postalCode: "00100",
    country: "Sri Lanka",
    phone: "+94 77 123 4567",
  },
  paymentStatus: "paid",
  paymentIntentId: "pi_123",
});
```

## Notes
- If MongoDB has no products, use admin product creation API or seed route to add catalog data.
- Stripe card flow requires valid test keys in both frontend and backend env files.
- Admin routes/pages require a logged-in user with `role: admin`.
