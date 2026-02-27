# FastAPI CRUD Application with CI/CD

A production-ready FastAPI CRUD application with automated CI/CD pipeline using GitHub Actions for deployment to AWS EC2.

## 🚀 Features

- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **FastAPI Framework**: Modern, fast, and async-capable Python web framework
- **SQLAlchemy ORM**: Database abstraction layer with SQLite (easily switchable to PostgreSQL/MySQL)
- **Automated Testing**: Unit tests with pytest
- **CI/CD Pipeline**: GitHub Actions workflow for automated testing and deployment
- **AWS EC2 Deployment**: Automated deployment scripts for EC2 instances
- **Docker Support**: Containerized application with Docker and docker-compose
- **Production Ready**: SystemD service configuration, Nginx reverse proxy

## 📋 Prerequisites

- Python 3.11+
- AWS Account with EC2 instance
- GitHub repository
- Git installed locally

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd cdcddemo
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at: `http://localhost:8000`

### 5. Access API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🐳 Docker Setup

### Build and Run with Docker

```bash
# Build image
docker build -t fastapi-crud .

# Run container
docker run -p 8000:8000 fastapi-crud
```

### Using Docker Compose

```bash
docker-compose up -d
```

## 🧪 Testing

Run the test suite:

```bash
# Install test dependencies
pip install pytest pytest-cov httpx

# Run tests
pytest tests/ -v

# Run tests with coverage
pytest tests/ -v --cov=app --cov-report=html
```

## 📡 API Endpoints

### Health Check
```
GET /health
GET /
```

### CRUD Operations

#### Create Item
```http
POST /items/
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product Description",
  "price": 999,
  "is_available": true
}
```

#### Get All Items
```http
GET /items/?skip=0&limit=100
```

#### Get Single Item
```http
GET /items/{item_id}
```

#### Update Item
```http
PUT /items/{item_id}
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 1299
}
```

#### Delete Item
```http
DELETE /items/{item_id}
```

## ☁️ AWS EC2 Deployment

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2
2. Launch a new instance:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (or larger)
   - **Key Pair**: Create/select a key pair (download .pem file)
   - **Security Group**: Allow ports 22 (SSH), 80 (HTTP), 8000 (API)

### Step 2: Initial EC2 Setup

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

Run the setup script:

```bash
# Copy setup script to EC2
scp -i your-key.pem scripts/setup-ec2.sh ubuntu@your-ec2-public-ip:~

# SSH and run
ssh -i your-key.pem ubuntu@your-ec2-public-ip
chmod +x setup-ec2.sh
./setup-ec2.sh
```

### Step 3: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `EC2_SSH_PRIVATE_KEY`: Content of your .pem file
- `EC2_HOST`: Your EC2 public IP or DNS
- `EC2_USER`: `ubuntu` (or your EC2 username)

### Step 4: Configure GitHub Actions

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) will automatically:

1. **On Pull Request**:
   - Run tests
   - Check code quality

2. **On Push to main/master**:
   - Run tests
   - Deploy to EC2
   - Restart the application

### Step 5: Deploy

Simply push to your main/master branch:

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

The GitHub Actions workflow will automatically deploy to EC2!

## 🔧 Manual Deployment to EC2

If you prefer manual deployment:

```bash
# Copy files to EC2
scp -i your-key.pem -r ./* ubuntu@your-ec2-ip:/home/ubuntu/app/

# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run deployment script
cd /home/ubuntu/app
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 📊 Monitoring

Check application status on EC2:

```bash
# Check service status
sudo systemctl status fastapi-app

# View logs
sudo journalctl -u fastapi-app -f

# Restart service
sudo systemctl restart fastapi-app
```

## 🔒 Security Considerations

1. **Environment Variables**: Use `.env` file for sensitive data (never commit to git)
2. **Database**: Switch to PostgreSQL/MySQL for production
3. **HTTPS**: Configure SSL certificates (Let's Encrypt)
4. **Authentication**: Add JWT or OAuth2 for API security
5. **Rate Limiting**: Implement rate limiting for production
6. **CORS**: Configure CORS settings appropriately

## 📝 Environment Variables

Create a `.env` file for local development:

```env
DATABASE_URL=sqlite:///./app.db
# For PostgreSQL: postgresql://user:password@localhost/dbname
```

## 🏗️ Project Structure

```
cdcddemo/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application and routes
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   └── database.py      # Database configuration
├── tests/
│   ├── __init__.py
│   └── test_main.py     # Test cases
├── scripts/
│   ├── deploy.sh        # Deployment script
│   └── setup-ec2.sh     # EC2 initial setup
├── .github/
│   └── workflows/
│       └── ci-cd.yml    # GitHub Actions workflow
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
├── .gitignore
└── README.md
```

## 🚦 CI/CD Pipeline Flow

```
Push to GitHub
     ↓
GitHub Actions Triggered
     ↓
Run Tests (pytest)
     ↓
Tests Pass?
     ↓ Yes
Deploy to EC2
     ↓
Copy Files via SSH
     ↓
Install Dependencies
     ↓
Restart Service
     ↓
Application Live! 🎉
```

## 🛠️ Troubleshooting

### Application won't start
```bash
# Check logs
sudo journalctl -u fastapi-app -n 50

# Check if port is in use
sudo lsof -i :8000
```

### Database issues
```bash
# Remove database and restart
rm app.db
sudo systemctl restart fastapi-app
```

### GitHub Actions deployment fails
- Verify GitHub Secrets are set correctly
- Check EC2 security group allows SSH (port 22)
- Ensure .pem key has correct permissions

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Your Name

## 🎉 Quick Start Commands

```bash
# Local Development
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Testing
pytest tests/ -v

# Docker
docker-compose up -d

# Production URL (after deployment)
http://your-ec2-ip:8000/docs
```

---

**Note**: Remember to configure your AWS credentials, GitHub secrets, and security groups before deploying to production!

