# Deployment Guide

## Environment Variables Required

Make sure to set these environment variables in your deployment platform (Render, Heroku, etc.):

### Database
```
MONGODB_URI=your_mongodb_connection_string
```
## Deployment Platforms

### Render
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment: Node.js

### Heroku
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment: Node.js

### Vercel
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment: Node.js

## File Structure
```
backend/
├── server.js          # Main server file
├── index.js           # Entry point (requires server.js)
├── package.json       # Dependencies and scripts
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── views/
└── public/
```

## Troubleshooting

1. **Module not found errors**: Make sure all dependencies are in package.json
2. **Environment variables**: Ensure all required env vars are set
3. **Port issues**: Set PORT environment variable
4. **Database connection**: Verify MONGODB_URI is correct
5. **Cloudinary**: Ensure all Cloudinary credentials are set 
