const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB');
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    // Test creating a simple document
    const testCollection = db.collection('test');
    const testDoc = { 
      message: 'Hello MongoDB!', 
      timestamp: new Date() 
    };
    
    const result = await testCollection.insertOne(testDoc);
    console.log('✅ Test document inserted with ID:', result.insertedId);
    
    // Verify the document was stored
    const retrievedDoc = await testCollection.findOne({ _id: result.insertedId });
    console.log('✅ Document retrieved:', retrievedDoc);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Test document cleaned up');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection();
