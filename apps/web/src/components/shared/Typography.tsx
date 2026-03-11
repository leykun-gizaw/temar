import * as React from 'react';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system/tokens';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type TextVariant =
  | 'body'
  | 'body-large'
  | 'body-small'
  | 'body-xs'
  | 'caption'
  | 'lead'
  | 'muted';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  variant?: HeadingLevel;
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as = 'h2', variant, className, ...props }, ref) => {
    const Component = as;
    const variantStyle = variant || as;

    return (
      <Component
        ref={ref}
        className={cn(typography[variantStyle], className)}
        {...props}
      />
    );
  }
);
Heading.displayName = 'Heading';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: 'p' | 'span' | 'div';
  variant?: TextVariant;
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ as = 'p', variant = 'body', className, ...props }, ref) => {
    const Component = as;

    return (
      <Component
        ref={ref}
        className={cn(typography[variant], className)}
        {...props}
      />
    );
  }
);
Text.displayName = 'Text';
