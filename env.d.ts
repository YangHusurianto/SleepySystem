declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      GUILD_ID: string;
      ENV: "dev" | "prod" | "debug";
    }
  }
}

export {};