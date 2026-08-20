// =====================================
// UTILIDADES
// =====================================
function convertirLinkDriveAImagen(url) {
  const FALLBACK = "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop";
  if (!url) return FALLBACK;

  const match = url.match(/(?:d\/|id=)([a-zA-Z0-9_-]{25,})/);
  if (!match) return url;

  const fileId = match[1];
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
}

// =====================================
// ENDPOINTS Y APIS DE GOOGLE SHEETS (TSV)
// =====================================
const SHEET_TSV_CONFERENCISTAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnWg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=0&single=true&output=tsv";
const SHEET_TSV_LOGOS_APOYO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnWg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=194022463&single=true&output=tsv";
const SHEET_TSV_LOGOS_ORGANIZAN = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnWg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=974092861&single=true&output=tsv";
// Gid de prueba para el programa (puedes actualizar esta URL con la pestaña correspondiente)
const SHEET_TSV_PROGRAMA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnDwg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=1228931288&single=true&output=tsv";

// =====================================
// EXTRACCIÓN DE CONFERENCISTAS
// =====================================
async function fetchConferencistas() {
  try {
    const response = await fetch(SHEET_TSV_CONFERENCISTAS);
    const text = await response.text();
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
    
    return rows.slice(1).map(row => {
      const values = row.split("\t").map(item => item.trim().replace(/^"|"$/g, ''));
      return {
        nombre: values[0] || "Conferencista Invitado",
        detalle: values[1] || "Información no disponible.",
        foto: convertirLinkDriveAImagen(values[2])
      };
    });
  } catch (error) {
    console.error("Error cargando Conferencistas desde TSV:", error);
    return [];
  }
}

// =====================================
// EXTRACCIÓN DE LOGOS REUTILIZABLE
// =====================================
async function fetchLogosFromUrl(sheetUrl) {
  try {
    const response = await fetch(sheetUrl);
    const text = await response.text();
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
    
    return rows.slice(1).map(row => {
      const values = row.split("\t").map(item => item.trim().replace(/^"|"$/g, ''));
      
      let escala = values[2] ? values[2].replace('%', '').trim() : "100";
      if (isNaN(escala) || escala === "") escala = "100";

      return {
        nombre: values[0] || "Logo",
        foto: convertirLinkDriveAImagen(values[1]),
        escala: escala
      };
    });
  } catch (error) {
    console.error("Error cargando logos desde TSV:", error);
    return [];
  }
}

// =====================================
// RENDERIZADO EN EL DOM
// =====================================
async function renderConferencistas() {
  const container = document.getElementById("speakers-grid");
  if (!container) return;

  container.innerHTML = `<div class="speakers-loading" style="text-align: center; grid-column: 1/-1; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando conferencistas...</div>`;

  const conferencistas = await fetchConferencistas();

  if (conferencistas.length === 0) {
    container.innerHTML = `<p class="no-data" style="text-align: center; grid-column: 1/-1;">Próximamente confirmación de nuevos ponentes.</p>`;
    return;
  }

  container.innerHTML = conferencistas.map((speaker, index) => `
    <article class="speaker-card">
      <div class="speaker-img-wrap">
        <img src="${speaker.foto}" 
             alt="${speaker.nombre}" 
             loading="lazy" 
             onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop';">
      </div>
      <div class="speaker-body">
        <h3 class="speaker-name">${speaker.nombre}</h3>
        <p class="speaker-preview">${speaker.detalle}</p>
        <button class="btn-speaker-more" onclick="abrirModalSpeaker(${index})">
          Ver detalle <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </article>
  `).join("");

  window.listaConferencistas = conferencistas;
}

// Renderizado de las dos secciones de logos
async function renderLogosGenerico(containerId, sheetUrl) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="logos-loading" style="text-align: center; grid-column: 1/-1; padding: 1.5rem; color: var(--muted);">
      <i class="fa-solid fa-spinner fa-spin"></i> Cargando instituciones...
    </div>`;

  const logos = await fetchLogosFromUrl(sheetUrl);

  if (logos.length === 0) {
    container.innerHTML = `<p class="no-data" style="text-align: center; grid-column: 1/-1; color: var(--muted);">Próximamente más instituciones.</p>`;
    return;
  }

  container.innerHTML = logos.map(logo => `
    <div class="logo-card" title="${logo.nombre}">
      <img src="${logo.foto}" 
           alt="${logo.nombre}" 
           style="max-width: ${logo.escala}%; max-height: ${logo.escala}%;"
           loading="lazy" 
           onerror="this.onerror=null; this.src='assets/icons/favicon.svg';">
    </div>
  `).join("");
}

// =====================================
// RENDERIZADO DEL PROGRAMA EN IMAGEN
// =====================================
async function renderPrograma() {
  const container = document.getElementById("programa-container");
  if (!container) return;

  try {
    const response = await fetch(SHEET_TSV_PROGRAMA);
    const text = await response.text();
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
    
    if (rows.length < 2) return;

    // Lee la primera fila útil (omite encabezado): Nombre | URL Imagen
    const values = rows[1].split("\t").map(item => item.trim().replace(/^"|"$/g, ''));
    const tituloPrograma = values[0] || "Programa General del Evento";
    const urlImagenPrograma = convertirLinkDriveAImagen(values[1]);

    if (!values[1]) return;

    container.innerHTML = `
      <div class="programa-wrapper text-center">
        <a href="${urlImagenPrograma}" target="_blank" rel="noopener noreferrer" title="Haga clic para abrir la imagen en alta resolución">
          <img src="${urlImagenPrograma}" alt="${tituloPrograma}" class="programa-img-preview">
        </a>
        <div style="margin-top: 15px;">
          <a href="${urlImagenPrograma}" target="_blank" rel="noopener noreferrer" class="secondary-btn-outline">
            <i class="fa-solid fa-magnifying-glass-plus"></i> Ver programa en pantalla completa
          </a>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar la imagen del programa:", error);
  }
}

// =====================================
// LÓGICA DE MODALES
// =====================================
function abrirModalSpeaker(index) {
  const speaker = window.listaConferencistas[index];
  if (!speaker) return;

  const modal = document.getElementById("speaker-modal");
  document.getElementById("modal-speaker-img").src = speaker.foto;
  document.getElementById("modal-speaker-name").textContent = speaker.nombre;
  document.getElementById("modal-speaker-bio").textContent = speaker.detalle;

  modal.classList.add("active");
}

function cerrarModalSpeaker() {
  const modal = document.getElementById("speaker-modal");
  if (modal) modal.classList.remove("active");
}

// =====================================
// INICIALIZACIÓN ÚNICA DOM
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  renderConferencistas();
  renderLogosGenerico("logos-organizan-grid", SHEET_TSV_LOGOS_ORGANIZAN);
  renderLogosGenerico("logos-grid", SHEET_TSV_LOGOS_APOYO);
  renderPrograma();
});
