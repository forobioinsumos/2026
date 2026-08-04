// =====================================
// UTILIDADES
// =====================================
function convertirLinkDriveAImagen(url) {
  if (!url) return "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return url;
  return `https://docs.google.com/uc?export=view&id=${match[1]}`;
}

// =====================================
// EXTRACCIÓN DE CONFERENCISTAS (TSV)
// =====================================
const SHEET_TSV_CONFERENCISTAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfovABvdTQnDwg-8ZJs-dWFP7zIgUa8-YsKESe0_cz5hNuUPGNFTVuKYBDO-aqlwO-XoT2Bca8GVpy/pub?gid=0&single=true&output=tsv";

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
        <img src="${speaker.foto}" alt="${speaker.nombre}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600'">
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