import {
  BrowserRouter as Router,
  Route,
} from 'react-router-dom';
import { AnimatedSwitch } from 'react-router-transition';
import { Stream } from './pages/Stream';
import { Home } from './pages/Home';
import useWebSocket, { ReadyState } from 'react-use-websocket';

function App() {
  const socketUrl = 'ws://192.168.3.15:8080/ws';
  useWebSocket(socketUrl, { share: true });

  return (
    <Router>
      <AnimatedSwitch
        atEnter={{
          opacity: 0,
        }}
        atLeave={{
          opacity: 0,
        }}
        atActive={{
          opacity: 1,
          backgroundColor: '#000'
        }}
        className="switch-wrapper"
      >
        <Route path="/stream">
          <Stream />
        </Route>
        <Route path="/">
          <Home />
        </Route>
      </AnimatedSwitch>
    </Router>
  );
}

export default App;
