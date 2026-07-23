// Módulo separado e importado primeiro em index.ts de propósito: imports ES são
// avaliados antes do corpo do módulo que os declara, então isso precisa rodar
// antes de qualquer outro módulo ler process.env no top-level (auth.ts, db.ts).
try {
  process.loadEnvFile()
} catch {
  // sem .env local — ok se as variáveis vierem do ambiente (produção, CI, etc.)
}
