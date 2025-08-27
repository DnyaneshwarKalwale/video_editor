import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://ignite_editor:ignite@wantace.lkdz0v1.mongodb.net/";

async function testDatabase() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('📡 MongoDB URL:', MONGODB_URL);
    
    // Connect to database
    await mongoose.connect(MONGODB_URL);
    console.log('✅ Database connected successfully');
    
    // Test basic operations
    console.log('🔍 Testing database operations...');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.map(c => c.name));
    
    // Test User model
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));
    const userCount = await User.countDocuments();
    console.log('👥 Users in database:', userCount);
    
    // Test Project model
    const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({}));
    const projectCount = await Project.countDocuments();
    console.log('📁 Projects in database:', projectCount);
    
    // Test CompanyDomain model
    const CompanyDomain = mongoose.models.CompanyDomain || mongoose.model('CompanyDomain', new mongoose.Schema({}));
    const domainCount = await CompanyDomain.countDocuments();
    console.log('🏢 Company domains in database:', domainCount);
    
    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

testDatabase();
