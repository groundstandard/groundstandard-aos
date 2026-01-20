// Minimal typings for Supabase Edge Functions (Deno runtime) to keep IDE/TS happy.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: unknown
  ): void;
}

declare module "npm:resend@2.0.0" {
  export class Resend {
    constructor(apiKey?: string);
    emails: {
      send(args: {
        from: string;
        to: string[];
        subject: string;
        html: string;
      }): Promise<{ data?: { id?: string }; error?: { message: string } }>;
    };
  }
}

declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  export function createClient(url: string, key: string, options?: any): any;
}
