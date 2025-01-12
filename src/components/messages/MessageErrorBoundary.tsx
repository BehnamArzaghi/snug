import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MessageErrorBoundaryProps {
  /** The message component to render */
  children: ReactNode;
  /** Optional custom fallback UI to show when an error occurs */
  fallback?: ReactNode;
  /** Whether the message is currently loading */
  isLoading?: boolean;
}

interface MessageErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred, if any */
  error: Error | null;
  /** Whether we're mounted on the client */
  isClient: boolean;
}

/**
 * Error boundary component for message rendering.
 * Catches errors in message components and displays a fallback UI.
 * Implements SSR-safe error handling and loading states.
 */
export class MessageErrorBoundary extends Component<MessageErrorBoundaryProps, MessageErrorBoundaryState> {
  public state: MessageErrorBoundaryState = {
    hasError: false,
    error: null,
    isClient: false,
  };

  public componentDidMount() {
    this.setState({ isClient: true });
  }

  public static getDerivedStateFromError(error: Error): Partial<MessageErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Message Error:', error, errorInfo);
    
    // Show a toast notification for user feedback
    toast.error('Failed to load message', {
      description: 'Please try refreshing the page',
    });
  }

  private renderError() {
    return this.props.fallback || (
      <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="h-4 w-4" />
        <div className="flex flex-col">
          <span>Failed to load message. Please try refreshing.</span>
          {this.state.error && (
            <span className="text-xs opacity-70">
              Error: {this.state.error.message}
            </span>
          )}
        </div>
      </div>
    );
  }

  private renderLoading() {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading message...</span>
      </div>
    );
  }

  public render() {
    // Don't render anything on the server
    if (!this.state.isClient) {
      return this.renderLoading();
    }

    if (this.state.hasError) {
      return this.renderError();
    }

    if (this.props.isLoading) {
      return this.renderLoading();
    }

    return this.props.children;
  }
} 