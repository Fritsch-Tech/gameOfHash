import './App.css';
import Map from './components/Map';

function App() {
  return (
    <div className="App">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
        integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI="
      />
      <Map />
    </div>
  );
}

export default App;
