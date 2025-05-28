//Pequeña modularizacion, dejamos el tramite de datos aparte, para que juegue el futuro backend si ganamos

// persistencia/datos.js
const fs = require('fs');
const crypto = require('crypto');
const archivo = './sugerencias.json';

//Medida de seguridad basica. A prueba de hackers novatos
require('dotenv').config(); //usamos variables de environement para ocultar la clave
const secretKey = process.env.CLAVE_VISUALIZADOR;

// Cifrado y descifrado con crypto. Está deprecado porque lo generé con 4o. Estoy al tanto que entrenan
// con código que usa librerias que se actualizan constantemente. 
// No todo es vibecoding :D
function cifrar(texto) {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let enc = cipher.update(texto, 'utf8', 'hex');
  enc += cipher.final('hex');
  return enc;
}

function descifrar(texto) {
  const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
  let dec = decipher.update(texto, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

function leerArchivo() {
  if (!fs.existsSync(archivo)) return [];
  try {
    const contenido = fs.readFileSync(archivo, 'utf8');
    const data = JSON.parse(contenido);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error al leer sugerencias.json:", err.message);
    return [];
  }
}

//agregado de funciones de trazabilidad para cumplir punto 9 (indicadores)
//quiza haya potencial de hacer varios mapas visuales que nos den informacion nueva

function guardar({ contenido, historial, duracion, ip, userAgent }) {
  const ahora = new Date();

  const entrada = {
    id: generarID(),
    contenido: cifrar(contenido),
    historial: historial ? cifrar(historial) : null,
    duracionMs: Number(duracion) || 0,
    fechaISO: ahora.toISOString(),
    fechaLocal: ahora.toLocaleDateString('es-AR'),
    horaLocal: ahora.toLocaleTimeString('es-AR'),
    timestamp: ahora.getTime(),
    ip,
    userAgent,
    caracteres: contenido.length,
    palabras: contenido.trim().split(/\s+/).length
  };

  const data = leerArchivo();
  data.push(entrada);
  fs.writeFileSync(archivo, JSON.stringify(data, null, 2));
  return entrada;
}

function obtenerTodasDesencriptadas() {
  const data = leerArchivo();
  return data.map(e => ({
    ...e,
    contenido: descifrar(e.contenido),
    historial: e.historial ? JSON.parse(descifrar(e.historial)) : [],
  }));
}
//Aca chatgpt me explico que con este tipo de ID es mucho mas unico que usar numeros secuenciales.
//Recuerden vibecoders: charlen con su amigo gpt para que les explique qué esta haciendo

function generarID() {
  return Math.floor(Math.random() * 1000000000).toString(36);
}

//una belleza. 
module.exports = {
  guardar,
  obtenerTodasDesencriptadas,
  descifrar
};
