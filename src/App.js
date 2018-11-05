import React, { Component } from 'react';

import CoverEditorComponent from './CoverEditorComponent'
import './App.css';


class App extends Component {

  render() {
    return (
      <div className="app">
        <canvas id="result" className="hide"></canvas>
        <CoverEditorComponent/>
      </div>
    );
  }
}

export default App;
