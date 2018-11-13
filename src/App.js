import React, { Component } from 'react';

import CoverEditorComponent from './CoverEditorComponent'
import './App.css';


class App extends Component {

  render() {
    return (
      <div className="app">
        <canvas id="result" className="hide"></canvas>
        <div hidden className="app-logo"></div>
        <div className="app-title">
          <img src="/images/complete-title.png" className="app-main-title"/>
          <img hidden src="/images/title.png" className="app-main-title"/>
          <img hidden src="/images/sub-title.png" className="app-sub-title"/>
        </div>
        <CoverEditorComponent/>
      </div>
    );
  }
}

export default App;
