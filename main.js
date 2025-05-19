let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editingIndex = -1;
let currentDate = new Date();
let selectedDate = null;

document.addEventListener('DOMContentLoaded', init);

function init() {
    updateDateDisplay();
    generateCalendar(currentDate);
    renderTasks();
    setupEventListeners();
}

function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    dateElement.textContent = currentDate.toLocaleDateString('ru-RU', {
        month: 'long',
        day: 'numeric'
    });
}

function generateCalendar(date) {
    const calendarTable = document.getElementById('calendar-table');
    const monthYearElement = document.getElementById('current-month');

    monthYearElement.textContent = date.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric'
    }).replace(' г.', '');

    calendarTable.innerHTML = `
        <tr>
            <th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th>Сб</th><th>Вс</th>
        </tr>
    `;

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    let dayCounter = 1;
    let row = document.createElement('tr');

    for (let i = 0; i < (firstDay.getDay() || 7) - 1; i++) {
        row.appendChild(document.createElement('td'));
    }

    while (dayCounter <= lastDay.getDate()) {
        const cell = document.createElement('td');
        const cellDate = new Date(date.getFullYear(), date.getMonth(), dayCounter);

        cell.textContent = dayCounter;
        cell.dataset.date = cellDate.toISOString();
        cell.onclick = () => selectDate(cellDate);

        if (isSameDay(cellDate, new Date())) {
            cell.classList.add('current-day');
        }

        if (selectedDate && isSameDay(cellDate, selectedDate)) {
            cell.classList.add('selected-day');
        }
        if (hasTasksForDate(cellDate)) {
            cell.classList.add('has-tasks');
        }

        row.appendChild(cell);

        if (row.children.length === 7) {
            calendarTable.appendChild(row);
            row = document.createElement('tr');
        }

        dayCounter++;
    }

    if (row.children.length > 0) {
        calendarTable.appendChild(row);
    }
}

function addTask() {
    const taskInput = document.getElementById('task-text');
    const text = taskInput.value.trim();

    if (text) {
        const dateToUse = selectedDate ? new Date(selectedDate) : new Date();

        tasks.push({
            text: text,
            completed: false,
            time: null,
            date: dateToUse.toISOString(),
            notes: ''
        });

        taskInput.value = '';
        saveToLocalStorage();
        renderTasks();
        generateCalendar(currentDate);
    }
}

function editTask(index) {
    editingIndex = index;
    const task = tasks[index];
    const [title, ...descriptionParts] = task.text.split('\n');
    const taskDate = new Date(task.date);

    document.getElementById('edit-title').value = title;
    document.getElementById('edit-description').value = descriptionParts.join('\n');
    document.getElementById('edit-date').value = formatDateLocal(taskDate);
    document.getElementById('edit-time').value = task.time || '';
    showModal();
}

function saveChanges() {
    if (editingIndex > -1) {
        const title = document.getElementById('edit-title').value.trim();
        const description = document.getElementById('edit-description').value.trim();
        const newDate = document.getElementById('edit-date').value;
        const newTime = document.getElementById('edit-time').value;

        let finalDate = tasks[editingIndex].date;
        if (newDate) {
            const parts = newDate.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            finalDate = new Date(year, month, day).toISOString();
        }

        tasks[editingIndex].text = title + (description ? '\n' + description : '');
        tasks[editingIndex].time = newTime;
        tasks[editingIndex].date = finalDate;

        saveToLocalStorage();
        renderTasks();
        generateCalendar(currentDate);
        closeModal();
    }
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    const completedList = document.getElementById('completed-list');
    taskList.innerHTML = '';
    completedList.innerHTML = '';

    const targetDate = selectedDate || currentDate;

    tasks.forEach((task, index) => {
        if (!isSameDay(new Date(task.date), targetDate)) return;

        const title = task.text.split('\n')[0];
        const list = task.completed ? completedList : taskList;

        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" 
                   ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${index})">
            <div class="task-content">
                ${task.date ? `<span class="task-date">${new Date(task.date).toLocaleDateString('ru-RU')}</span>` : ''}
                ${task.time ? `<span class="task-time">${task.time}</span>` : ''}
                <span class="task-title">${title}</span>
            </div>
            <div class="task-actions">
                <button class="edit-btn" onclick="editTask(${index})">✏️</button>
                <button class="delete-btn" onclick="deleteTask(${index})">🗑️</button>
            </div>
        `;

        list.appendChild(li);
    });
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

function hasTasksForDate(date) {
    return tasks.some(task =>
        isSameDay(new Date(task.date), date) && !task.completed
    );
}

function selectDate(date) {
    selectedDate = date;
    currentDate = new Date(date);
    updateDateDisplay();
    renderTasks();
    generateCalendar(date);
}

function changeMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    generateCalendar(currentDate);
}

function setCurrentDateTime() {
    const now = new Date();
    document.getElementById('edit-date').value = formatDateLocal(now);
    document.getElementById('edit-time').value = now.toTimeString().slice(0, 5);
}

function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function showModal() {
    document.getElementById('modal-backdrop').style.display = 'block';
    document.getElementById('edit-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal-backdrop').style.display = 'none';
    document.getElementById('edit-modal').style.display = 'none';
    editingIndex = -1;
}

function deleteTask(index) {
    if (confirm('Удалить задачу?')) {
        tasks.splice(index, 1);
        saveToLocalStorage();
        renderTasks();
        generateCalendar(currentDate);
    }
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    tasks[index].completedDate = tasks[index].completed ? new Date().toISOString() : null;
    saveToLocalStorage();
    renderTasks();
    generateCalendar(currentDate);
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function setupEventListeners() {
    document.getElementById('modal-backdrop').addEventListener('click', closeModal);
    document.getElementById('task-text').addEventListener('keypress', e => {
        if (e.key === 'Enter') addTask();
    });
}
