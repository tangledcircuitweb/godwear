// Quick test to verify MailerSend API authentication
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.MAILERSEND_API_KEY;
const BASE_URL = "https://api.mailersend.com/v1";

if (!API_KEY) {
  console.log("❌ MAILERSEND_API_KEY environment variable not set");
  process.exit(1);
}

async function testAuth() {
  try {
    console.log("🔑 Testing MailerSend API authentication...");
    console.log(`📡 API Key: ${API_KEY.substring(0, 20)}...`);
    
    // Test with a simple API call to get account info
    const response = await fetch(`${BASE_URL}/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.log(`❌ Error response: ${errorData}`);
      return false;
    }
    
    const data = await response.json();
    console.log("✅ Authentication successful!");
    console.log(`📧 Account: ${JSON.stringify(data, null, 2)}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

testAuth().then(success => {
  process.exit(success ? 0 : 1);
});
