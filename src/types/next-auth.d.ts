import { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
    apiToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    apiToken?: string;
  }
}
