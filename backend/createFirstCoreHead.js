require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const { ROLES } = require('./constants/roles');

async function createFirstAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

  // Delete dummy event if already exists
  await Event.deleteOne({ title: 'Dummy Event' });

  // Create dummy event with required dates
  const now = new Date();
  const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week

  const dummyEvent = new Event({
    title: 'Dummy Event',
    description: 'Bootstrap event for first admin user',
    startDate,
    endDate,
    status: 'draft',
    location: 'Virtual',
    maxParticipants: 100,
    currentParticipants: 0,
    roles: [ROLES.ADMIN],
    users: []
  });
  
  console.log('Creating dummy event...');
  await dummyEvent.save();
  console.log('Dummy event created successfully');

  const email = 'undefined@gmail.com';
  // Delete user if already exists
  console.log('Checking for existing user...');
  await User.deleteOne({ email });

  console.log('Hashing password...');
  const hashedPassword = await bcrypt.hash('123456', 12);
  
  const user = new User({
    name: 'pictoadmin',
    email,
    password: hashedPassword,
    isActive: true,
    events: [
      {
        eventId: dummyEvent._id,
        role: ROLES.ADMIN
      }
    ]
  });
  
  console.log('Creating admin user...');
  await user.save();
  console.log('Admin user created successfully');

  // Add user to dummy event's users array
  dummyEvent.users.push({ userId: user._id, role: ROLES.ADMIN });
  await dummyEvent.save();

  console.log('First admin user and dummy event created successfully!');
  console.log('Admin email:', user.email);
  console.log('Admin password: [Set to default - please change after first login]');
  console.log('Event ID:', dummyEvent._id);
  
  } catch (error) {
    console.error('Error creating first admin:', error);
    if (error.errors) {
      console.error('Validation errors:');
      for (const field in error.errors) {
        console.error(`- ${field}: ${error.errors[field].message}`);
      }
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createFirstAdmin(); 