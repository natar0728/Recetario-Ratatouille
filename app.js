// Dirección base del servicio.
// La clave 1 está destinada a pruebas y uso educativo.
const API = "https://www.themealdb.com/api/json/v1/1";

// Elementos del HTML.
const formulario = document.querySelector("#formulario");
const busqueda = document.querySelector("#busqueda");
const botonAleatoria = document.querySelector("#aleatoria");
const resultados = document.querySelector("#resultados");
const mensaje = document.querySelector("#mensaje");
const detalle = document.querySelector("#detalle");

let cargando = false;

// --------------------------------------------------
// EVENTOS
// --------------------------------------------------

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const termino = busqueda.value.trim();

  if (!termino) {
    mostrarMensaje("Escribe el nombre de una receta.");
    busqueda.focus();
    return;
  }

  buscarRecetas(termino);
});

botonAleatoria.addEventListener("click", obtenerAleatoria);

document.querySelector("#cerrar").addEventListener("click", () => {
  detalle.close();
});

// --------------------------------------------------
// MENSAJES Y ESTADO DE CARGA
// --------------------------------------------------

function mostrarMensaje(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.classList.toggle("error", esError);
}

function cambiarCarga(estado) {
  cargando = estado;

  formulario.querySelectorAll("button").forEach((boton) => {
    boton.disabled = estado;
  });

  resultados.setAttribute("aria-busy", String(estado));
}

// --------------------------------------------------
// OPCIÓN 1: FETCH CON ASYNC / AWAIT
// --------------------------------------------------

async function buscarRecetas(termino) {
  if (cargando) return;

  cambiarCarga(true);
  resultados.replaceChildren();
  mostrarMensaje("Buscando recetas...");

  try {
    // encodeURIComponent prepara el texto para usarlo en una URL.
    const url = `${API}/search.php?s=${encodeURIComponent(termino)}`;

    // 1. Enviar petición HTTP GET.
    const respuesta = await fetch(url);

    // 2. Comprobar el resultado HTTP.
    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    // 3. Convertir la respuesta JSON a un objeto JavaScript.
    const datos = await respuesta.json();

    // 4. Mostrar los datos recibidos.
    mostrarRecetas(datos.meals);
  } catch (error) {
    console.error("Error al buscar recetas:", error);

    mostrarMensaje(
      "No se pudieron cargar las recetas. Revisa tu conexión e inténtalo de nuevo.",
      true
    );
  } finally {
    // Se ejecuta tanto si funciona como si ocurre un error.
    cambiarCarga(false);
  }
}

// --------------------------------------------------
// OPCIÓN 2: FETCH CON THEN / CATCH
// --------------------------------------------------

function obtenerAleatoria() {
  if (cargando) return;

  cambiarCarga(true);
  resultados.replaceChildren();
  mostrarMensaje("Buscando una receta para sorprenderte...");

  fetch(`${API}/random.php`)
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
      }

      return respuesta.json();
    })
    .then((datos) => {
      mostrarRecetas(datos.meals);
    })
    .catch((error) => {
      console.error("Error al obtener receta aleatoria:", error);

      mostrarMensaje(
        "No se pudo obtener una receta. Inténtalo nuevamente.",
        true
      );
    })
    .finally(() => {
      cambiarCarga(false);
    });
}

// --------------------------------------------------
// GENERAR TARJETAS
// --------------------------------------------------

function mostrarRecetas(recetas) {
  resultados.replaceChildren();

  // La API puede devolver meals: null si no encuentra resultados.
  if (!Array.isArray(recetas) || recetas.length === 0) {
    mostrarMensaje(
      "No encontramos recetas. Prueba otro nombre en inglés, como pasta o cake."
    );
    return;
  }

  mostrarMensaje(
    recetas.length === 1
      ? "Encontramos 1 receta."
      : `Encontramos ${recetas.length} recetas.`
  );

  recetas.forEach((receta) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "receta";

    const imagen = document.createElement("img");
    imagen.src = receta.strMealThumb;
    imagen.alt = receta.strMeal;
    imagen.loading = "lazy";
    imagen.width = 400;
    imagen.height = 400;

    const titulo = document.createElement("h3");
    titulo.textContent = receta.strMeal;
    titulo.lang = "en";

    const informacion = document.createElement("p");
    informacion.textContent =
      `${receta.strCategory || "Sin categoría"} · ` +
      `${receta.strArea || "Sin región"}`;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton";
    boton.textContent = "Ver preparación ↗";

    boton.setAttribute(
      "aria-label",
      `Ver preparación de ${receta.strMeal}`
    );

    boton.addEventListener("click", () => {
      mostrarDetalle(receta);
    });

    tarjeta.append(imagen, titulo, informacion, boton);
    resultados.append(tarjeta);
  });
}

// --------------------------------------------------
// MOSTRAR INGREDIENTES E INSTRUCCIONES
// --------------------------------------------------

function mostrarDetalle(receta) {
  document.querySelector("#titulo-detalle").textContent =
    receta.strMeal;

  document.querySelector("#categoria-detalle").textContent =
    receta.strCategory || "Receta";

  const imagen = document.querySelector("#imagen-detalle");
  imagen.src = receta.strMealThumb;
  imagen.alt = receta.strMeal;

  document.querySelector("#instrucciones").textContent =
    receta.strInstructions || "Esta receta no incluye instrucciones.";

  const lista = document.querySelector("#ingredientes");
  lista.replaceChildren();

  // TheMealDB devuelve campos numerados del 1 al 20.
  for (let numero = 1; numero <= 20; numero++) {
    const ingrediente =
      receta[`strIngredient${numero}`]?.trim();

    const medida =
      receta[`strMeasure${numero}`]?.trim();

    if (ingrediente) {
      const elemento = document.createElement("li");

      elemento.textContent =
        medida ? `${medida} — ${ingrediente}` : ingrediente;

      lista.append(elemento);
    }
  }

  if (!lista.children.length) {
    const elemento = document.createElement("li");
    elemento.textContent = "No se proporcionaron ingredientes.";
    lista.append(elemento);
  }

  detalle.showModal();
  detalle.scrollTop = 0;
}

// Primera consulta al abrir el portal.
buscarRecetas("pasta");