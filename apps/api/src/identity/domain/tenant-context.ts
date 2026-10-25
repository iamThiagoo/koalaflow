/**
 * Rule: the tenant of a request is the session's active organization, never a value from the request.
 */
export interface TenantContext {
  userId: string;
  organizationId: string;
  role: string;
}
