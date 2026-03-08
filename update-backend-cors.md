# Update Backend CORS for Amplify

Your frontend is now live, but the backend needs to allow requests from the Amplify domain.

## Update CORS Settings

Edit `backend/src/index.ts` and update the CORS configuration:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://feature-deployment.d3o65ri2eglx5a.amplifyapp.com',  // Add this line
    'https://d3o65ri2eglx5a.amplifyapp.com'                      // Add this line too
  ],
  credentials: true
}));
```

## Redeploy Backend

```bash
cd backend
./deploy-ecs.sh
```

Or manually:
```bash
# Build and push Docker image
docker build --platform linux/amd64 -t krishi-era-backend:latest backend/
docker tag krishi-era-backend:latest 120569622669.dkr.ecr.us-east-1.amazonaws.com/krishi-era-backend:latest
docker push 120569622669.dkr.ecr.us-east-1.amazonaws.com/krishi-era-backend:latest

# Force new deployment
aws ecs update-service --cluster krishi-era-cluster --service krishi-backend-service --force-new-deployment --region us-east-1
```

## Verify

After updating CORS, test your app:
1. Open: https://feature-deployment.d3o65ri2eglx5a.amplifyapp.com
2. Try logging in
3. Check browser console for any CORS errors
