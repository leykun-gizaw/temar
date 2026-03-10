import * as React from 'react';
import { cn } from '@/lib/utils';
import { containers, layout } from '@/lib/design-system/tokens';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: keyof typeof containers;
}

export const PageContainer = React.forwardRef<
  HTMLDivElement,
  PageContainerProps
>(({ width = 'content', className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('mx-auto', containers[width], className)}
      {...props}
    />
  );
});
PageContainer.displayName = 'PageContainer';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article';
  spacing?: keyof typeof layout.section;
  container?: boolean;
  containerWidth?: keyof typeof containers;
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      as = 'section',
      spacing = 'base',
      container = true,
      containerWidth = 'content',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Component = as;

    return (
      <Component
        ref={ref as React.Ref<any>}
        className={cn(layout.section[spacing], className)}
        {...props}
      >
        {container ? (
          <PageContainer width={containerWidth}>{children}</PageContainer>
        ) : (
          children
        )}
      </Component>
    );
  }
);
Section.displayName = 'Section';

interface HeroSectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: keyof typeof layout.hero;
  container?: boolean;
  containerWidth?: keyof typeof containers;
}

export const HeroSection = React.forwardRef<HTMLElement, HeroSectionProps>(
  (
    {
      spacing = 'base',
      container = true,
      containerWidth = 'content',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          layout.hero[spacing],
          className
        )}
        {...props}
      >
        {container ? (
          <PageContainer width={containerWidth}>{children}</PageContainer>
        ) : (
          children
        )}
      </section>
    );
  }
);
HeroSection.displayName = 'HeroSection';
