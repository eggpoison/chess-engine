import React from 'react';
import ReactDOM from 'react-dom';
import { BoardElem } from './components/Game';
import { setup } from "./computer-ai";

import './css/index.css';

ReactDOM.render(
  <React.StrictMode>
    <BoardElem />
  </React.StrictMode>,
  document.getElementById('root')
);

window.addEventListener("load", () => {
  setup();
});