const fs = require('fs');
require('dotenv').config();

const envConfigFile = `export const environment = {
  production: ${process.env.NODE_ENV === 'production'},
  supabaseUrl: '${process.env.SUPABASE_URL || 'REPLACE_WITH_YOUR_SUPABASE_URL'}',
  supabaseKey: '${process.env.SUPABASE_PUBLISHABLE_KEY || 'REPLACE_WITH_YOUR_SUPABASE_KEY'}',
  apiUrl: '${process.env.API_URL || 'http://localhost:3000/api'}',
};
`;

const envDevelopmentConfigFile = `export const environment = {
  production: false,
  supabaseUrl: '${process.env.SUPABASE_URL || 'REPLACE_WITH_YOUR_SUPABASE_URL'}',
  supabaseKey: '${process.env.SUPABASE_PUBLISHABLE_KEY || 'REPLACE_WITH_YOUR_SUPABASE_KEY'}',
  apiUrl: '${process.env.API_URL || 'http://localhost:3000/api'}',
};
`;

const dir = './src/environments';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(`${dir}/environment.ts`, envConfigFile);
fs.writeFileSync(`${dir}/environment.development.ts`, envDevelopmentConfigFile);

console.log('Environment files generated successfully based on .env');
