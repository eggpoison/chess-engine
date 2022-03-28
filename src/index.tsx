import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Game } from './pages/Game';
import { Menu } from './pages/Menu';

import './css/index.css';
import "./css/game.css";
import "./css/menu.css";

ReactDOM.render(
   <React.StrictMode>
      <BrowserRouter>
      <Routes>
         <Route path="/" element={<Menu />} />
         <Route path="/game" element={<Game />} />
         <Route path="/game-over" element={<p>3</p>} />
      </Routes>
      </BrowserRouter>
   </React.StrictMode>,
   document.getElementById('root')
);