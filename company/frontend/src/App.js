import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Routing from './Navigation/Routing';

const App = () => {
  return (
    <BrowserRouter>
      <Routing />
    </BrowserRouter>
  );
};

export default App;
