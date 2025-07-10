const bcrypt = require('bcrypt');

async function testPasswordHashing() {
  console.log('🔍 Testing Password Hashing...');
  console.log('');
  
  const testPassword = 'testpassword123';
  const SALT_ROUNDS = 10;
  
  try {
    console.log('📝 Test password:', testPassword);
    console.log('🔄 Hashing password...');
    
    const hash = await bcrypt.hash(testPassword, SALT_ROUNDS);
    console.log('✅ Hash generated:', hash.substring(0, 20) + '...');
    console.log('📏 Hash length:', hash.length);
    
    console.log('');
    console.log('🔄 Testing password comparison...');
    
    const match1 = await bcrypt.compare(testPassword, hash);
    console.log('✅ Correct password match:', match1);
    
    const match2 = await bcrypt.compare('wrongpassword', hash);
    console.log('❌ Wrong password match:', match2);
    
    console.log('');
    console.log('🎉 Password hashing test completed successfully!');
    
  } catch (error) {
    console.error('❌ Password hashing test failed:', error.message);
  }
}

testPasswordHashing(); 