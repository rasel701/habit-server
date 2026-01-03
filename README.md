# 🌟 Habit Tracker Backend

This is the **backend server** for **Habit Tracker**, a web application to track and manage daily habits.  
It provides RESTful APIs for user authentication, habit management, marking habits as complete, searching, and filtering by category.

---

## 🌐 Live Server
vercel-https://habit-server-psi.vercel.app/ 

---

## ✨ Features

- **User Authentication** — Secure login using Firebase Authentication.
- **Habit Management**  
  - Add, update, delete, and fetch habits.
- **Mark Complete** — Track daily completion with completion history.
- **Search & Filter** — Search habits by title or filter by category.
- **User-Specific Data** — Only authorized users can delete or modify their habits.
- **Secure Endpoints** — Protected routes verified with Firebase ID token.

---

## 🛠️ Tech Stack

| Node.js | Express.js | MongoDB | Firebase Admin |
|---------|------------|---------|----------------|
| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" width="45"/> | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/express/express-original.svg" width="45"/> | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/mongodb/mongodb-original.svg" width="45"/> | <img src="https://www.vectorlogo.zone/logos/firebase/firebase-icon.svg" width="45"/> |

---

## 📁 API Endpoints

### **Habits**
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/habit-info` | Get all habits |
| GET | `/habit-latest` | Get latest 6 habits |
| GET | `/habit-info/:id` | Get habit by ID |
| GET | `/my-habit?email=` | Get habits of a specific user |
| GET | `/habit-category?category=` | Filter habits by category |
| GET | `/habit-search?search=` | Search habits by title |
| GET | `/mark-complete/:id?userEmail=` | Mark habit as complete |
| POST | `/habit-info` | Add a new habit |
| PATCH | `/habit-info/:id` | Update a habit |
| DELETE | `/habit-info/:id?email=` | Delete a habit (Firebase auth protected) |

---

## ⚙️ Installation & Setup

1️⃣ Clone the repository
```bash
git clone https://github.com/rasel701/habit-server.git
```

2️⃣ Install dependencies
```bash
npm install
```

3️⃣ Create a `.env` file:
```
DB_USERNAME=your_mongodb_username
DB_PASSWORD=your_mongodb_password

```

4️⃣ Start the server
```bash
npm run start
```
or for development mode:
```bash
npm run dev
```

---

## 🔐 Authentication

- Firebase Admin SDK is used for verifying users.
- Include Firebase token in `Authorization` header:
```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```
- Only authorized users can delete their own habits.

---

## 👨‍💻 Developer

**Rasel Mia**  
📧 Email: rasel708211@gmail.com

---

⭐ _If you like this project, don’t forget to star the repository!_
