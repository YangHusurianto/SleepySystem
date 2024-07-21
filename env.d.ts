declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      GUILD_ID: string;
      MONGO_URI: string;
      ENV: "dev" | "prod" | "debug";
    }
  }
}

export {};