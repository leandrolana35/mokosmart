// Gera o hash bcrypt pra colocar em ADMIN_PASSWORD_HASH no server/.env.
// Uso: npm run hash-password -- <sua-senha>

import bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Uso: npm run hash-password -- <sua-senha>')
  process.exit(1)
}

console.log(bcrypt.hashSync(password, 10))
