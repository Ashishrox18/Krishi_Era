# ✅ CORS Fixed for Main Branch

## Problem

The main branch URL (`https://main.d3o65ri2eglx5a.amplifyapp.com`) was getting CORS errors when trying to access the backend API:

```
Access to XMLHttpRequest at 'https://d2ah0elagm6okv.cloudfront.net/api/auth/login' 
from origin 'https://main.d3o65ri2eglx5a.amplifyapp.com' has been blocked by CORS policy
```

## Root Cause

The backend CORS configuration didn't include the main branch URL. It only had:
- `https://feature-deployment.d3o65ri2eglx5a.amplifyapp.com` (feature branch)
- `https://d3o65ri2eglx5a.amplifyapp.com` (root domain)

But was missing:
- `https://main.d3o65ri2eglx5a.amplifyapp.com` (main branch)

## Solution

Updated `backend/src/server.ts` CORS configuration to include all Amplify URLs:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://krishiai.in',
    'https://www.krishiai.in',
    'https://main.d3o65ri2eglx5a.amplifyapp.com',              // ✅ Added
    'https://feature-deployment.d3o65ri2eglx5a.amplifyapp.com',
    'https://d3o65ri2eglx5a.amplifyapp.com',
    'https://d2ah0elagm6okv.cloudfront.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Steps Taken

1. ✅ Updated CORS configuration in `backend/src/server.ts`
2. ✅ Rebuilt Docker image for linux/amd64
3. ✅ Pushed new image to ECR
4. ✅ Forced new ECS deployment
5. ✅ Invalidated CloudFront cache
6. ✅ Waited for service to stabilize
7. ✅ Verified CORS headers are now correct

## Verification

```bash
# Test CORS preflight request
curl -I -X OPTIONS https://d2ah0elagm6okv.cloudfront.net/api/auth/login \
  -H "Origin: https://main.d3o65ri2eglx5a.amplifyapp.com" \
  -H "Access-Control-Request-Method: POST"

# Response includes:
# access-control-allow-origin: https://main.d3o65ri2eglx5a.amplifyapp.com ✅
# access-control-allow-credentials: true ✅
# access-control-allow-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS ✅
```

## Status

✅ **FIXED** - Main branch can now make API calls without CORS errors

## Testing

Try logging in again on the main branch:
```
https://main.d3o65ri2eglx5a.amplifyapp.com
```

The CORS error should be gone and API calls should work correctly.

## All Allowed Origins

The backend now accepts requests from:

| Origin | Purpose |
|--------|---------|
| http://localhost:5173 | Local development (Vite) |
| http://localhost:3000 | Local development (alternative) |
| https://krishiai.in | Custom domain (when configured) |
| https://www.krishiai.in | Custom domain www |
| https://main.d3o65ri2eglx5a.amplifyapp.com | Production (main branch) |
| https://feature-deployment.d3o65ri2eglx5a.amplifyapp.com | Staging (feature branch) |
| https://d3o65ri2eglx5a.amplifyapp.com | Root Amplify domain |
| https://d2ah0elagm6okv.cloudfront.net | CloudFront (if needed) |

## Future Branches

If you create new branches in Amplify, remember to add their URLs to the CORS configuration:

1. Add the new URL to `backend/src/server.ts` CORS origins
2. Rebuild and redeploy backend:
   ```bash
   docker build --platform linux/amd64 -t krishi-era-backend:latest backend/
   docker tag krishi-era-backend:latest 120569622669.dkr.ecr.us-east-1.amazonaws.com/krishi-era-backend:latest
   docker push 120569622669.dkr.ecr.us-east-1.amazonaws.com/krishi-era-backend:latest
   aws ecs update-service --cluster krishi-era-cluster --service krishi-backend-service --force-new-deployment --region us-east-1
   ```
3. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id E1I25DV11X4B13 --paths "/*"
   ```

## Alternative: Wildcard CORS (Not Recommended for Production)

For development, you could use a wildcard pattern, but this is less secure:

```typescript
// NOT RECOMMENDED for production
origin: (origin, callback) => {
  if (!origin || origin.includes('amplifyapp.com') || origin.includes('localhost')) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}
```

The explicit list approach (current implementation) is more secure and recommended for production.
