import bcrypt from "bcrypt"
const password = 'admin123';
const saltRounds = 10;

// Generate hash
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log('Hash:', hash);
});

// Or using async/await
async function generateHash() {
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Hash:', hash);
}