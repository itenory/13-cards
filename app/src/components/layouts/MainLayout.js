import React from 'react';
import Header from './Header';

const MainLayout = ({ children }) => (
  <main className="page-main">
    <Header />
    {children}
  </main>
);

export default MainLayout;
