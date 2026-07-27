import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests',
  timeout:90000,
  expect:{timeout:15000},
  fullyParallel:false,
  retries:1,
  reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}]],
  use:{
    baseURL:'http://127.0.0.1:4173',
    trace:'retain-on-failure',
    screenshot:'only-on-failure'
  },
  webServer:{
    command:'python3 -m http.server 4173 --directory .',
    url:'http://127.0.0.1:4173/apps/orion-health/index.html',
    reuseExistingServer:true,
    timeout:30000
  },
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
    {name:'mobile-chromium',use:{...devices['Pixel 7']}}
  ]
});
