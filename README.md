# 🚀 EduGester: Immersive AR Learning Experience

**EduGester** transforms standard classrooms into interactive 3D learning environments where students explore complex concepts through hands-on augmented reality. Powered by Google's MediaPipe, this platform delivers real-time gesture recognition, collaborative 3D model interaction, and secure teacher-student workflows.

## ✨ Key Features

- **🌐 Real-Time 3D Worlds**: Instant transition from browser-based catalog to immersive classrooms using Three.js.
- **✋ Intuitive Gesture Control**: Native MediaPipe integration allows students to interact with 3D models using natural hand movements (zoom, rotate, select).
- **🔄 Curriculum-Aligned Content**: Comprehensive catalog covering Classes 1-10 across Science, Mathematics, and Physics, featuring 3D models of DNA, solar systems, cells, robots, and more.
- **🔒 Secure Authentication**:
  - **Passwordless Magic Links**: Teachers generate secure links for instant student access.
  - **Role-Based Dashboards**: Separate dashboards for Teachers (class management, assignments) and Students (personalized learning progress).
- **📡 Real-Time Collaboration**: Live WebSocket communication enables instant feedback and synchronized interactions between teachers and students.
- **🎯 Adaptive Difficulty**: AI-powered difficulty scaling adjusts complexity based on student performance and model interaction patterns.
- **📱 Progressive Web App**: Offline support and one-click installation for seamless access on any device.
- **🎨 Dynamic Theming**: Automatic light/dark mode switching based on system preferences or user toggle.

## 🛠️ Tech Stack

- **Core Framework**: HTML5, CSS3, JavaScript ES6+
- **3D Graphics**: Three.js, WebGL
- **AI/ML**: Google MediaPipe (Face Mesh, Hands, Pose)
- **Real-Time Communication**: WebSocket API
- **Backend Services**: Node.js, Express.js
- **Database**: SQLite (Local development), MongoDB (Scalable cloud hosting)
- **Authentication**: Custom JWT implementation, Magic Links
- **PWA**: Service Workers, Web App Manifest
- **Deployment**: Vercel (Frontend), Render (Backend)

## 📁 Project Structure

```
edugester/
├── public/                # Frontend assets and entry points
│   ├── index.html           # Main landing page
│   ├── classroom.html       # Immersive classroom interface
│   ├── dashboard.html       # Teacher and student dashboards
│   ├── assets/              # Images, CSS, JS libraries
│   └── manifest.json        # PWA configuration
├── src/                   # Core application logic
│   ├── threeEngine.js       # 3D scene management
│   ├── gestureEngine.js     # MediaPipe integration and gesture recognition
│   ├── classroom.js         # Classroom state management
│   ├── classesCatalog.js    # Curriculum and model data
│   ├── dashboardController.js # Dashboard logic
│   ├── websocketService.js  # WebSocket communication
│   ├── authService.js       # Authentication flows
│   └── main.js              # Application entry point
├── server.js              # Backend server (Node.js/Express)
├── db.js                  # Database configuration
└── package.json           # Project dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (or yarn)
- **Camera access** (for gesture recognition)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd edugester
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

1. **Backend Setup**:
   Ensure `.env` file exists with MongoDB and JWT configuration:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   JWT_LIFETIME=24h
   PORT=5000
   ```

2. **Database Setup**:
   Run the database initialization script:
   ```bash
   node db.js --init
   ```

### Running the Application

Start the development server:

```bash
npm start
```

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

## 🎓 Curriculum Structure

The platform supports a comprehensive K-12 curriculum with 3D models for:

- **Class 1**: Plant Life, Solar System, Basic Shapes
- **Class 2**: Earth Science, Human Body Parts
- **Class 3**: States of Matter, Robotics, Atomic Structure
- **Class 4-5**: Advanced Biology, Space Science
- **Class 6-8**: Cell Biology, Chemistry, Physics
- **Class 9-10**: Human Systems, DNA Helix, Computer Science, Advanced Physics

### Available Models

- **Biological**: Heart, Lungs, DNA Helix, Cells
- **Scientific**: Solar System, Atoms, Molecules, Molecules
- **Mechanical**: Robotic Arm, Robots
- **Geometric**: Cubes, Spheres, Polyhedrons, Crystals

## 📱 Progressive Web App (PWA)

EduGester is a PWA, enabling:

- **Offline Access**: Cache core assets for offline usage
- **Add to Home Screen**: Install the app on mobile devices
- **Background Sync**: Sync learning data when connectivity returns
- **Push Notifications**: Receive class updates and assignments

## 🔐 Authentication Flow

1. **Teacher Login**: Email/Password authentication
2. **Class Creation**: Teachers create classrooms with specific model types
3. **Magic Link Generation**: Secure, time-limited links for student access
4. **Student Access**: Students click link to join classroom instantly
5. **Role-Based Access**: Teachers manage classes; students join and learn

## 📊 AI-Powered Adaptive Learning

The `adaptiveLearning` module adjusts content difficulty in real-time:

- **Performance Tracking**: Monitors correct/incorrect gesture interactions
- **Difficulty Scaling**: Increases complexity for proficient students
- **Personalized Paths**: Recommends relevant modules based on progress
- **Engagement Metrics**: Tracks time spent and interaction depth

## 🧪 Development Guide

### Adding New Models

1. Create a new 3D model file in `public/assets/models/`
2. Add model metadata to `src/classesCatalog.js`
3. Register the model in `threeEngine.js`

### Adding New Curriculum Content

1. Update `CURRICULUM_DATA` in `src/classesCatalog.js`
2. Add corresponding 3D models to the assets folder
3. Test the new flow in the classroom interface

## 📦 Deployment

### Frontend (Vercel)

1. Push changes to GitHub
2. Connect Vercel to the repository
3. Set environment variables in Vercel dashboard

### Backend (Render)

1. Push changes to GitHub
2. Create a new Render web service
3. Add environment variables to Render settings
4. Deploy

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ using **EduGester**