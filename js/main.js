const API_URL = "https://68bb0de384055bce63f104a5.mockapi.io/api/v1/CasaInteligente";

const deviceImages = {
    'luces_prendido': 'assets/on/idea.gif',
    'luces_apagado': 'assets/off/luz-apagada.png',
    'cerraduras_prendido': 'assets/on/padlock.gif', 
    'cerraduras_apagado': 'assets/off/cerrar-con-llave.png',
    'sistema de riego_prendido': 'assets/on/sprinkler.gif', 
    'sistema de riego_apagado': 'assets/off/switch-off.png'
};

async function getDevices() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error al obtener dispositivos:", error);
        return [];
    }
}

// Función para añadir un nuevo dispositivo
async function addDevice(name, type, location) {
    const newDevice = { name, type, location, status: "apagado", last_update: new Date().toISOString() };
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDevice)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error al añadir dispositivo:", error);
        return null;
    }
}

// Función para actualizar el estado de un dispositivo (prendido/apagado)
async function updateDeviceStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, last_update: new Date().toISOString() })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        return null;
    }
}

// Función para actualizar los detalles de un dispositivo (nombre, tipo, ubicación)
async function updateDevice(id, name, type, location) {
    const updatedDevice = { name, type, location, last_update: new Date().toISOString() };
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedDevice)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error al actualizar dispositivo:", error);
        return null;
    }
}

// Función para eliminar un dispositivo
async function deleteDevice(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error al eliminar dispositivo:", error);
        return null;
    }
}


// --- FUNCIONES DE RENDERIZADO ---

// Función para renderizar una sola tarjeta de dispositivo
function renderDeviceCard(device) {
    const imageUrl = deviceImages[`${device.type}_${device.status}`];
    const buttonText = device.status === "prendido" ? "Apagar" : "Prender";
    const buttonClass = device.status === "prendido" ? "btn-danger" : "btn-success";
    const statusText = device.status === "prendido" ? "Prendido" : "Apagado";

    return `
        <div class="col">
            <div class="card h-100 shadow-sm device-card" data-id="${device.id}">
                <img src="${imageUrl}" class="card-img-top device-img mt-3" alt="Imagen ${device.name}">
                <div class="card-body text-center d-flex flex-column">
                    <h5 class="card-title">${device.name}</h5>
                    <p class="card-text mb-1"><small class="text-muted">Ubicación: ${device.location}</small></p>
                    <p class="card-text mb-2"><small class="text-muted">Estado: <span class="fw-bold">${statusText}</span></small></p>
                    <button class="btn ${buttonClass} btn-sm mb-2 btn-toggle-status" data-id="${device.id}" data-current-status="${device.status}">
                        ${buttonText}
                    </button>
                    <div class="mt-auto">
                        <button class="btn btn-secondary btn-sm me-2 btn-edit" data-id="${device.id}" data-name="${device.name}" data-type="${device.type}" data-location="${device.location}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-outline-danger btn-sm btn-delete" data-id="${device.id}">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderAllDevices() {
    const devices = await getDevices();

    const containers = {
        'luces': document.getElementById('lights-container'),
        'cerraduras': document.getElementById('locks-container'),
        'sistema de riego': document.getElementById('irrigation-container')
    };

    Object.values(containers).forEach(container => container.innerHTML = '');

    devices.forEach(device => {
        if (containers[device.type]) {
            containers[device.type].innerHTML += renderDeviceCard(device);
        }
    });
    
    addEventListenersToButtons();
}

async function renderRecentDevices() {
    const devices = await getDevices();
    const sortedDevices = devices.sort((a, b) => new Date(b.last_update) - new Date(a.last_update)).slice(0, 10);
    const tableBody = document.getElementById('recentDevicesTableBody');
    tableBody.innerHTML = '';

    sortedDevices.forEach(device => {
        tableBody.innerHTML += `
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


function addEventListenersToButtons() {
    document.querySelectorAll('.btn-toggle-status').forEach(button => {
        button.onclick = async (event) => {
            const id = event.currentTarget.dataset.id;
            const currentStatus = event.currentTarget.dataset.currentStatus;
            const newStatus = currentStatus === "prendido" ? "apagado" : "prendido";
            await updateDeviceStatus(id, newStatus);
            await refreshUI();
        };
    });

    document.querySelectorAll('.btn-delete').forEach(button => {
        button.onclick = async (event) => {
            const id = event.currentTarget.dataset.id;
            if (confirm("¿Estás seguro de que quieres eliminar este dispositivo?")) {
                await deleteDevice(id);
                await refreshUI();
            }
        };
    });

    document.querySelectorAll('.btn-edit').forEach(button => {
        button.onclick = (event) => {
            const editModalInstance = bootstrap.Modal.getInstance(document.getElementById('editDeviceModal'));
            const { id, name, type, location } = event.currentTarget.dataset;
            document.getElementById('editDeviceId').value = id;
            document.getElementById('editDeviceName').value = name;
            document.getElementById('editDeviceType').value = type;
            document.getElementById('editDeviceLocation').value = location;
            editModalInstance.show();
        };
    });
}

// --- INICIALIZACIÓN Y EVENT LISTENERS PRINCIPALES ---

// Función para refrescar toda la UI
async function refreshUI() {
    await renderAllDevices();
    await renderRecentDevices();
}

document.addEventListener('DOMContentLoaded', () => {
    setInterval(refreshUI, 2000);

    const editModalEl = document.getElementById('editDeviceModal');
    const editModalInstance = new bootstrap.Modal(editModalEl);

    document.getElementById('addDeviceForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const deviceName = document.getElementById('deviceName').value;
        const deviceType = document.getElementById('deviceType').value;
        const deviceLocation = document.getElementById('deviceLocation').value;
        const messageDiv = document.getElementById('addDeviceMessage');

        if (deviceName && deviceType && deviceLocation) {
            messageDiv.innerHTML = `<div class="alert alert-info" role="alert">Añadiendo...</div>`;
            const result = await addDevice(deviceName, deviceType, deviceLocation);
            if (result) {
                messageDiv.innerHTML = `<div class="alert alert-success" role="alert">Dispositivo añadido con éxito!</div>`;
                document.getElementById('addDeviceForm').reset();
                await refreshUI();
            } else {
                messageDiv.innerHTML = `<div class="alert alert-danger" role="alert">Error al añadir.</div>`;
            }
        } else {
            messageDiv.innerHTML = `<div class="alert alert-warning" role="alert">Complete todos los campos.</div>`;
        }
    });

    document.getElementById('editDeviceForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('editDeviceId').value;
        const name = document.getElementById('editDeviceName').value;
        const type = document.getElementById('editDeviceType').value;
        const location = document.getElementById('editDeviceLocation').value;
        
        await updateDevice(id, name, type, location);
        
        editModalInstance.hide();
        
        await refreshUI();
    });

    refreshUI();
});