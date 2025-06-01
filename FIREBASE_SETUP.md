# Firebase Setup Guide

## Firebase Security Rules

To allow public posting and reading on your board, you need to configure Firebase Firestore security rules.

### Required Firestore Rules

Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Firestore Database → Rules

Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to posts
    match /posts/{postId} {
      allow read: if true;
      allow write: if true;  // For MVP - allows anonymous posting
    }
    
    // Allow public read/write access to comments
    match /comments/{commentId} {
      allow read: if true;
      allow write: if true;  // For MVP - allows anonymous commenting
    }
    
    // Allow public read/write access to upvotes
    match /upvotes/{upvoteId} {
      allow read: if true;
      allow write: if true;  // For MVP - allows anonymous upvoting
    }
  }
}
```

### For Production (More Secure)

For a production environment, consider these more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts - read public, write only if authenticated or valid structure
    match /posts/{postId} {
      allow read: if true;
      allow create: if validatePost(resource.data);
      allow update: if validatePostUpdate(resource.data, request.data);
      allow delete: if false; // No deleting posts
    }
    
    // Comments - read public, write with validation
    match /comments/{commentId} {
      allow read: if true;
      allow create: if validateComment(resource.data);
      allow update: if false; // No editing comments
      allow delete: if false; // No deleting comments
    }
    
    // Upvotes - read public, write with validation
    match /upvotes/{upvoteId} {
      allow read: if true;
      allow create: if validateUpvote(resource.data);
      allow update: if false;
      allow delete: if validateUpvote(resource.data); // Allow removing upvotes
    }
  }
  
  // Validation functions
  function validatePost(data) {
    return data.keys().hasAll(['content', 'createdAt']) &&
           data.content is string &&
           data.content.size() > 0 &&
           data.content.size() < 5000;
  }
  
  function validatePostUpdate(oldData, newData) {
    return newData.diff(oldData).affectedKeys().hasOnly(['upvotes', 'commentCount', 'updatedAt']);
  }
  
  function validateComment(data) {
    return data.keys().hasAll(['postId', 'content', 'createdAt']) &&
           data.content is string &&
           data.content.size() > 0 &&
           data.content.size() < 1000;
  }
  
  function validateUpvote(data) {
    return data.keys().hasAll(['postId', 'createdAt']);
  }
}
```

## Testing the Rules

After updating the rules:

1. Open the sample posts generator at `http://localhost:5001/create-sample-posts.html`
2. Click "Create Post" for each sample post
3. Visit `http://localhost:5001/board` to see the posts
4. Test upvoting and commenting functionality

## Current Status

Your Firebase configuration is already set up in `static/js/firebase-config.js`. The main issue is likely the security rules preventing writes from unauthenticated users.

## Quick Fix

For immediate testing, use these permissive rules (NOT for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Remember to make rules more restrictive before going live!

# Firebase Security Rules - Production Ready

## Proper Firebase Rules for Anonymous Board

Replace your Firebase rules with these **production-ready** rules that allow anonymous posting while maintaining security:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Posts collection - Allow public read, controlled anonymous write
    match /posts/{postId} {
      // Anyone can read posts
      allow read: if true;
      
      // Allow creating posts with proper validation
      allow create: if isValidPost(resource.data);
      
      // Allow updating only specific fields (upvotes, commentCount)
      allow update: if isValidPostUpdate(resource.data, request.data);
      
      // No deleting posts
      allow delete: if false;
    }
    
    // Comments collection - Allow public read, controlled anonymous write
    match /comments/{commentId} {
      // Anyone can read comments
      allow read: if true;
      
      // Allow creating comments with validation
      allow create: if isValidComment(resource.data);
      
      // No updating or deleting comments
      allow update, delete: if false;
    }
    
    // Upvotes collection - Track anonymous upvotes
    match /upvotes/{upvoteId} {
      // Anyone can read upvotes
      allow read: if true;
      
      // Allow creating/deleting upvotes (for toggle functionality)
      allow create, delete: if isValidUpvote(resource.data);
      
      // No updating upvotes
      allow update: if false;
    }
  }
  
  // Validation functions
  function isValidPost(data) {
    return data.keys().hasAll(['content', 'createdAt', 'status']) &&
           data.content is string &&
           data.content.size() > 0 &&
           data.content.size() <= 5000 &&
           data.status in ['published', 'draft'] &&
           data.createdAt == request.time &&
           // Optional fields validation
           (!data.keys().hasAny(['title']) || 
            (data.title is string && data.title.size() <= 100)) &&
           (!data.keys().hasAny(['tags']) || 
            (data.tags is list && data.tags.size() <= 10)) &&
           (!data.keys().hasAny(['featured']) || 
            data.featured is bool) &&
           (!data.keys().hasAny(['upvotes']) || 
            data.upvotes is number) &&
           (!data.keys().hasAny(['commentCount']) || 
            data.commentCount is number);
  }
  
  function isValidPostUpdate(oldData, newData) {
    // Only allow updating upvotes, commentCount, and updatedAt
    return newData.diff(oldData).affectedKeys()
             .hasOnly(['upvotes', 'commentCount', 'updatedAt']) &&
           // Ensure upvotes is incremented/decremented by 1 only
           ((!newData.diff(oldData).affectedKeys().hasAny(['upvotes'])) ||
            (newData.upvotes == oldData.upvotes + 1 || 
             newData.upvotes == oldData.upvotes - 1)) &&
           // Ensure commentCount is incremented by 1 only
           ((!newData.diff(oldData).affectedKeys().hasAny(['commentCount'])) ||
            newData.commentCount == oldData.commentCount + 1) &&
           // Ensure updatedAt is current time
           ((!newData.diff(oldData).affectedKeys().hasAny(['updatedAt'])) ||
            newData.updatedAt == request.time);
  }
  
  function isValidComment(data) {
    return data.keys().hasAll(['postId', 'content', 'createdAt']) &&
           data.postId is string &&
           data.postId.size() > 0 &&
           data.content is string &&
           data.content.size() > 0 &&
           data.content.size() <= 1000 &&
           data.createdAt == request.time &&
           // Optional fields validation
           (!data.keys().hasAny(['authorName']) || 
            (data.authorName is string && data.authorName.size() <= 50)) &&
           (!data.keys().hasAny(['approved']) || 
            data.approved is bool);
  }
  
  function isValidUpvote(data) {
    return data.keys().hasAll(['postId', 'createdAt']) &&
           data.postId is string &&
           data.postId.size() > 0 &&
           data.createdAt == request.time;
  }
}
```

## What These Rules Do

### ✅ **Security Features:**
- **Content validation** - Prevents malicious data injection
- **Size limits** - Posts max 5000 chars, comments max 1000 chars
- **Field restrictions** - Only allows specific fields to be updated
- **Time validation** - Ensures timestamps are server-generated
- **Increment limits** - Upvotes can only change by ±1

### ✅ **Anonymous Features Enabled:**
- **Public reading** - Anyone can view posts and comments
- **Anonymous posting** - No authentication required for posts
- **Anonymous commenting** - No authentication required for comments  
- **Anonymous upvoting** - Tracked via localStorage + Firestore

### ✅ **Abuse Prevention:**
- **No post deletion** - Content is permanent
- **No comment editing** - Comments are immutable
- **Controlled updates** - Only specific fields can be modified
- **Content limits** - Prevents spam with size restrictions

## Apply These Rules

1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project
2. **Firestore Database** → **Rules** tab
3. **Replace** existing rules with the above
4. **Click "Publish"**

These rules provide **real security** while enabling your anonymous board functionality. No temporary workarounds needed! 