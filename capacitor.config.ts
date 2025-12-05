import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sunyupang",
  appName: "mobi-app",
  webDir: "out",
  server: {
    // url: "https://mobi-app-lilac.vercel.app/",
    url: "http://172.30.1.98:3000",
    cleartext: true,
  },
};

export default config;
