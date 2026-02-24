type ErrorWithDetails = {
  message?: string;
  code?: string;
};

function getErrorDetails(error: unknown): ErrorWithDetails {
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (error && typeof error === 'object') {
    const details = error as Record<string, unknown>;
    return {
      message: typeof details.message === 'string' ? details.message : undefined,
      code: typeof details.code === 'string' ? details.code : undefined,
    };
  }
  return {};
}

export function mapErrorToUserMessage(error: unknown, fallback: string): string {
  const { message = '', code = '' } = getErrorDetails(error);
  const lowerMessage = message.toLowerCase();

  if (code === '23505' || lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (lowerMessage.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (lowerMessage.includes('jwt') || lowerMessage.includes('token')) {
    return 'Your session or invite token is invalid or expired. Please refresh and try again.';
  }
  if (lowerMessage.includes('permission denied') || lowerMessage.includes('not authenticated')) {
    return 'You do not have permission to perform this action.';
  }

  return message || fallback;
}

export function toAppError(error: unknown, fallback: string): Error {
  return new Error(mapErrorToUserMessage(error, fallback));
}

export function captureError(
  workflow: string,
  action: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const details = getErrorDetails(error);
  console.error(`[${workflow}] ${action}`, {
    message: details.message ?? 'Unknown error',
    code: details.code ?? null,
    metadata: metadata ?? null,
  });
}
