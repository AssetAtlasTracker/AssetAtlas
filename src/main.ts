import App from './App.svelte';
import './svelteStyles/output.css';


const app = new App({
  target: document.getElementById('app')!,
});

export default app;