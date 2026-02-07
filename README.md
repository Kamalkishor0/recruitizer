# Recruitizer

A comprehensive AI-powered interview platform that connects recruiters with candidates, featuring automated question generation, interview management, and intelligent candidate matching using machine learning.

## 🌟 Features

### For Recruiters
- **Question Bank Management**: Create, organize, and manage interview questions
- **AI-Powered Question Generation**: Generate interview questions using Gemini AI
- **Interview Template Creation**: Build reusable interview templates
- **Test Assignment**: Assign interviews to candidates
- **Dashboard Analytics**: View interview statistics and candidate performance
- **Top Candidates Tracking**: Monitor and identify high-performing candidates

### For Candidates
- **Job Discovery**: Browse and search available job opportunities
- **Resume Upload & Analysis**: Upload resumes for automatic parsing and analysis
- **Interview Taking**: Complete assigned interviews with a user-friendly interface
- **Dashboard**: Track interview assignments and application status

### Platform Features
- **Authentication & Authorization**: Secure login system with role-based access
- **ML-Powered Recommendations**: Intelligent job matching and candidate recommendations
- **Resume Embeddings**: Advanced resume analysis using machine learning
- **Real-time Updates**: Live status tracking for interviews and applications

## 🏗️ Architecture

The platform consists of three main services:

```
recruitizer/
├── client/          # Next.js frontend application
├── server/          # Node.js/Express backend API
└── ml-services/     # Python FastAPI ML microservice
```

### Technology Stack

#### Frontend (Client)
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Native Fetch API

#### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT + Auth0
- **File Upload**: Multer

#### ML Services
- **Framework**: FastAPI (Python)
- **ML Libraries**: 
  - Sentence Transformers (Embeddings)
  - scikit-learn
  - NumPy, Pandas
- **API Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Python** (v3.8 or higher)
- **MongoDB** (v6.0 or higher)
- **Docker** (optional, for ML services)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Kamalkishor0/recruitizer.git
cd recruitizer
```

### 2. Environment Setup

Create `.env` files for each service:

#### Server (.env in `/server`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/recruitizer
JWT_SECRET=your_jwt_secret_key
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
ML_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_api_key
```

#### Client (.env.local in `/client`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### ML Services (.env in `/ml-services`)

```env
MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
API_VERSION=v1
LOG_LEVEL=info
```

### 3. Install Dependencies

#### Install Server Dependencies

```bash
cd server
npm install
```

#### Install Client Dependencies

```bash
cd ../client
npm install
```

#### Install ML Services Dependencies

```bash
cd ../ml-services
pip install -r requirements.txt
# OR using virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Start MongoDB

Ensure MongoDB is running on your system:

```bash
# On Linux/Mac
sudo systemctl start mongodb
# OR
mongod

# On Windows
net start MongoDB
```

### 5. Run the Applications

#### Start the Server (Terminal 1)

```bash
cd server
npm start
# OR for development with auto-reload
npm run dev
```

Server will run on `http://localhost:5000`

#### Start ML Services (Terminal 2)

```bash
cd ml-services
uvicorn app.main:app --reload --port 8000
# OR using Docker
docker build -t recruitizer-ml .
docker run -p 8000:8000 recruitizer-ml
```

ML API will run on `http://localhost:8000`

#### Start the Client (Terminal 3)

```bash
cd client
npm run dev
```

Client will run on `http://localhost:3000`

## 📁 Project Structure

### Client Structure

```
client/src/
├── app/                    # Next.js app directory (routes)
│   ├── candidate/         # Candidate dashboard pages
│   ├── recruiter/         # Recruiter dashboard pages
│   ├── login/             # Authentication pages
│   └── register/
├── components/            # Reusable React components
│   ├── auth/             # Authentication components
│   ├── candidate/        # Candidate-specific components
│   ├── recruiter/        # Recruiter-specific components
│   └── layout/           # Layout components
├── context/              # React Context providers
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions and API clients
```

### Server Structure

```
server/src/
├── controllers/          # Request handlers
├── models/              # MongoDB schemas
├── routes/              # API route definitions
├── middlewares/         # Express middlewares
└── utils/               # Helper functions
```

### ML Services Structure

```
ml-services/app/
├── api/v1/              # API endpoints
├── services/            # ML service logic
└── core/                # Configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### Recruiter Routes
- `GET /recruiters/dashboard` - Get dashboard statistics
- `POST /questions` - Create question
- `GET /questions` - List questions
- `POST /interview-templates` - Create interview template
- `POST /recruiters/assign-test` - Assign interview to candidate

### Candidate Routes
- `GET /candidates/dashboard` - Get candidate dashboard
- `GET /candidates/jobs` - List available jobs
- `POST /candidates/resume` - Upload resume
- `GET /candidates/assignments` - Get assigned interviews
- `POST /candidates/start-test/:id` - Start interview
- `POST /submit/:id` - Submit interview

### ML Service Routes
- `GET /api/v1/health` - Health check
- `POST /api/v1/embeddings` - Generate embeddings
- `POST /api/v1/recommendations` - Get job recommendations

## 🐳 Docker Deployment (Optional)

### Build ML Service with Docker

```bash
cd ml-services
docker build -t recruitizer-ml .
docker run -p 8000:8000 recruitizer-ml
```

## 🔐 Authentication

The platform uses a hybrid authentication approach:
- **JWT tokens** for session management stored in HTTP-only cookies
- **Auth0** for email verification (backend only)
- **bcrypt** for password hashing
- **Role-based access control** (Recruiter/Candidate)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Kamalkishor Singh**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kamalkishor-singh/)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=x&logoColor=white)](https://x.com/kamalkishor_45)

---