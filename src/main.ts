import App from './App.svelte';
import './svelteStyles/output.css';

const app = new App({
  target: document.getElementById('app')!, //Mount the app to the HTML element with id "app"
});

export default app;