const express = require('express');
const app = express();
const port = 3000;

const { guardar } = require('./persistencia/datos');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">      
      <title>Sugerencias del Juzgado</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .main-container {
          background: white;
          padding: 40px 30px 30px 30px;
          border-radius: 16px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.10);
          width: 100%;
          max-width: 460px;
          text-align: center;
        }
        .logo {
          width: 90px;
          display: block;
          margin: 0 auto 12px auto;
        }
        .logo-text {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #333;
          letter-spacing: -1px;
        }
        .logo-text .highlight {
          color: #667eea;
          font-weight: 900;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
          margin-bottom: 16px;
        }
        form {
          margin-top: 16px;
        }
        label {
          display: block;
          margin-bottom: 10px;
          color: #555;
          font-weight: 500;
          text-align: left;
        }
        textarea {
          width: 100%;
          min-height: 110px;
          padding: 14px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 16px;
          background-color: #fafafa;
          resize: vertical;
          margin-bottom: 18px;
          transition: border-color 0.3s ease;
        }
        textarea:focus {
          outline: none;
          border-color: #667eea;
          background: #fff;
        }
        button[type="submit"] {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        button[type="submit"]:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102,126,234,0.15);
        }
        .footer {
          margin-top: 22px;
          color: #aaa;
          font-size: 13px;
        }
        .demo-text {
          position: absolute;
          top: 20px;
          left: 0; right: 0;
          text-align: center;
          color: #fff;
          background: rgba(118, 75, 162, 0.8);
          font-size: 13px;
          padding: 4px 0;
          border-radius: 0 0 8px 8px;
          z-index: 10;
          letter-spacing: 1px;
        }
        @media (max-width: 600px) {
          .main-container {
            padding: 20px 5vw;
            max-width: 98vw;
          }
          .logo-text { font-size: 26px; }
          textarea { font-size: 15px; }
        }
      </style>
    </head>
    <body>
      <div class="demo-text">Criter<span class="highlight">Ia</span> - Demo privada</div>
      <div class="main-container">
        <img src="./logotipopj.png" alt="Logo PJ Mendoza" class="logo">
        <div class="logo-text">Criter<span class="highlight">ia</span></div>
        <div class="subtitle">Formulario anónimo para sugerencias y sensaciones</div>
        <form id="form-sugerencia" action="/enviar" method="POST" autocomplete="off">
          <label for="sugerencia">¿Cómo te sentís respecto a la IA en general y la justicia?<br><span style="font-size:13px;color:#999;font-weight:400;">Recomendación: usá tu propio lenguaje</span></label>
          <textarea id="sugerencia" name="sugerencia" required placeholder="Escribí tu sugerencia o sensación aquí..."></textarea>
          <input type="hidden" id="historial" name="historial">
          <input type="hidden" id="duracion" name="duracion">
          <button type="submit">Enviar</button>
        </form>
        <div class="footer">
          <span>El mensaje se guarda de forma anónima y segura.</span>
        </div>
      </div>
      <script>
        const textarea = document.getElementById("sugerencia");
        const historial = [];
        let startTime = null;

        textarea.addEventListener("input", () => {
          const timestamp = new Date().toISOString();
          if (!startTime) startTime = Date.now();
          historial.push({ texto: textarea.value, timestamp });
        });

        document.getElementById("form-sugerencia").addEventListener("submit", () => {
          const endTime = Date.now();
          const duracionMs = startTime ? (endTime - startTime) : 0;
          document.getElementById("historial").value = JSON.stringify(historial);
          document.getElementById("duracion").value = duracionMs;
        });
      </script>
    </body>
    </html>
  `);
});

app.post('/enviar', (req, res) => {
  const sugerencia = req.body.sugerencia;
  const historial = req.body.historial;
  const duracion = parseInt(req.body.duracion || 0);
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const entrada = guardar({ contenido: sugerencia, historial, duracion, ip, userAgent });

  // Para evitar inyecciones, mostrar mensaje seguro
  const mensajeSeguro = JSON.stringify(`Sugerencia enviada correctamente: \n\n${sugerencia}`);

  res.send(`
    <script>
      alert(${mensajeSeguro});
      window.location.href = "/";
    </script>
  `);
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
