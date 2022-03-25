import React from 'react';
import ReactDOM from 'react-dom';
import Board, { setup } from './components/Board';

import './css/index.css';

ReactDOM.render(
  <React.StrictMode>
    <Board />
  </React.StrictMode>,
  document.getElementById('root')
);

window.addEventListener("load", () => {
  setup();
});