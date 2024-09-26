var app=function(){"use strict";function t(){}function n(t){return t()}function e(){return Object.create(null)}function o(t){t.forEach(n)}function r(t){return"function"==typeof t}function u(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function c(t,n){t.appendChild(n)}function i(t){t.parentNode&&t.parentNode.removeChild(t)}function s(t){return document.createElement(t)}function a(){return t=" ",document.createTextNode(t);var t}function f(t,n,e,o){return t.addEventListener(n,e,o),()=>t.removeEventListener(n,e,o)}function l(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function d(t,n){t.value=null==n?"":n}let p;function $(t){p=t}const h=[],g=[];let m=[];const _=[],b=Promise.resolve();let v=!1;function y(t){m.push(t)}const x=new Set;let w=0;function k(){if(0!==w)return;const t=p;do{try{for(;w<h.length;){const t=h[w];w++,$(t),E(t.$$)}}catch(t){throw h.length=0,w=0,t}for($(null),h.length=0,w=0;g.length;)g.pop()();for(let t=0;t<m.length;t+=1){const n=m[t];x.has(n)||(x.add(n),n())}m.length=0}while(h.length);for(;_.length;)_.pop()();v=!1,x.clear(),$(t)}function E(t){if(null!==t.fragment){t.update(),o(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(y)}}const S=new Set;function q(t,n){const e=t.$$;null!==e.fragment&&(!function(t){const n=[],e=[];m.forEach((o=>-1===t.indexOf(o)?n.push(o):e.push(o))),e.forEach((t=>t())),m=n}(e.after_update),o(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}function A(t,n){-1===t.$$.dirty[0]&&(h.push(t),v||(v=!0,b.then(k)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function C(u,c,s,a,f,l,d=null,h=[-1]){const g=p;$(u);const m=u.$$={fragment:null,ctx:[],props:l,update:t,not_equal:f,bound:e(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(c.context||(g?g.$$.context:[])),callbacks:e(),dirty:h,skip_bound:!1,root:c.target||g.$$.root};d&&d(m.root);let _=!1;if(m.ctx=s?s(u,c.props||{},((t,n,...e)=>{const o=e.length?e[0]:n;return m.ctx&&f(m.ctx[t],m.ctx[t]=o)&&(!m.skip_bound&&m.bound[t]&&m.bound[t](o),_&&A(u,t)),n})):[],m.update(),_=!0,o(m.before_update),m.fragment=!!a&&a(m.ctx),c.target){if(c.hydrate){const t=function(t){return Array.from(t.childNodes)}(c.target);m.fragment&&m.fragment.l(t),t.forEach(i)}else m.fragment&&m.fragment.c();c.intro&&((b=u.$$.fragment)&&b.i&&(S.delete(b),b.i(v))),function(t,e,u){const{fragment:c,after_update:i}=t.$$;c&&c.m(e,u),y((()=>{const e=t.$$.on_mount.map(n).filter(r);t.$$.on_destroy?t.$$.on_destroy.push(...e):o(e),t.$$.on_mount=[]})),i.forEach(y)}(u,c.target,c.anchor),k()}var b,v;$(g)}class N{$$=void 0;$$set=void 0;$destroy(){q(this,1),this.$destroy=t}$on(n,e){if(!r(e))return t;const o=this.$$.callbacks[n]||(this.$$.callbacks[n]=[]);return o.push(e),()=>{const t=o.indexOf(e);-1!==t&&o.splice(t,1)}}$set(t){var n;this.$$set&&(n=t,0!==Object.keys(n).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function O(n){let e,r,u,p,$,h,g,m;return{c(){e=s("main"),r=s("h1"),r.textContent="Simple Input and Button Example",u=a(),p=s("input"),$=a(),h=s("button"),h.textContent="Submit",l(p,"placeholder","Enter something..."),l(p,"class","svelte-d6gkqf"),l(h,"class","svelte-d6gkqf"),l(e,"class","svelte-d6gkqf")},m(t,o){!function(t,n,e){t.insertBefore(n,e||null)}(t,e,o),c(e,r),c(e,u),c(e,p),d(p,n[0]),c(e,$),c(e,h),g||(m=[f(p,"input",n[2]),f(h,"click",n[1])],g=!0)},p(t,[n]){1&n&&p.value!==t[0]&&d(p,t[0])},i:t,o:t,d(t){t&&i(e),g=!1,o(m)}}}function j(t,n,e){let o="";return[o,function(){console.log("Input Value:",o)},function(){o=this.value,e(0,o)}]}"undefined"!=typeof window&&(window.__svelte||(window.__svelte={v:new Set})).v.add("4");return new class extends N{constructor(t){super(),C(this,t,j,O,u,{})}}({target:document.body})}();
//# sourceMappingURL=bundle.js.map
