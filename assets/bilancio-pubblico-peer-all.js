(function(){
  "use strict";
  var URL="https://data.nazarenolecis.com/bilancio-pubblico/dashboard.json";
  var current="tax_pressure";
  var defs={tax_pressure:"% PIL",public_spending:"% PIL",social_spending:"% PIL"};
  function n(v){var x=Number(v);return Number.isFinite(x)?x:null;}
  function a(v){return Array.isArray(v)?v:[];}
  function id(v){return document.getElementById(v);}
  function fmt(v){var x=n(v);return x===null?"-":x.toLocaleString("it-IT",{maximumFractionDigits:1});}
  function rows(p){return a(p.peer).map(function(r){return{name:String(r.country||r.paese||r.code||"-"),code:String(r.code||r.codice||r.paese||"-"),value:n(r[current])};}).filter(function(r){return r.value!==null;}).sort(function(x,y){return y.value-x.value;});}
  function table(list,unit){var body=id("bpPeerRows");if(!body)return;body.innerHTML="";list.forEach(function(r,i){var tr=document.createElement("tr");[String(i+1),r.name,r.code,fmt(r.value)+" "+unit].forEach(function(v){var td=document.createElement("td");td.textContent=v;tr.appendChild(td);});body.appendChild(tr);});}
  function chart(list,unit){var node=id("bpPeerBars");if(!node||!window.Plotly)return;var data=list.slice().reverse();window.Plotly.react(node,[{type:"bar",orientation:"h",x:data.map(function(r){return r.value;}),y:data.map(function(r){return r.code;}),customdata:data.map(function(r){return r.name;}),hovertemplate:"%{customdata}<br>%{x:.1f} "+unit+"<extra></extra>"}],{height:Math.max(520,list.length*22),margin:{t:18,r:24,b:44,l:92},showlegend:false,paper_bgcolor:"rgba(0,0,0,0)",plot_bgcolor:"rgba(0,0,0,0)",xaxis:{title:unit,fixedrange:true},yaxis:{title:"",fixedrange:true}},{responsive:true,displayModeBar:false,scrollZoom:false,doubleClick:false,showTips:false}).catch(function(){});}
  function labels(){document.querySelectorAll("h2").forEach(function(h){if(h.textContent.trim()==="Tasse dirette e indirette")h.textContent="Imposte dirette e indirette";});}
  function render(p){var s=id("bpPeerMetric");if(s&&s.value)current=s.value;var unit=defs[current]||"% PIL";var list=rows(p||{});if(!list.length)return;chart(list,unit);table(list,unit);}
  function start(){labels();window.fetch(URL).then(function(r){return r.json();}).then(function(p){var s=id("bpPeerMetric");if(s)s.addEventListener("change",function(){render(p);});render(p);}).catch(function(){});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(start,1200);setTimeout(start,2600);});else{setTimeout(start,1200);setTimeout(start,2600);}
})();
