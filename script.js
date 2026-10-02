/* ================= CONFIGURACIÓN ================= */
// URL de tu Firebase Realtime Database (sin "/" al final). Ejemplo:
// "https://mi-proyecto-default-rtdb.firebaseio.com"
// Si lo dejas vacío, el historial se guarda solo en este navegador (modo prueba).
const DB_URL = "";
// Contraseña para borrar el historial (cámbiala)
const PIN_ADMIN = "1234";
/* ================================================== */

const $ = id => document.getElementById(id);
const cv = $("lienzo"), ctx = cv.getContext("2d");
const W = cv.width, H = cv.height;

let nombre = "", puntos = 0, vidas = 2, manzanas = 0, nivel = 1;
let items = [], jugador = {x: W/2, w: 64, h: 50};
let corriendo = false, pausado = false, ultimo = 0, spawnT = 0;
let teclas = {};

/* ================= PREMIOS ================= */
function premioPara(p){
  if (p >= 400) return "Gomitas preparadas";
  if (p >= 200) return "Paleta";
  if (p >= 100) return "Sin premio, sigue intentando";
  return "Chocolate";
}
function premioTexto(p){
  if (p >= 400) return "🎁 Ganaste el premio mayor: unas gomitas preparadas";
  if (p >= 200) return "🎁 Ganaste el premio intermedio: una palta";
  if (p >= 100) return "Sin premio, sigue intentando";
  return "🎁 Ganaste el premio menor: un chocolate";
}

/* ================= DIFICULTAD ================= */
function calcNivel(){ return Math.min(10, Math.floor(puntos / 100) + 1); }
function velocidad(){ return 110 + nivel * 38; }                 // px por segundo
function intervalo(){ return Math.max(320, 1000 - nivel * 70); } // ms entre objetos
function probBomba(){ return nivel < 3 ? 0 : Math.min(0.45, 0.12 + (nivel - 3) * 0.06); }

/* ================= CONTROL DEL JUEGO ================= */
function iniciar(){
  puntos = 0; vidas = 2; manzanas = 0; nivel = 1; items = []; spawnT = 0;
  jugador.x = W/2; pausado = false; corriendo = true;
  $("btnPausa").textContent = "⏸";
  actualizarHUD();
  $("inicio").classList.add("hidden");
  $("fin").classList.add("hidden");
  $("juego").classList.remove("hidden");
  ultimo = performance.now();
  requestAnimationFrame(bucle);
}

function actualizarHUD(){
  $("hNombre").textContent = nombre;
  $("hPuntos").textContent = puntos;
  $("hVidas").textContent = "❤️".repeat(vidas) + "🖤".repeat(2 - vidas);
  $("hNivel").textContent = nivel;
}

function crearItem(){
  const bomba = Math.random() < probBomba();
  const vel = velocidad() * (bomba ? 1.15 : 1) * (0.9 + Math.random() * 0.3);
  items.push({x: 20 + Math.random() * (W - 40), y: -20, bomba, vel, r: 18});
}

function bucle(t){
  if (!corriendo) return;
  const dt = Math.min(0.05, (t - ultimo) / 1000);
  ultimo = t;
  if (!pausado) actualizar(dt);
  dibujar();
  requestAnimationFrame(bucle);
}

function actualizar(dt){
  // Movimiento del jugador
  const v = 340;
  if (teclas["ArrowLeft"] || teclas["a"] || teclas["A"]) jugador.x -= v * dt;
  if (teclas["ArrowRight"] || teclas["d"] || teclas["D"]) jugador.x += v * dt;
  jugador.x = Math.max(jugador.w/2, Math.min(W - jugador.w/2, jugador.x));

  // Aparición de objetos
  spawnT += dt * 1000;
  if (spawnT >= intervalo()){ spawnT = 0; crearItem(); }

  // Caída y colisiones
  const py = H - jugador.h - 6;
  for (let i = items.length - 1; i >= 0; i--){
    const it = items[i];
    it.y += it.vel * dt;
    const choca = it.y + it.r > py && it.y - it.r < py + jugador.h &&
                  Math.abs(it.x - jugador.x) < jugador.w/2 + it.r * 0.6;
    if (choca){
      items.splice(i, 1);
      if (it.bomba){
        vidas--;
        navigator.vibrate && navigator.vibrate(120);
      } else {
        puntos += 10; manzanas++;
      }
      nivel = calcNivel();
      actualizarHUD();
      if (vidas <= 0){ terminar(); return; }
    } else if (it.y > H + 30){
      items.splice(i, 1);
    }
  }
}

/* ================= DIBUJO ================= */
function dibujar(){
  // Fondo: cielo, colinas y pasto
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#9ad8ff"); g.addColorStop(1, "#d9f5c0");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#7fc45a"; ctx.beginPath(); ctx.ellipse(100, H, 260, 120, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#6aa84f"; ctx.beginPath(); ctx.ellipse(330, H, 240, 90, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#5a8f3e"; ctx.fillRect(0, H - 14, W, 14);
  ctx.font = "46px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🌳", 40, H - 60); ctx.fillText("🌳", W - 40, H - 60);

  // Manzanas y bombas
  ctx.font = "36px serif";
  for (const it of items){
    if (it.bomba){
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.beginPath(); ctx.arc(it.x, it.y, it.r + 5, 0, Math.PI*2); ctx.fill();
      ctx.fillText("💣", it.x, it.y);
    } else {
      ctx.fillText("🍎", it.x, it.y);
    }
  }

  // Jugador
  ctx.font = "50px serif";
  ctx.fillText("🧑‍🌾", jugador.x, H - jugador.h/2 - 6);
  ctx.font = "30px serif";
  ctx.fillText("🧺", jugador.x, H - 10);

  // Pausa
  if (pausado){
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; ctx.font = "bold 36px Arial"; ctx.fillText("PAUSA", W/2, H/2);
  }
}

