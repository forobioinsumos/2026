// =====================================
// UTILIDADES
// =====================================
function convertirLinkDriveAImagen(url) {
  const FALLBACK = "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop";
  if (!url) return FALLBACK;

  // Extrae el ID de Drive ya sea enlace completo, enlace de compartir o ID directo
  const match = url.match(/(?:d\/|id=)([a-zA-Z0-9_-]{25,})/);
  if (!match) return url;

  const fileId = match[1];
  // Servidor de miniaturas de Google Drive (sz=w800 solicita un ancho de 800px)
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
}

// =====================================
// EXTRACCIÓN DE CONFERENCISTAS (TSV)
// =====================================
const SHEET_TSV_CONFERENCISTAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnDwg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=0&single=true&output=tsv";
const SHEET_TSV_LOGOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnDwg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=194022463&single=true&output=tsv";

async function fetchConferencistas() {
  try {
    const response = await fetch(SHEET_TSV_CONFERENCISTAS);
    const text = await response.text();
    
    // Dividir el TSV por saltos de línea
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
    
    // Omitimos la primera fila (encabezado) y mapeamos separando por tabulaciones (\t)
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

async function fetchLogos() {
  try {
    const response = await fetch(SHEET_TSV_LOGOS);
    const text = await response.text();
    
    // Dividir el TSV por saltos de línea
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
    
    // Omitimos la primera fila (encabezado) y mapeamos separando por tabulaciones (\t)
    return rows.slice(1).map(row => {
      const values = row.split("\t").map(item => item.trim().replace(/^"|"$/g, ''));
      
      return {
        nombre: values[0] || "lOGO",
        foto: convertirLinkDriveAImagen(values[1])
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

  // Guardamos la lista en window para que el modal la consulte
  window.listaConferencistas = conferencistas;
}

// =====================================
// RENDERIZADO DE LOGOS INSTITUCIONALES
// =====================================
async function renderLogos() {
  const container = document.getElementById("logos-grid");
  if (!container) return;

  container.innerHTML = `
    <div class="logos-loading" style="text-align: center; grid-column: 1/-1; padding: 1.5rem; color: var(--muted);">
      <i class="fa-solid fa-spinner fa-spin"></i> Cargando instituciones...
    </div>`;

  const logos = await fetchLogos();

  if (logos.length === 0) {
    container.innerHTML = `<p class="no-data" style="text-align: center; grid-column: 1/-1; color: var(--muted);">Próximamente más instituciones.</p>`;
    return;
  }

  container.innerHTML = logos.map(logo => `
    <div class="logo-card" title="${logo.nombre}">
      <img src="${logo.foto}" 
           alt="${logo.nombre}" 
           loading="lazy" 
           onerror="this.onerror=null; this.src='assets/images/favicon.svg';">
    </div>
  `).join("");
}

// Ejecutar ambas cargas al iniciar
document.addEventListener("DOMContentLoaded", () => {
  renderConferencistas();
  renderLogos();
});

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

// Ejecutar al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
  renderConferencistas();
});
