import { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
      }}
    >
      {children}
    </div>
  );
}