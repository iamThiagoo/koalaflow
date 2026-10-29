export const AUTH = 'AUTH';

export interface Auth {
  handler: (request: Request) => Promise<Response>;
  $context: Promise<{ checkSchema?: () => Promise<void> | undefined }>;
  api: {
    getSession(input: { headers: Headers }): Promise<{
      user: { id: string };
      session: { activeOrganizationId?: string | null };
    } | null>;
  };
}
