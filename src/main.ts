//front end TS zone
import App from './App.svelte';
import './output.css';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;