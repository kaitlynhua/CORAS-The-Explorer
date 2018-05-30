import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Header from './components/molecules/Header/Header';
import Footer from './components/molecules/Footer/Footer';

import Frontpage from './components/pages/Frontpage';
import About from './components/pages/About';
import Learn from './components/pages/Learn';
import Editor from './components/pages/Editor';

const App = (props) =>
    <Router>
        <div>
            <Header location={window.location.pathname} />
            <Route exact path={'/'} component={Frontpage} />
            <Route path={'/learn'} component={Learn} />
            <Route path={'/about'} component={About} />
            <Route path={'/try-it'} component={Editor} />
            <Footer />
        </div>
    </Router>;

export default App; 