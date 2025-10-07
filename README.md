# 🎪 Event Sphere

A comprehensive event management system built with React and Node.js, designed for managing events, tasks, teams, and archives with role-based access control.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6+-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [User Roles](#-user-roles)
- [Screenshots](#-screenshots)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality
- 🎯 **Event Management**: Create, update, and track events with detailed information
- ✅ **Task Board**: Kanban-style task management with drag-and-drop functionality
- 📂 **Archive System**: Organize and manage Google Drive links for event resources
- 👥 **User Management**: Role-based access control with multiple permission levels
- 🔐 **Authentication**: Secure JWT-based authentication with password validation
- 📊 **Admin Dashboard**: Comprehensive overview of users, events, and system statistics

### User Experience
- 🎨 **Modern UI**: Beautiful, responsive interface built with TailwindCSS
- ⚡ **Loading Skeletons**: Smooth loading states for better perceived performance
- 🔔 **Toast Notifications**: Real-time feedback for user actions
- ✅ **Confirmation Dialogs**: Color-coded confirmations for destructive actions
- 🔍 **Smart Search**: Filter and search across events, tasks, and users
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Security & Data Integrity
- 🔒 **Password Security**: Bcrypt hashing with strong password requirements
- 🛡️ **Role-Based Access**: Granular permissions for different user types
- 🔐 **JWT Authentication**: Secure token-based authentication
- 🔄 **Transaction Support**: Atomic operations for data consistency
- 🚫 **Sensitive Data Protection**: Automatic sanitization of logs
- ⏰ **Account Lockout**: Protection against brute force attacks

### Validation & Error Handling
- ✔️ **Date Validations**: Smart validation for event dates and durations
- 📝 **Form Validation**: Real-time validation with helpful error messages
- 🚨 **Error Recovery**: User-friendly error messages with actionable guidance
- 🔄 **Retry Mechanisms**: Automatic and manual retry options for failed requests

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router v6** - Navigation and routing
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API calls
- **React Beautiful DnD** - Drag and drop functionality

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Winston** - Logging framework

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Auto-restart server during development

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- MongoDB v6 or higher
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/trishit-guin/event-sphere.git
   cd event-sphere
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGO_URI=mongodb://localhost:27017/event-sphere

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=1d
   JWT_ISSUER=event-sphere
   JWT_AUDIENCE=event-sphere-users

   # CORS
   CORS_ORIGIN=http://localhost:5173
   ```

   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

5. **Initialize the database with first admin user**
   ```bash
   cd backend
   node createFirstCoreHead.js
   ```

   This creates:
   - Admin user: `undefined@gmail.com` / `123456` (change after first login!)
   - Dummy event for testing

6. **Start the development servers**

   **Backend** (in `backend` directory):
   ```bash
   npm run dev
   ```

   **Frontend** (in `frontend` directory):
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

8. **Login with default credentials**
   - Email: `undefined@gmail.com`
   - Password: `123456`
   - ⚠️ **Important**: Change password immediately after first login!

## 📁 Project Structure

```
event-sphere/
├── backend/
│   ├── bin/
│   │   └── www                  # Server startup script
│   ├── config/
│   │   └── config.js            # Configuration constants
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── role.js              # Role-based authorization
│   │   └── errorHandler.js     # Error handling middleware
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Event.js             # Event model
│   │   ├── Task.js              # Task model
│   │   └── ArchiveLink.js       # Archive link model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User management routes
│   │   ├── events.js            # Event management routes
│   │   ├── tasks.js             # Task management routes
│   │   ├── archive.js           # Archive management routes
│   │   └── admin.js             # Admin routes
│   ├── utils/
│   │   ├── logger.js            # Winston logger configuration
│   │   ├── eventUtils.js        # Event utility functions
│   │   ├── password.js          # Password validation utilities
│   │   └── transactions.js      # MongoDB transaction utilities
│   ├── app.js                   # Express app configuration
│   ├── createFirstCoreHead.js   # Database initialization script
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── assets/              # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmDialog.jsx       # Confirmation dialogs
│   │   │   ├── LoadingSkeletons.jsx    # Loading skeletons
│   │   │   ├── ErrorHandling.jsx       # Error components
│   │   │   ├── EnhancedEvents.jsx      # Event list/detail views
│   │   │   ├── EventForm.jsx           # Event creation/edit form
│   │   │   ├── UserCreationForm.jsx    # User creation form
│   │   │   └── SystemAdmin.jsx         # System admin panel
│   │   ├── config/
│   │   │   └── config.js        # Frontend configuration
│   │   ├── AdminDashboard.jsx   # Admin dashboard page
│   │   ├── Archive.jsx          # Archive management page
│   │   ├── Dashboard.jsx        # User dashboard
│   │   ├── Events.jsx           # Events page
│   │   ├── Login.jsx            # Login page
│   │   ├── Navbar.jsx           # Navigation bar
│   │   ├── Profile.jsx          # User profile page
│   │   ├── Taskboard.jsx        # Kanban task board
│   │   ├── App.jsx              # Main app component
│   │   ├── api.js               # API client
│   │   ├── main.jsx             # App entry point
│   │   ├── App.css              # App styles
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── TRANSACTIONS.md              # Transaction implementation guide
├── CONFIRMATION_DIALOGS.md      # Confirmation dialog documentation
├── SENSITIVE_DATA_LOGGING.md    # Security logging guidelines
├── FIX_SUMMARY.md              # Complete fix implementation summary
└── README.md                    # This file
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user (admin only)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "event_coordinator"
}
```

#### POST `/api/auth/login`
Login with email and password
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### GET `/api/auth/role-constants`
Get available role constants

### Event Endpoints

#### GET `/api/events`
Get all events (filtered by user role)

Query parameters:
- `status`: Filter by status (draft, active, completed, cancelled)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### GET `/api/events/:id`
Get event details by ID

#### POST `/api/events`
Create a new event (requires event_coordinator or higher)
```json
{
  "title": "Annual Conference 2025",
  "description": "Our biggest event of the year",
  "startDate": "2025-12-01T09:00:00Z",
  "endDate": "2025-12-03T17:00:00Z",
  "location": "Convention Center",
  "maxParticipants": 500,
  "status": "draft"
}
```

#### PUT `/api/events/:id`
Update an event

#### DELETE `/api/events/:id`
Delete an event (admin only)

#### PATCH `/api/events/:id/status`
Change event status
```json
{
  "status": "active"
}
```

### Task Endpoints

#### GET `/api/tasks`
Get all tasks for assigned events

Query parameters:
- `eventId`: Filter by event ID
- `status`: Filter by status (pending, in_progress, completed)

#### POST `/api/tasks`
Create a new task
```json
{
  "eventId": "event_id_here",
  "title": "Setup registration desk",
  "description": "Prepare materials and signage",
  "status": "pending",
  "assignedTo": "user_id_here",
  "priority": "high",
  "dueDate": "2025-11-30T12:00:00Z"
}
```

#### PUT `/api/tasks/:id`
Update a task

#### DELETE `/api/tasks/:id`
Delete a task

### Archive Endpoints

#### GET `/api/archive`
Get archive links for assigned events

Query parameters:
- `eventId`: Filter by event ID

#### POST `/api/archive`
Create a new archive link
```json
{
  "eventId": "event_id_here",
  "title": "Event Photos",
  "driveUrl": "https://drive.google.com/..."
}
```

#### PUT `/api/archive/:id`
Update an archive link

#### DELETE `/api/archive/:id`
Delete an archive link

### User Endpoints

#### GET `/api/users/me`
Get current user profile

#### PUT `/api/users/profile`
Update profile (name, email)
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

#### POST `/api/users/change-password`
Change password
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

### Admin Endpoints

#### GET `/api/admin/users`
Get all users (admin only)

#### PUT `/api/admin/users/:id`
Update user (admin only)

#### DELETE `/api/admin/users/:id`
Delete user (admin only)

#### POST `/api/admin/events/:id/assign`
Assign user to event with role

## 👥 User Roles

### Role Hierarchy

1. **Admin** (`admin`)
   - Full system access
   - Create/edit/delete all events and users
   - Assign roles to users
   - Access system administration panel
   - View all data across events

2. **Technical Head** (`te_head`)
   - Manage technical aspects of events
   - Create and assign tasks
   - View assigned events
   - Cannot delete events or users

3. **Backend Head** (`be_head`)
   - Manage backend operations
   - Similar permissions to Technical Head
   - Focus on backend-related tasks

4. **Event Coordinator** (`event_coordinator`)
   - Create and manage events
   - Assign users to events
   - Create tasks for events
   - Cannot delete events without admin approval

5. **Team Member** (`team_member`)
   - View assigned events
   - Update task status
   - View archive links
   - Limited edit permissions

### Role-Based Features

| Feature | Admin | TE/BE Head | Event Coord | Team Member |
|---------|-------|------------|-------------|-------------|
| Create Events | ✅ | ✅ | ✅ | ❌ |
| Delete Events | ✅ | ❌ | ❌ | ❌ |
| Create Users | ✅ | ❌ | ❌ | ❌ |
| Assign Roles | ✅ | ❌ | ✅* | ❌ |
| Create Tasks | ✅ | ✅ | ✅ | ❌ |
| Update Tasks | ✅ | ✅ | ✅ | ✅** |
| View All Events | ✅ | ❌ | ❌ | ❌ |
| System Admin | ✅ | ❌ | ❌ | ❌ |

\* Event coordinators can only assign to their events  
\** Team members can only update their assigned tasks

## 🖼 Screenshots

### Login Page
Clean and secure authentication interface with form validation.

### Dashboard
Overview of assigned events, tasks, and quick actions based on user role.

### Event Management
Create, view, and manage events with detailed information and status tracking.

### Kanban Task Board
Drag-and-drop task management with status columns:
- 📋 Pending
- 🔄 In Progress
- ✅ Completed

### Archive System
Organize Google Drive links by event with search and filter capabilities.

### Admin Dashboard
Comprehensive system overview with user management and statistics.

## 💻 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Style
```bash
# Lint backend
cd backend
npm run lint

# Lint frontend
cd frontend
npm run lint
```

### Database Management

#### Reset Database
```bash
cd backend
node createFirstCoreHead.js
```

#### Backup Database
```bash
mongodump --db event-sphere --out ./backup
```

#### Restore Database
```bash
mongorestore --db event-sphere ./backup/event-sphere
```

### Environment Variables

#### Backend Environment Variables
```env
# Required
MONGO_URI=mongodb://localhost:27017/event-sphere
JWT_SECRET=your-secret-key

# Optional
PORT=5000
NODE_ENV=development
JWT_EXPIRES_IN=1d
JWT_ISSUER=event-sphere
JWT_AUDIENCE=event-sphere-users
CORS_ORIGIN=http://localhost:5173
```

#### Frontend Environment Variables
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🚢 Deployment

### MongoDB Replica Set Setup (Required for Transactions)

```bash
# Start MongoDB with replica set
mongod --replSet rs0 --port 27017 --dbpath /data/db

# Initialize replica set
mongo
> rs.initiate()
```

### Production Build

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Set Production Environment**
   ```env
   NODE_ENV=production
   MONGO_URI=mongodb://your-production-db
   JWT_SECRET=strong-random-secret-for-production
   CORS_ORIGIN=https://your-domain.com
   ```

3. **Start Backend**
   ```bash
   cd backend
   npm start
   ```

4. **Serve Frontend**
   - Use nginx, Apache, or any static file server
   - Configure reverse proxy to backend API

### Docker Deployment (Optional)

```dockerfile
# Dockerfile example for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up MongoDB authentication
- [ ] Enable MongoDB replica set for transactions
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Icons from various open-source icon libraries
- Community feedback and contributions

## 📞 Support

For support, questions, or feedback:
- Create an issue on GitHub
- Email: trishit.guin@example.com

## 🗺 Roadmap

### Upcoming Features
- [ ] Email notifications for task assignments
- [ ] Calendar view for events
- [ ] Advanced analytics dashboard
- [ ] Export data to CSV/PDF
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration features
- [ ] Integration with Google Calendar
- [ ] File upload for task attachments
- [ ] Comment system for tasks and events
- [ ] Activity audit log

### Recent Updates (v2.0.0)
- ✅ Role constants API endpoint
- ✅ User profile edit functionality
- ✅ Enhanced event date validations
- ✅ Removed file upload logic (simplified architecture)
- ✅ Improved error messages throughout
- ✅ MongoDB transaction support
- ✅ Loading skeleton components
- ✅ Confirmation dialogs with color coding
- ✅ Sensitive data logging prevention

## 📊 Project Stats

- **Total Lines of Code**: ~15,000+
- **Backend Routes**: 50+
- **Frontend Components**: 20+
- **API Endpoints**: 40+
- **User Roles**: 5
- **Security Features**: 10+

---

**Made with ❤️ by the Event Sphere Team**

*Last Updated: October 8, 2025*
