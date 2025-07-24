# Deploying Capvid to Vercel

## Quick Deployment

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

### Option 2: Deploy with Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

## Important Limitations on Vercel

⚠️ **Video Processing Constraints**:
- Vercel serverless functions have a 5-minute timeout
- No persistent file storage
- Limited memory (1GB max)
- No FFmpeg in the runtime environment

## Full Production Setup for Vercel

For a complete video processing solution on Vercel, you'll need:

### 1. External Storage
```bash
# Add to your Vercel environment variables
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. External Video Processing
Options:
- **Cloudinary** (recommended for Vercel)
- **AWS MediaConvert** 
- **Google Cloud Video Intelligence**

### 3. Database for Job Status
- **Vercel KV** (Redis)
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)

## Environment Variables for Vercel

Set these in your Vercel dashboard:

```
REACT_APP_API_BASE_URL=/api
```

## File Structure for Vercel

```
capvid/
├── vercel.json                 # Vercel configuration
├── frontend/                   # React app (auto-deployed)
│   ├── .env.vercel            # Vercel-specific environment
│   └── package.json           # Build commands
└── backend/
    └── api/                   # Serverless functions
        ├── index.py           # API root
        ├── upload.py          # Upload handler
        ├── status.py          # Status checker
        └── requirements.txt   # Python dependencies
```

## Demo vs Production

### Current Demo Deployment
- ✅ Frontend works fully
- ✅ Upload endpoint (saves metadata only)
- ✅ Status checking
- ❌ Actual video processing (requires external service)

### For Full Production
You need to integrate with external services. Here's a recommended architecture:

1. **Upload**: Vercel function → Cloud storage (Cloudinary/AWS S3)
2. **Processing**: Cloud function triggers video processing
3. **Status**: Database stores job progress
4. **Download**: Direct links from cloud storage

## Alternative: Hybrid Deployment

For the best of both worlds:

1. **Frontend**: Deploy on Vercel (fast, CDN, free)
2. **Backend**: Deploy on Railway/Render (supports long-running processes)

```bash
# Set this in your Vercel environment
REACT_APP_API_BASE_URL=https://your-backend.railway.app
```

## Testing Your Vercel Deployment

Once deployed, test these endpoints:
- `https://your-app.vercel.app` - Frontend
- `https://your-app.vercel.app/api` - API root
- `https://your-app.vercel.app/api/health` - Health check

## Next Steps

1. **For Demo**: Deploy as-is to showcase the UI and basic functionality
2. **For Production**: Integrate with Cloudinary or similar service
3. **For Full Features**: Consider hybrid deployment (Vercel + Railway/Render)
