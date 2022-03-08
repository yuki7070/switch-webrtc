import { ReactNode } from 'react';
import { Helmet } from "react-helmet";


//<link href="https://unpkg.com/nes.css@2.3.0/css/nes.min.css" rel="stylesheet" />

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Helmet>
        <title>Switch WebRTC</title>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans|Montserrat:500" rel="stylesheet"></link>
      </Helmet>
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
      }}
    >
      {children}
    </div>
    </>
  );
}