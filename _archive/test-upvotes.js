// Test script to add sample ideas with upvotes to Firebase

const firebaseConfig = {
    apiKey: "AIzaSyBlDkY_E1p6IyjgUPxZkxbs11YS61PaohE",
    authDomain: "krishnakumarsonidotcom.firebaseapp.com",
    projectId: "krishnakumarsonidotcom",
    storageBucket: "krishnakumarsonidotcom.firebasestorage.app",
    messagingSenderId: "533366455528",
    appId: "1:533366455528:web:39bf60d4f59ec1ddef1d5d",
    measurementId: "G-SH0LXV42TB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Sample ideas with upvotes
const sampleIdeas = [
    {
        title: "AI-Powered Logistics Optimizer",
        description: "Machine learning system that predicts delivery routes and optimizes cargo loads in real-time, reducing fuel costs by 30%.",
        category: "technology",
        upvotes: 45,
        investors: 12,
        followers: 8,
        steals: 3,
        surveys: 15,
        views: 234,
        featured: true,
        timestamp: firebase.firestore.Timestamp.now()
    },
    {
        title: "Smart Contract Freight Payments",
        description: "Blockchain-based automated payment system for freight carriers that releases payments upon delivery confirmation.",
        category: "finance",
        upvotes: 32,
        investors: 8,
        followers: 15,
        steals: 5,
        surveys: 22,
        views: 189,
        featured: false,
        timestamp: firebase.firestore.Timestamp.now()
    },
    {
        title: "Carbon Neutral Shipping Tracker",
        description: "Real-time CO2 emissions tracking for shipping companies with automatic carbon offset purchasing.",
        category: "environment",
        upvotes: 67,
        investors: 20,
        followers: 25,
        steals: 8,
        surveys: 31,
        views: 456,
        featured: true,
        timestamp: firebase.firestore.Timestamp.now()
    }
];

// Add ideas to Firebase
async function addSampleIdeas() {
    console.log('Adding sample ideas to Firebase...');
    
    for (const idea of sampleIdeas) {
        try {
            const docRef = await db.collection('ideas').add(idea);
            console.log(`Added idea: ${idea.title} (ID: ${docRef.id})`);
        } catch (error) {
            console.error('Error adding idea:', error);
        }
    }
    
    console.log('Sample ideas added successfully!');
}

// Run the script
addSampleIdeas(); 