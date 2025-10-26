const mongoose = require('mongoose');

// Direct connection string for testing
const MONGODB_URI = 'mongodb+srv://samalarajesh12_db_user:lQvX67tC3PRKTAwj@cluster0.nnwfqns.mongodb.net/newDB';

async function testConnection() {
  try {
    console.log('🔗 Testing MongoDB connection...');
    console.log('📡 Connection string:', MONGODB_URI.substring(0, 50) + '...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB');
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    // Check if patients collection exists
    const patientsCollection = db.collection('patients');
    const patientCount = await patientsCollection.countDocuments();
    console.log(`👥 Patients collection has ${patientCount} documents`);
    
    if (patientCount > 0) {
      // Show first patient
      const firstPatient = await patientsCollection.findOne();
      console.log('📋 First patient:', {
        id: firstPatient.id,
        firstName: firstPatient.firstName,
        lastName: firstPatient.lastName
      });
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('❌ Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection(); 