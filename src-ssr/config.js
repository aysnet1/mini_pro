
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
} = process.env;

assert(PORT, " Port is required");
assert(HOST, " host is required");
export default {
  port: PORT,
  host: HOST,
  url: HOST_URL,
  mysql: {
    host: MYSQL_HOST,
    user: MYSQL_USER,
    database: MYSQL_DATABASE,
    password: MYSQL_PASSWORD,
    connectionLimit: 10,
  },
};