/* ================= FIN DE PARTIDA ================= */
async function terminar(){
  corriendo = false;
  $("juego").classList.add("hidden");
  $("fin").classList.remove("hidden");
  $("fNombre").textContent = nombre;
  $("fPuntos").textContent = puntos;
  $("fManzanas").textContent = manzanas;
  $("fPremio").textContent = premioTexto(puntos);
  $("fEstado").textContent = "Guardando partida...";
  const ok = await guardarPartida({
    nombre, puntos, premio: premioPara(puntos), fecha: new Date().toISOString()
  });
  $("fEstado").textContent = ok ? "✅ Partida guardada" : "⚠️ No se pudo guardar la partida";
  cargarHistorial();
}

/* ================= BASE DE DATOS (Firebase REST o localStorage) ================= */
async function guardarPartida(p){
  try{
    if (DB_URL){
      const r = await fetch(DB_URL + "/partidas.json", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(p)
      });
      return r.ok;
    }
    const lista = JSON.parse(localStorage.getItem("partidas") || "[]");
    lista.push(p);
    localStorage.setItem("partidas", JSON.stringify(lista));
    return true;
  }catch(e){ return false; }
}

async function leerPartidas(){
  if (DB_URL){
    const r = await fetch(DB_URL + "/partidas.json");
    const d = await r.json();
    return d ? Object.values(d) : [];
  }
  return JSON.parse(localStorage.getItem("partidas") || "[]");
}

async function borrarPartidas(){
  if (DB_URL){
    const r = await fetch(DB_URL + "/partidas.json", {method: "DELETE"});
    return r.ok;
  }
  localStorage.removeItem("partidas");
  return true;
}

/* ================= HISTORIAL ================= */
async function cargarHistorial(){
  $("avisoDB").textContent = DB_URL ? "" :
    "⚠️ Modo prueba: el historial solo se guarda en este navegador. Configura DB_URL para compartirlo entre dispositivos.";
  const tb = $("tabla");
  try{
    const lista = (await leerPartidas()).sort((a, b) => b.puntos - a.puntos).slice(0, 50);
    tb.innerHTML = "";
    if (!lista.length){
      const tr = document.createElement("tr"), td = document.createElement("td");
      td.colSpan = 4; td.textContent = "Aún no hay partidas.";
      tr.appendChild(td); tb.appendChild(tr);
      return;
    }
    for (const p of lista){
      const tr = document.createElement("tr");
      const f = new Date(p.fecha);
      [p.nombre, p.puntos, p.premio, isNaN(f) ? "" : f.toLocaleDateString("es")].forEach((v, i) => {
        const td = document.createElement("td");
        if (i === 1) td.className = "n";
        td.textContent = v;   // textContent evita inyección de código
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    }
  }catch(e){
    tb.innerHTML = "";
    $("avisoDB").textContent = "⚠️ No se pudo cargar el historial.";
  }
}

/* ================= BORRAR HISTORIAL ================= */
$("btnBorrar").onclick = () => {
  $("pin").value = "";
  $("pinError").textContent = "";
  $("modal").classList.remove("hidden");
};
$("btnCancelar").onclick = () => $("modal").classList.add("hidden");
$("btnConfirmar").onclick = async () => {
  if ($("pin").value !== PIN_ADMIN){ $("pinError").textContent = "Contraseña incorrecta."; return; }
  const ok = await borrarPartidas();
  if (!ok){ $("pinError").textContent = "No se pudo borrar."; return; }
  $("modal").classList.add("hidden");
  cargarHistorial();
};

/* ================= CONTROLES ================= */
addEventListener("keydown", e => {
  teclas[e.key] = true;
  if (e.key.startsWith("Arrow")) e.preventDefault();
});
addEventListener("keyup", e => { teclas[e.key] = false; });

function moverConPuntero(e){
  const r = cv.getBoundingClientRect();
  jugador.x = (e.clientX - r.left) * (W / r.width);
  jugador.x = Math.max(jugador.w/2, Math.min(W - jugador.w/2, jugador.x));
}
cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); moverConPuntero(e); });
cv.addEventListener("pointermove", e => { if (e.buttons || e.pointerType === "touch") moverConPuntero(e); });

$("btnPausa").onclick = () => {
  if (!corriendo) return;
  pausado = !pausado;
  $("btnPausa").textContent = pausado ? "▶" : "⏸";
};

$("btnJugar").onclick = () => {
  const n = $("nombre").value.trim();
  if (!n){ $("nombre").focus(); $("nombre").style.borderColor = "red"; return; }
  nombre = n;
  iniciar();
};
$("nombre").addEventListener("keydown", e => { if (e.key === "Enter") $("btnJugar").click(); });
$("btnOtra").onclick = iniciar;

/* ================= INICIO ================= */
cargarHistorial();