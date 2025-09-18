const API_URL = "https://68bb0de384055bce63f104a5.mockapi.io/api/v1/CasaInteligente";

// Diccionario de imágenes para los dispositivos (encendido/apagado)
const deviceImages = {
    'luces_prendido': 'assets/on/idea.gif',
    'luces_apagado': 'assets/off/luz-apagada.png',
    'cerraduras_prendido': 'assets/on/padlock.gif', // Candado abierto
    'cerraduras_apagado': 'assets/off/cerrar-con-llave.png', // Candado cerrado
    'sistema de riego_prendido': 'assets/on/sprinkler.gif', // Aspersor activo
    'sistema de riego_apagado': 'assets/off/switch-off.png'  // Aspersor inactivo
};

// Función para obtener todos los dispositivos de la API
async function getDevices() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const devices = await response.json();
        return devices;
    } catch (error) {
        console.error("Error al obtener dispositivos:", error);
        return [];
    }
}

// Función para añadir un nuevo dispositivo
async function addDevice(name, type, location) {
    const newDevice = {
        name: name,
        type: type,
        status: "apagado", // Inicialmente apagado
        last_update: new Date().toISOString(),
        location: location
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newDevice)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error al añadir dispositivo:", error);
        return null;
    }
}

// Función para actualizar el estado de un dispositivo
async function updateDeviceStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT', // O PATCH, dependiendo de cómo MockAPI maneje las actualizaciones parciales. PUT para reemplazar el recurso completo.
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus, last_update: new Date().toISOString() })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error al actualizar estado del dispositivo:", error);
        return null;
    }
}

// Función para renderizar un solo dispositivo en la interfaz
function renderDeviceCard(device) {
    const imageUrl = deviceImages[`${device.type}_${device.status}`];
    const buttonText = device.status === "prendido" ? "Apagar" : "Prender";
    const buttonClass = device.status === "prendido" ? "btn-danger" : "btn-success";
    const statusText = device.status === "prendido" ? "Prendido" : "Apagado";

    return `
        <div class="col">
            <div class="card h-100 shadow-sm device-card" data-id="${device.id}" data-type="${device.type}">
                <img src="${imageUrl}" class="card-img-top device-img mt-3" alt="Imagen ${device.name} ${statusText}">
                <div class="card-body text-center">
                    <h5 class="card-title">${device.name}</h5>
                    <p class="card-text mb-1"><small class="text-muted">Ubicación: ${device.location}</small></p>
                    <p class="card-text mb-2"><small class="text-muted">Estado: <span class="fw-bold">${statusText}</span></small></p>
                    <p class="card-text mb-3"><small class="text-muted">Última Actualización: ${new Date(device.last_update).toLocaleString()}</small></p>
                    <button class="btn ${buttonClass} btn-toggle-status" data-id="${device.id}" data-current-status="${device.status}">
                        ${buttonText}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Función para renderizar todos los dispositivos en sus respectivas secciones
async function renderAllDevices() {
    const devices = await getDevices();

    const lightsContainer = document.getElementById('lights-container');
    const locksContainer = document.getElementById('locks-container');
    const irrigationContainer = document.getElementById('irrigation-container');

    lightsContainer.innerHTML = '';
    locksContainer.innerHTML = '';
    irrigationContainer.innerHTML = '';

    devices.forEach(device => {
        if (device.type === 'luces') {
            lightsContainer.innerHTML += renderDeviceCard(device);
        } else if (device.type === 'cerraduras') {
            locksContainer.innerHTML += renderDeviceCard(device);
        } else if (device.type === 'sistema de riego') {
            irrigationContainer.innerHTML += renderDeviceCard(device);
        }
    });

    // Añadir event listeners a los botones de toggle
    document.querySelectorAll('.btn-toggle-status').forEach(button => {
        button.onclick = async (event) => {
            const id = event.target.dataset.id;
            const currentStatus = event.target.dataset.currentStatus;
            const newStatus = currentStatus === "prendido" ? "apagado" : "prendido";
            await updateDeviceStatus(id, newStatus);
            renderAllDevices(); // Volver a renderizar para actualizar la UI
            renderRecentDevices(); // Actualizar también la tabla de recientes
        };
    });
}

// Función para renderizar los últimos 10 dispositivos en la tabla
async function renderRecentDevices() {
    console.log("Refrescando");
    const devices = await getDevices();
    // Ordenar por last_update descendente y tomar los últimos 10
    const sortedDevices = devices.sort((a, b) => new Date(b.last_update) - new Date(a.last_update)).slice(0, 10);
    
    const recentDevicesTableBody = document.getElementById('recentDevicesTableBody');
    recentDevicesTableBody.innerHTML = '';

    sortedDevices.forEach(device => {
        recentDevicesTableBody.innerHTML += `
            <tr>
                <td>${device.name}</td>
                <td>${device.type}</td>
                <td><span class="badge ${device.status === 'prendido' ? 'bg-success' : 'bg-secondary'}">${device.status}</span></td>
                <td>${device.location}</td>
                <td>${new Date(device.last_update).toLocaleString()}</td>
            </tr>
        `;
    });
}

// Event listener para el formulario de añadir dispositivo
document.getElementById('addDeviceForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Evitar el envío por defecto del formulario

    const deviceName = document.getElementById('deviceName').value;
    const deviceType = document.getElementById('deviceType').value;
    const deviceLocation = document.getElementById('deviceLocation').value;
    const addDeviceMessage = document.getElementById('addDeviceMessage');

    if (deviceName && deviceType && deviceLocation) {
        addDeviceMessage.innerHTML = `<div class="alert alert-info" role="alert">Añadiendo dispositivo...</div>`;
        const result = await addDevice(deviceName, deviceType, deviceLocation);
        if (result) {
            addDeviceMessage.innerHTML = `<div class="alert alert-success" role="alert">Dispositivo "${deviceName}" añadido con éxito!</div>`;
            document.getElementById('addDeviceForm').reset(); // Limpiar formulario
            renderAllDevices(); // Actualizar las secciones de control
            renderRecentDevices(); // Actualizar la tabla de recientes
        } else {
            addDeviceMessage.innerHTML = `<div class="alert alert-danger" role="alert">Error al añadir el dispositivo.</div>`;
        }
    } else {
        addDeviceMessage.innerHTML = `<div class="alert alert-warning" role="alert">Por favor, complete todos los campos.</div>`;
    }
});

// Inicialización: Cargar dispositivos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    renderAllDevices();
    renderRecentDevices();

    // Polling para actualizar la tabla de recientes cada 2 segundos
    setInterval(renderRecentDevices, 2000);
    // Opcional: Polling para actualizar todos los estados de los dispositivos si quieres un dashboard dinámico constante.
    // setInterval(renderAllDevices, 5000); // Por ejemplo, cada 5 segundos para no sobrecargar
});