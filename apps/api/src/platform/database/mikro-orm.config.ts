import { loadConfig } from '../config/load-config.js';
import { mikroOrmOptions } from './mikro-orm.options.js';

export default mikroOrmOptions(loadConfig(process.env));
