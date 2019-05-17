import React from 'react';
import './styles/header.css';

const Header = () => (
  <header className="page-header">
    <nav className="header__nav">
      <ul className="header__list">
        <li className="header__item">
          <a className="header__link" href="/">
            Home
          </a>
        </li>
      </ul>
    </nav>
  </header>
);

export default Header;
