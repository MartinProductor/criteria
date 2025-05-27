require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3001;

const { obtenerTodasDesencriptadas } = require('./persistencia/datos');

const CLAVE_CORRECTA = process.env.CLAVE_VISUALIZADOR;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const path = require('path');
console.log("Buscando datos.js en:", path.resolve('./persistencia/datos.js'));

// Middleware para proteger rutas
function requiereClave(req, res, next) {
  if (req.cookies && req.cookies.acceso === CLAVE_CORRECTA) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Login simple por formulario
app.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login</title>
      <style>
        /* ...el CSS del login va acá, sin cambios... */
      </style>
    </head>
    <body>
      <div class="login-container">
        <div class="logo">Criter<span class="highlight">ia</span></div>
        <div class="subtitle">Ingresa tu clave</div>
        <form method="POST" action="/login">
          <div class="form-group">
            <label for="clave">Clave de acceso</label>
            <input type="password" id="clave" name="clave" required>
          </div>
          <button type="submit">Ingresar</button>
        </form>
        <div class="footer">Acceso seguro al sistema</div>
      </div>
    </body>
    </html>
  `);
});

app.post('/login', (req, res) => {
  const clave = req.body.clave;
  if (clave === CLAVE_CORRECTA) {
    res.cookie('acceso', CLAVE_CORRECTA, {
      httpOnly: true,
      maxAge: 5 * 60 * 1000 // 5 minutos
    });
    res.redirect('/');
  } else {
    res.send('<h3>Clave incorrecta</h3><a href="/login">Reintentar</a>');
  }
});

// Visualización protegida y mejorada con indicadores de interacción
app.get('/', requiereClave, (req, res) => {
  const datos = obtenerTodasDesencriptadas();

  const filas = datos.map(d => {
    const duracionSegundos = (d.duracionMs / 1000).toFixed(2);
    const cantidadCambios = d.historial.length;
    const velocidadEscritura = (d.caracteres / duracionSegundos).toFixed(2);

    return `
      <tr>
        <td class="id-cell">${d.id}</td>
        <td class="datetime-cell">${d.fechaLocal}<br><span class="time">${d.horaLocal}</span></td>
        <td class="duration-cell">${duracionSegundos}<span class="unit">s</span></td>
        <td class="stats-cell">
          <div class="stat-item"><strong>${d.palabras}</strong> palabras</div>
          <div class="stat-item"><strong>${d.caracteres}</strong> chars</div>
          <div class="stat-item"><strong>${cantidadCambios}</strong> cambios</div>
          <div class="stat-item"><strong>${velocidadEscritura}</strong> chars/s</div>
        </td>
        <td class="ip-cell">${d.ip}</td>
        <td class="useragent-cell">${d.userAgent}</td>
        <td class="content-cell">
          <div class="collapsible-section">
            <button class="toggle-btn" onclick="toggleContent(this)" title="Expandir/Contraer contenido">
              <span class="arrow">▼</span> Ver contenido
            </button>
            <div class="collapsible-content" style="display: none; margin-top:8px; line-height:1.4;">
              ${d.contenido}
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Visualizador - Indicadores de Interacción</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .logo {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 10px;
          letter-spacing: -1px;
        }
        .logo .highlight {
          color: #fff;
          font-weight: 700;
          text-shadow: 0 0 10px rgba(255,255,255,0.3);
        }
        .subtitle {
          font-size: 16px;
          opacity: 0.9;
        }
        .table-container {
          padding: 20px;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: top;
        }
        tr:hover {
          background-color: #f8f9ff;
        }
        .id-cell       { font-weight: 600; color: #667eea; text-align: center; width: 5%; }
        .datetime-cell { width: 15%; }
        .duration-cell { width: 8%; }
        .stats-cell    { width: 25%; }
        .ip-cell       { width: 15%; font-family: monospace; }
        .useragent-cell{ width: 20%; font-size: 12px; line-height:1.2; }
        .content-cell  { width: 12%; }

        /* Toggle button */
        .toggle-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
        }
        .toggle-btn .arrow {
          display: inline-block;
          transition: transform 0.3s ease;
          margin-right: 6px;
        }
        .toggle-btn.active .arrow {
          transform: rotate(-180deg);
        }
      </style>
      <script>
        function toggleContent(btn) {
          const content = btn.nextElementSibling;
          btn.classList.toggle('active');
          if (content.style.display === 'none') {
            content.style.display = 'block';
          } else {
            content.style.display = 'none';
          }
        }
      </script>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Criter<span class="highlight">ia</span></div>
          <div class="subtitle">Indicadores de Interacción</div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha / Hora</th>
                <th>Duración</th>
                <th>Stats</th>
                <th>IP</th>
                <th>User Agent</th>
                <th>Contenido</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Visualizador listo en http://localhost:${port}`);
});
