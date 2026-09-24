let ultimoResultado = null;

const titulos = {
    dashboard: "Dashboard",
    analizar: "Analizar correo",
    prospectos: "Prospectos",
    tareas: "Tareas",
    reuniones: "Reuniones"
};

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
});

function showView(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

    document.getElementById(`view-${view}`).classList.add("active");

    const button = document.querySelector(`[data-view="${view}"]`);
    if (button) button.classList.add("active");

    document.getElementById("page-title").textContent = titulos[view];

    if (view === "dashboard") cargarDashboard();
    if (view === "prospectos") cargarProspectos();
    if (view === "tareas") cargarTareas();
    if (view === "reuniones") cargarReuniones();
}

async function analizarCorreo() {
    const correo = document.getElementById("correo").value.trim();
    const error = document.getElementById("error");

    error.classList.add("hidden");

    if (!correo) {
        error.textContent = "Escribe o pega un correo antes de analizar.";
        error.classList.remove("hidden");
        return;
    }

    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("btn-analizar").disabled = true;

    try {
        const response = await fetch("/api/analizar", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({correo})
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Error al analizar.");

        ultimoResultado = data;
        mostrarResultado(data);

    } catch (e) {
        error.textContent = e.message;
        error.classList.remove("hidden");
    } finally {
        document.getElementById("loading").classList.add("hidden");
        document.getElementById("btn-analizar").disabled = false;
    }
}

function mostrarResultado(data) {
    document.getElementById("resultado").classList.remove("hidden");

    const c = data.cliente || {};

    document.getElementById("cliente").innerHTML = `
        <div><strong>Nombre:</strong> ${esc(c.nombre)}</div>
        <div><strong>Empresa:</strong> ${esc(c.empresa)}</div>
        <div><strong>Email:</strong> ${esc(c.email)}</div>
    `;

    document.getElementById("resumen").textContent = data.resumen || "Sin resumen.";

    document.getElementById("prioridad").innerHTML =
        `<span class="badge">Prioridad: ${esc(data.prioridad || "Media")}</span>`;

    document.getElementById("requisitos").innerHTML =
        (data.requisitos || []).map(r => `<li>${esc(r)}</li>`).join("") ||
        "<li>No se detectaron requisitos.</li>";

    document.getElementById("lista-tareas").innerHTML =
        (data.tareas || []).map((t, i) => `
            <div class="task-item">
                <strong>${esc(t.titulo)}</strong>
                <div>${esc(t.descripcion)}</div>
                <span class="badge">${esc(t.prioridad)}</span>
                ${t.fecha_limite ? `<span class="badge">Fecha: ${esc(t.fecha_limite)}</span>` : ""}
            </div>
        `).join("") || "<p>No se detectaron tareas.</p>";

    const r = data.reunion || {};

    document.getElementById("reunion").innerHTML = r.necesaria
        ? `
            <p><strong>${esc(r.titulo || "Reunión de seguimiento")}</strong></p>
            <p>Fecha: ${esc(r.fecha || "No especificada")}</p>
            <p>Hora: ${esc(r.hora || "No especificada")}</p>
            <p>Participantes: ${esc((r.participantes || []).join(", "))}</p>
          `
        : "<p>No se detectó una solicitud de reunión.</p>";

    document.getElementById("respuesta").value =
        data.respuesta_sugerida || "";
}

async function guardarProspecto() {
    if (!ultimoResultado) return;

    const c = ultimoResultado.cliente || {};

    await fetch("/api/prospectos", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            nombre: c.nombre,
            empresa: c.empresa,
            email: c.email,
            prioridad: ultimoResultado.prioridad,
            requisitos: ultimoResultado.requisitos
        })
    });

    alert("Prospecto registrado correctamente.");
    cargarDashboard();
}

async function guardarTareas() {
    if (!ultimoResultado) return;

    const empresa = ultimoResultado.cliente?.empresa || "";

    for (const tarea of ultimoResultado.tareas || []) {

        await fetch("/api/tareas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                empresa: empresa,
                titulo: tarea.titulo,
                descripcion: tarea.descripcion,
                prioridad: tarea.prioridad,
                fecha_limite: tarea.fecha_limite
            })
        });
    }

    alert("Tareas creadas correctamente.");

    cargarDashboard();
}

async function guardarReunion() {
    if (!ultimoResultado || !ultimoResultado.reunion?.necesaria) {
        alert("No hay una reunión detectada.");
        return;
    }

    const r = ultimoResultado.reunion;

    await fetch("/api/reuniones", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(r)
    });

    alert("Reunión registrada correctamente.");
    cargarDashboard();
}

async function cargarDashboard() {
    const r = await fetch("/api/dashboard");
    const data = await r.json();

    document.getElementById("count-prospectos").textContent = data.prospectos;
    document.getElementById("count-tareas").textContent = data.tareas;
    document.getElementById("count-reuniones").textContent = data.reuniones;
}

async function cargarProspectos() {
    const r = await fetch("/api/prospectos");
    const data = await r.json();

    document.getElementById("tabla-prospectos").innerHTML =
        data.length ? `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Empresa</th>
                    <th>Email</th>
                    <th>Prioridad</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(p => `
                    <tr>
                        <td>${esc(p.nombre)}</td>
                        <td>${esc(p.empresa)}</td>
                        <td>${esc(p.email)}</td>
                        <td>${esc(p.prioridad)}</td>
                        <td>${esc(p.creado_en)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>` : "<p>No hay prospectos registrados.</p>";
}

async function cargarTareas() {
    const r = await fetch("/api/tareas");
    const data = await r.json();

    document.getElementById("tabla-tareas").innerHTML =
        data.length ? `
        <table>
            <thead>
                <tr>
                    <th>Empresa</th>
                    <th>Tarea</th>
                    <th>Prioridad</th>
                    <th>Fecha límite</th>
                    <th>Estado</th>
                </tr>
            </thead>

            <tbody>

                ${data.map(t => `
                    <tr>

                        <td>
                            <strong>${esc(t.empresa || "Sin empresa")}</strong>
                        </td>

                        <td>
                            ${esc(t.titulo)}
                        </td>

                        <td>
                            <span class="badge">
                                ${esc(t.prioridad)}
                            </span>
                        </td>

                        <td>
                            ${esc(t.fecha_limite || "Sin fecha")}
                        </td>

                        <td>
                            ${esc(t.estado)}
                        </td>

                    </tr>
                `).join("")}

            </tbody>
        </table>`
        : "<p>No hay tareas registradas.</p>";
}

async function cargarReuniones() {
    const r = await fetch("/api/reuniones");
    const data = await r.json();

    document.getElementById("tabla-reuniones").innerHTML =
        data.length ? `
        <table>
            <thead>
                <tr>
                    <th>Reunión</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Participantes</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(x => `
                    <tr>
                        <td>${esc(x.titulo)}</td>
                        <td>${esc(x.fecha)}</td>
                        <td>${esc(x.hora)}</td>
                        <td>${esc(parseParticipantes(x.participantes))}</td>
                        <td>${esc(x.estado)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>` : "<p>No hay reuniones registradas.</p>";
}

function parseParticipantes(value) {
    try {
        return JSON.parse(value).join(", ");
    } catch {
        return value || "";
    }
}

function copiarRespuesta() {
    navigator.clipboard.writeText(
        document.getElementById("respuesta").value
    );
    alert("Respuesta copiada.");
}

function esc(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

cargarDashboard();
