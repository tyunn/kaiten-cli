import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let envConfig = null;

function loadEnv() {
  if (envConfig) return envConfig;
  
  const projectEnvPath = path.join(process.cwd(), '.kaiten.env');
  const homeConfigPath = path.join(os.homedir(), '.kaiten', 'config');
  
  const config = {};
  
  if (fs.existsSync(homeConfigPath)) {
    const homeConfig = fs.readFileSync(homeConfigPath, 'utf8')
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .reduce((acc, line) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length) {
          acc[key.trim()] = valueParts.join('=').trim();
        }
        return acc;
      }, {});
    Object.assign(config, homeConfig);
  }
  
  if (fs.existsSync(projectEnvPath)) {
    const projectConfig = fs.readFileSync(projectEnvPath, 'utf8')
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .reduce((acc, line) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length) {
          acc[key.trim()] = valueParts.join('=').trim();
        }
        return acc;
      }, {});
    Object.assign(config, projectConfig);
  }
  
  if (!config.KAITEN_API_URL || !config.KAITEN_API_TOKEN) {
    const fallbackPath = path.join(__dirname, '..', '..', '.env');
    if (fs.existsSync(fallbackPath)) {
      const fallbackConfig = fs.readFileSync(fallbackPath, 'utf8')
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .reduce((acc, line) => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length) {
            acc[key.trim()] = valueParts.join('=').trim();
          }
          return acc;
        }, {});
      Object.assign(config, fallbackConfig);
    }
  }
  
  envConfig = config;
  return config;
}

export function getConfig() {
  const config = loadEnv();
  return {
    apiUrl: config.KAITEN_API_URL,
    apiToken: config.KAITEN_API_TOKEN,
    defaultSpaceId: config.KAITEN_DEFAULT_SPACE_ID
  };
}
