
let config;
let editingId = null;

const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const descriptionInput = document.getElementById("task-description");
const taskList = document.getElementById("task-list");
const message = document.getElementById("status-message");
const submitButton = document.getElementById("task-submit");

async function api(method, path = "", data = null) {
    const response = await fetch(config.supabaseUrl + "/rest/v1/" + config.tableName + path, {
        method: method,
        headers: {
            "apikey": config.supabasePublishableKey,
            "Content-Type": "application/json"
        },
        body: data ? JSON.stringify(data) : null
    });

    if (!response.ok) {
        throw new Error("Request failed: " + response.status);
    }

    if (method === "GET") {
        return await response.json();
    }
}

async function loadTasks() {
    try {
        const tasks = await api("GET", "?select=*&order=id.asc");
        taskList.innerHTML = "";

        for (const task of tasks) {
            const item = document.createElement("div");
            item.className = "task-item";
            item.dataset.id = task.id;

            item.innerHTML = `
                <h3 class="task-title"></h3>
                <p class="task-description"></p>
                <p class="task-status"></p>
                <button class="edit-task">Edit</button>
                <button class="delete-task">Delete</button>
                <button class="toggle-task">Complete / Undo</button>
            `;

            item.querySelector(".task-title").textContent = task.title;
            item.querySelector(".task-description").textContent = task.description || "";
            item.querySelector(".task-status").textContent = task.completed ? "Completed" : "Incomplete";

            item.querySelector(".edit-task").onclick = () => editTask(task.id);
            item.querySelector(".delete-task").onclick = () => changeTask(task.id, "DELETE");
            item.querySelector(".toggle-task").onclick = () => changeTask(task.id, "PATCH", {completed: !task.completed});

            taskList.appendChild(item);
        }

        message.textContent = "";
    } catch (error) {
        message.textContent = error.message;
    }
}

async function editTask(id) {
    try {
        const tasks = await api("GET", "?id=eq." + id + "&select=*");
        const task = tasks[0];

        if (!task) {
            throw new Error("Task not found");
        }

        editingId = id;
        titleInput.value = task.title;
        descriptionInput.value = task.description || "";
        submitButton.textContent = "Save Task";
    } catch (error) {
        message.textContent = error.message;
    }
}

async function changeTask(id, method, data = null) {
    try {
        await api(method, "?id=eq." + id, data);
        await loadTasks();
    } catch (error) {
        message.textContent = error.message;
    }
}

form.onsubmit = async function(event) {
    event.preventDefault();

    const task = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim()
    };

    if (!task.title) {
        message.textContent = "Enter a task title";
        return;
    }

    try {
        if (editingId === null) {
            await api("POST", "", task);
        } else {
            await api("PATCH", "?id=eq." + editingId, task);
        }

        form.reset();
        editingId = null;
        submitButton.textContent = "Add Task";
        await loadTasks();
    } catch (error) {
        message.textContent = error.message;
    }
};

async function start() {
    try {
        const response = await fetch("config.json");

        if (!response.ok) {
            throw new Error("Configuration not found");
        }

        config = await response.json();
        await loadTasks();
    } catch (error) {
        message.textContent = error.message;
    }
}

start();
