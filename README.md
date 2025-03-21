# Book Management API

This is a simple Book Management API built with **Node.js**, **Express.js**, and **MongoDB**. It supports user authentication with **JWT tokens** and provides protected routes for managing books.

## 🚀 Getting Started

### 1️⃣ Install Dependencies

```sh
npm install
```

### 2️⃣ Start Your Server

Run the server using:

```sh
node index.js
```

Or with **nodemon** for auto-reloading:

```sh
nodemon index.js
```

The server will run at:

```sh
http://localhost:5000
```

---

## 🔐 Authentication

### 3️⃣ Register a New User

**Method:** `POST`
**URL:** `http://localhost:5000/register`

**Body (JSON):**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

**Expected Response:**

```json
{
  "acknowledged": true,
  "insertedId": "your-user-id"
}
```

### 4️⃣ Login to Get Token

**Method:** `POST`
**URL:** `http://localhost:5000/login`

**Body (JSON):**

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

**Expected Response:**

```json
{
  "success": true,
  "token": "your-jwt-token"
}
```

📌 **Copy the token** for the next steps.

---

## 📚 Book API (Protected Routes)

For all requests below, **add the token** in Postman under **Headers**:

```
Key: Cookie
Value: token=your-jwt-token
```

### 5️⃣ Fetch All Books

**Method:** `GET`
**URL:** `http://localhost:5000/book`

**Expected Response:**

```json
[
  {
    "_id": "some-book-id",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald"
  }
]
```

### 6️⃣ Add a New Book

**Method:** `POST`
**URL:** `http://localhost:5000/book`

**Body (JSON):**

```json
{
  "title": "1984",
  "author": "George Orwell"
}
```

**Expected Response:**

```json
{
  "acknowledged": true,
  "insertedId": "new-book-id"
}
```

### 7️⃣ Fetch a Single Book

**Method:** `GET`
**URL:** `http://localhost:5000/book/{book-id}`

**Expected Response:**

```json
{
  "_id": "book-id",
  "title": "1984",
  "author": "George Orwell"
}
```

### 8️⃣ Update a Book

**Method:** `PUT`
**URL:** `http://localhost:5000/book/{book-id}`

**Body (JSON):**

```json
{
  "title": "Animal Farm",
  "author": "George Orwell"
}
```

**Expected Response:**

```json
{
  "modifiedCount": 1
}
```

### 9️⃣ Delete a Book

**Method:** `DELETE`
**URL:** `http://localhost:5000/book/{book-id}`

**Expected Response:**

```json
{
  "deletedCount": 1
}
```

---

## 🔑 Logout

**Method:** `POST`
**URL:** `http://localhost:5000/logout`

**Expected Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---
