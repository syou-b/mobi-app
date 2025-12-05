import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sunyupang",
  appName: "mobi-app",
  webDir: "out",
  server: {
    // 여기에 본인의 PC IP 주소와 포트를 입력하세요. 개발이 끝나고 배포할 때는 server 항목을 지우거나 주석 처리
    url: "http://172.30.1.98:3000",
    cleartext: true,
  },
};

export default config;
