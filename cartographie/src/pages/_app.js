import '@/styles/globals.css'
import mapboxgl from '!mapbox-gl';
import './components/map.css'
mapboxgl.accessToken = 'pk.eyJ1IjoibWFzdGVyZGV2OTUiLCJhIjoiY2xnamh6MW1sMDJ2MDNmcXEyaDByZm1iMyJ9.zjItH8H-83T2H-_CkqRwKg';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
