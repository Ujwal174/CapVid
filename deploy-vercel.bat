@echo off

echo 🚀 Deploying Capvid to Vercel...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Set up Vercel environment for frontend build
cd frontend
copy .env.vercel .env.production
cd ..

REM Deploy to Vercel
echo 📤 Starting deployment...
vercel --prod

echo ✅ Deployment complete!
echo 🌐 Your app should be available at the URL shown above
echo.
echo 📝 Note: This deploys a demo version with limited video processing
echo 💡 For full production, see VERCEL_DEPLOYMENT.md

pause
