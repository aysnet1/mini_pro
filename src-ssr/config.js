
import dotenv from "dotenv";
import assert from "assert";
dotenv.config();

const {
  PORT,
  HOST,
  HOST_URL,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_HOST,
  MYSQL_PORT,
} = process.env;

assert(PORT, " Port is required");
assert(HOST, " host is required");
export default {
  port: PORT,
  host: HOST,
  url: process.env.NODE_ENV === 'production' ? HOST_URL : `http://${HOST}:${PORT}`,
  mysql: process.env.NODE_ENV === 'development' ? {
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'logement_etudiant4',
    password: '',
    connectionLimit: 20,
  } :
    {
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT) || 3306,
      user: MYSQL_USER,
      database: MYSQL_DATABASE,
      password: MYSQL_PASSWORD,
      connectionLimit: 50,
      ssl: { rejectUnauthorized: false },
    }
};
