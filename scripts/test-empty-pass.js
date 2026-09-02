import mysql from 'mysql2/promise';

async function testEmpty() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      connectTimeout: 3000,
    });
    console.log('SUCCESS_EMPTY_PASSWORD');
    await conn.end();
  } catch (err) {
    console.log('FAIL_EMPTY:', err.code, err.message);
  }
}

testEmpty();
