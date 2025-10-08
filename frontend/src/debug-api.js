// Debug test for API connection
// Save this as debug-api.js in frontend/src and run it to test your API connection

import api from './api.js';

// Test API connection
export async function testAPIConnection() {
  console.log('🔍 Testing API connection...');
  
  try {
    // Test 1: Basic health check
    console.log('📡 Testing basic connection...');
    const healthResponse = await fetch('http://localhost:5000/api/auth/role-constants');
    console.log('Health check status:', healthResponse.status);
    
    // Test 2: Test with axios (role constants - no auth needed)
    console.log('🔐 Testing role constants endpoint...');
    const rolesResponse = await api.get('/auth/role-constants');
    console.log('✅ Role constants response:', rolesResponse.data);
    
    // Test 3: Check authentication
    console.log('🔑 Testing authentication...');
    const token = localStorage.getItem('eventSphere_token');
    console.log('Token exists:', !!token);
    
    if (token) {
      try {
        const userResponse = await api.get('/users/me');
        console.log('✅ User data:', userResponse.data);
        console.log('👤 User role:', userResponse.data.user?.role);
      } catch (authErr) {
        console.error('❌ Authentication failed:', authErr.response?.status, authErr.response?.data);
      }
    }
    
    // Test 4: Test event endpoint (requires auth)
    if (token) {
      try {
        console.log('📅 Testing events endpoint...');
        const eventsResponse = await api.get('/events');
        console.log('✅ Events response:', eventsResponse.data);
      } catch (eventsErr) {
        console.error('❌ Events endpoint failed:', eventsErr.response?.status, eventsErr.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ API connection test failed:', error);
  }
}

// Test event creation with minimal data
export async function testEventCreation() {
  console.log('🔍 Testing event creation...');
  
  const testEventData = {
    title: "Test Event",
    description: "This is a test event for debugging",
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    location: "Test Location",
    maxParticipants: 500,
    roles: ["team_member"]
  };
  
  console.log('📤 Sending test event data:', testEventData);
  
  try {
    const response = await api.post('/events', testEventData);
    console.log('✅ Event created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Event creation failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

// Run tests
if (typeof window !== 'undefined') {
  window.debugAPI = {
    testConnection: testAPIConnection,
    testEventCreation: testEventCreation
  };
  
  console.log('🛠️ Debug functions available:');
  console.log('- window.debugAPI.testConnection()');
  console.log('- window.debugAPI.testEventCreation()');
}