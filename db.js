import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/postgres';
const sql = postgres(connectionString, {
  ssl: process.env.DATABASE_URL?.includes('supabase.co') ? 'require' : undefined,
});

export default sql;
