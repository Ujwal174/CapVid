@echo off

REM Production deployment script for Capvid (Windows)

echo 🚀 Starting Capvid deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Build and start containers
echo 🔨 Building and starting containers...
docker-compose up -d --build

REM Check if containers are running
echo ✅ Checking container status...
docker-compose ps

echo 🎉 Deployment complete!
echo 📱 Frontend: http://localhost
echo 🖥️  Backend API: http://localhost:5001
echo.
echo 📝 To view logs:
echo    docker-compose logs -f backend
echo    docker-compose logs -f frontend
echo.
echo 🛑 To stop:
echo    docker-compose down

pause
