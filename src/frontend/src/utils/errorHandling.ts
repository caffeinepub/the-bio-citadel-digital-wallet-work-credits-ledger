/**
 * Error handling utilities for consistent error classification and user-friendly messaging
 */

export enum ErrorType {
    Network = 'network',
    Configuration = 'configuration',
    Delegation = 'delegation',
    UserCancellation = 'user_cancellation',
    Unknown = 'unknown'
}

export interface ClassifiedError {
    type: ErrorType;
    originalError: unknown;
    userMessage: string;
    technicalMessage: string;
    actionableGuidance: string;
}

/**
 * Classify an error into a specific error type
 */
export function classifyError(error: unknown): ErrorType {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    // Network-related errors
    if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('offline')
    ) {
        return ErrorType.Network;
    }
    
    // Configuration errors
    if (
        errorMessage.includes('canister') ||
        errorMessage.includes('identity provider') ||
        errorMessage.includes('not initialized') ||
        errorMessage.includes('configuration')
    ) {
        return ErrorType.Configuration;
    }
    
    // Delegation errors
    if (
        errorMessage.includes('delegation') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid')
    ) {
        return ErrorType.Delegation;
    }
    
    // User cancellation
    if (
        errorMessage.includes('user') ||
        errorMessage.includes('cancel') ||
        errorMessage.includes('abort') ||
        errorMessage.includes('closed')
    ) {
        return ErrorType.UserCancellation;
    }
    
    return ErrorType.Unknown;
}

/**
 * Get user-friendly error message with actionable guidance
 */
export function getUserFriendlyErrorMessage(errorType: ErrorType): { message: string; guidance: string } {
    switch (errorType) {
        case ErrorType.Network:
            return {
                message: 'Network connection issue',
                guidance: 'Please check your internet connection and try again. If the problem persists, try refreshing the page.'
            };
        
        case ErrorType.Configuration:
            return {
                message: 'Configuration error',
                guidance: 'There may be a temporary issue with the service. Please try again in a few moments or contact support if the issue continues.'
            };
        
        case ErrorType.Delegation:
            return {
                message: 'Authentication session expired',
                guidance: 'Your login session has expired. Please log in again to continue.'
            };
        
        case ErrorType.UserCancellation:
            return {
                message: 'Login cancelled',
                guidance: 'You cancelled the login process. Click "Login" to try again when ready.'
            };
        
        case ErrorType.Unknown:
        default:
            return {
                message: 'An unexpected error occurred',
                guidance: 'Please try again. If the problem continues, try refreshing the page or contact support.'
            };
    }
}

/**
 * Classify an error and return structured error information
 */
export function classifyAndFormatError(error: unknown): ClassifiedError {
    const type = classifyError(error);
    const { message, guidance } = getUserFriendlyErrorMessage(type);
    const technicalMessage = error instanceof Error ? error.message : String(error);
    
    console.log('[ErrorHandling] Error classified:', {
        type,
        technicalMessage,
        userMessage: message,
        guidance
    });
    
    return {
        type,
        originalError: error,
        userMessage: message,
        technicalMessage,
        actionableGuidance: guidance
    };
}
