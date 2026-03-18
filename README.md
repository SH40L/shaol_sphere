# 🌐 SHAOL Sphere - Social Networking Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-blue)](https://your-render-url-here.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.10-blue)](https://www.python.org/)
[![Framework](https://img.shields.io/badge/Framework-Flask-red)](https://flask.palletsprojects.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-orange)](https://postgresql.org/)

## 📌 Project Overview
SHAOL Sphere is a comprehensive, full-stack social networking web application. It is designed to connect users through dynamic feeds, profile management, friend discovery, and real-time interactions. 

The platform features a highly secure, modular backend powered by Flask and JWT authentication, alongside a responsive frontend built with modern web standards.

---

## ✨ Key Features
* **Secure Authentication:** Robust login system using JWT (JSON Web Tokens), Flask-Login, secure password hashing, and SMTP-based email verification.
* **Dynamic Feed:** Interactive social feed where users can create posts (with images), leave comments, like content, and share posts from others.
* **Profile Management:** Fully customizable user profiles with Cloudinary-backed profile and cover image uploads.
* **Emergency Alerts:** Built-in emergency routing system that instantly sends geolocation alerts and in-app notifications to a user's followers.
* **Real-time Notifications:** In-app notification system to track likes, comments, shares, follows, and emergency alerts.

---

## 🛠️ Tech Stack
* **Backend:** Python, Flask, Flask-SQLAlchemy, PyJWT
* **Frontend:** HTML5, CSS3, JavaScript (Modular ES6)
* **Database:** PostgreSQL (Cloud hosted via Neon)
* **Cloud Storage:** Cloudinary API for media management
* **Email Service:** Standard SMTP (via `Flask-Mail`) for verification and password resets
* **Deployment:** Render, Gunicorn (`Procfile` configured)

---

## 🚀 Environment Variables (`.env`)
To run this project locally, create a `.env` file in the root directory. *Never commit your actual `.env` file to version control.*

```env
# Core Settings
SECRET_KEY=your_flask_secret_key
DATABASE_URL=your_postgresql_database_url
JWT_EXPIRATION_MINUTES=30

# SMTP Email Configuration (Flask-Mail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_gmail_address
MAIL_PASSWORD=your_gmail_app_password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret