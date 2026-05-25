import { createPool } from "mysql2/promise";
import config from "../config.js";

const db = createPool(config.mysql);

export default db;
