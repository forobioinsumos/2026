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
const SHEET_TSV_CONFERENCISTAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnDwg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=0&single=true&output=tsv";
const SHEET_TSV_LOGOS_APOYO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnDwg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=194022463&single=true&output=tsv";
const SHEET_TSV_LOGOS_ORGANIZAN = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnDwg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=974092861&single=true&output=tsv";
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

// =======================================================
// REEMPLAZAR EN JS/DATA.JS (RENDERIZADO DEL PROGRAMA)   
// =======================================================
async function renderPrograma() {
  const container = document.getElementById("programa-container");
  if (!container) return;

  container.innerHTML = `
    <div class="programa-loading" style="text-align: center; padding: 2rem; color: var(--muted, #666);">
      <i class="fa-solid fa-spinner fa-spin"></i> Cargando programa actualizado...
    </div>`;

  const programa = await fetchPrograma();

  if (programa && programa.imagen) {
    container.innerHTML = `
      <div class="programa-wrapper text-center" style="max-width: 1000px; margin: 0 auto;">
        <h3 style="margin-bottom: 1.5rem; color: #00204a; font-weight: 700;">${programa.titulo}</h3>
        <div class="programa-img-card" style="background: #fff; padding: 1rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
          <img src="${programa.imagen}" 
               alt="${programa.titulo}" 
               style="width: 100%; height: auto; border-radius: 8px; display: block;"
               loading="lazy"
               onerror="this.onerror=null; this.parentElement.innerHTML='<p style=\'padding:2rem; color:#666;\'>No se pudo cargar la imagen del programa.</p>';">
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="programa-placeholder text-center" style="padding: 3rem 1rem; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
        <i class="fa-solid fa-calendar-check" style="font-size: 2.5rem; color: #166534; margin-bottom: 1rem;"></i>
        <h3 style="color: #00204a; font-weight: 700; margin-bottom: 0.5rem;">Programa en Construcción</h3>
        <p style="color: #64748b; max-width: 600px; margin: 0 auto;">Estamos finalizando los detalles de la agenda detallada con los ponentes y paneles confirmados. Muy pronto estará disponible aquí.</p>
      </div>
    `;
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
