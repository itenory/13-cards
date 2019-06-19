import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Root from './components/Root';
import { setupSocket } from './utils/socket';

setupSocket('localhost:5000', {
  reconnectionAttempts: 10
});
ReactDOM.render(<Root />, document.getElementById('root'));
