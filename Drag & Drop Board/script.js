document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let tasks = [];
    let currentEditTaskId = null;

    // --- DOM Cache Elements ---
    const dropzones = {
        todo: document.getElementById('todo-dropzone'),
        progress: document.getElementById('progress-dropzone'),
        review: document.getElementById('review-dropzone'),
        done: document.getElementById('done-dropzone')
    };

    const counters = {
        todo: document.getElementById('count-todo'),
        progress: document.getElementById('count-progress'),
        review: document.getElementById('count-review'),
        done: document.getElementById('count-done')
    };

    // Header metrics
    const statsPercentage = document.getElementById('stats-percentage');
    const statsProgressFill = document.getElementById('stats-progress-fill');
    const statsActiveCount = document.getElementById('stats-active-count');
    const statsHighPriority = document.getElementById('stats-high-priority');

    // Controls
    const searchField = document.getElementById('board-search');
    const priorityFilter = document.getElementById('priority-filter');
    const addTaskBtn = document.getElementById('add-task-btn');

    // Modal elements
    const taskModal = document.getElementById('task-modal');
    const modalHeading = document.getElementById('modal-heading');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');

    const formFields = {
        title: document.getElementById('task-title-field'),
        desc: document.getElementById('task-desc-field'),
        priority: document.getElementById('task-priority-field'),
        column: document.getElementById('task-column-field'),
        date: document.getElementById('task-date-field')
    };

    const toastContainer = document.getElementById('toast-container');

    // --- Mock Sample Tasks (Hydrates blank dashboards beautifully) ---
    const sampleTasks = [
        {
            id: 't-1',
            title: 'Refine high-contrast dark system',
            desc: 'Research Stripe/Linear layouts. Apply deep carbon backgrounds, crisp off-white labels, and minimal desaturated priority indicators.',
            column: 'done',
            priority: 'high',
            dueDate: getRelativeDateString(0)
        },
        {
            id: 't-2',
            title: 'Configure Kanban drag handles',
            desc: 'Establish active card listeners, handle state array splicing, and construct CSS active scale states.',
            column: 'progress',
            priority: 'medium',
            dueDate: getRelativeDateString(1)
        },
        {
            id: 't-3',
            title: 'Write project verification logs',
            desc: 'Test responsive viewports across grid columns, check LocalStorage, and formulate git commands.',
            column: 'review',
            priority: 'high',
            dueDate: getRelativeDateString(0)
        },
        {
            id: 't-4',
            title: 'Setup next application structure',
            desc: 'Map out the Expense Tracker requirements. Prepare outline files for visual SVG graph trackers.',
            column: 'todo',
            priority: 'low',
            dueDate: getRelativeDateString(4)
        }
    ];

    // Helper: Date string generator
    function getRelativeDateString(offsetDays) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
    }

    // --- Board State Synchronizers ---
    function loadState() {
        const stored = localStorage.getItem('chromaforge_kanban_tasks');
        if (stored) {
            try {
                tasks = JSON.parse(stored);
            } catch (e) {
                tasks = [...sampleTasks];
            }
        } else {
            tasks = [...sampleTasks];
            saveState();
        }
        renderBoard();
    }

    function saveState() {
        localStorage.setItem('chromaforge_kanban_tasks', JSON.stringify(tasks));
        recalculateStats();
    }

    // --- Render Core Workspace ---
    function renderBoard() {
        const searchQuery = searchField.value.toLowerCase().trim();
        const selectedPriority = priorityFilter.value;

        // Clear dropzone layouts
        Object.keys(dropzones).forEach(col => {
            dropzones[col].innerHTML = '';
        });

        // Track counters
        const activeCounters = { todo: 0, progress: 0, review: 0, done: 0 };

        // Filter and Hydrate cards
        tasks.forEach(task => {
            // Apply queries
            const matchSearch = task.title.toLowerCase().includes(searchQuery) || 
                                task.desc.toLowerCase().includes(searchQuery);
            const matchPriority = selectedPriority === 'all' || task.priority === selectedPriority;

            if (matchSearch && matchPriority) {
                activeCounters[task.column]++;
                const cardEl = createTaskCardEl(task);
                dropzones[task.column].appendChild(cardEl);
            }
        });

        // Set column counter tags
        Object.keys(counters).forEach(col => {
            counters[col].innerText = activeCounters[col];
            
            // Add custom empty indicators
            if (activeCounters[col] === 0) {
                dropzones[col].innerHTML = `
                    <div class="empty-column-hint">
                        No tasks in this stage
                    </div>
                `;
            }
        });

        recalculateStats();
    }

    // Element generator for cards
    function createTaskCardEl(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('draggable', 'true');
        card.dataset.id = task.id;

        // Overdue status check
        let isOverdue = false;
        let formattedDate = 'No due date';
        if (task.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(task.dueDate + 'T00:00:00');
            isOverdue = due < today && task.column !== 'done';
            
            // Simple human-readable date
            const options = { month: 'short', day: 'numeric' };
            formattedDate = due.toLocaleDateString('en-US', options);
        }

        card.innerHTML = `
            <div class="card-header-row">
                <span class="priority-tag tag-${task.priority}">${task.priority}</span>
                <button class="card-options-btn" title="Edit task details">•••</button>
            </div>
            <h3 class="task-card-title">${escapeHTML(task.title)}</h3>
            <p class="task-card-desc">${escapeHTML(task.desc || 'No description provided.')}</p>
            <div class="card-footer-row">
                <div class="task-deadline-badge ${isOverdue ? 'overdue' : ''}">
                    <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>${formattedDate}${isOverdue ? ' (Overdue)' : ''}</span>
                </div>
                <button class="card-edit-action-btn">Edit</button>
            </div>
        `;

        // Event hooks
        const editTriggerBtn = card.querySelector('.card-edit-action-btn');
        const optionsBtn = card.querySelector('.card-options-btn');

        const editHandler = (e) => {
            e.stopPropagation();
            openEditorModal(task.id);
        };

        editTriggerBtn.addEventListener('click', editHandler);
        optionsBtn.addEventListener('click', editHandler);
        card.addEventListener('dblclick', editHandler);

        // Drag handlers
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        return card;
    }

    // --- Metrics Recalculations ---
    function recalculateStats() {
        const total = tasks.length;
        const done = tasks.filter(t => t.column === 'done').length;
        const high = tasks.filter(t => t.priority === 'high' && t.column !== 'done').length;
        const active = tasks.filter(t => t.column !== 'done').length;

        // Progress percentage
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        statsPercentage.innerText = `${percent}%`;
        statsProgressFill.style.width = `${percent}%`;
        
        // Active counters
        statsActiveCount.innerText = active;
        statsHighPriority.innerText = high;
    }

    // --- Modal Editor Drawer Actions ---
    function openEditorModal(taskId = null) {
        currentEditTaskId = taskId;

        if (taskId) {
            // Hydrate Edit mode
            modalHeading.innerText = 'Edit Task Details';
            modalDeleteBtn.style.display = 'block';
            
            const task = tasks.find(t => t.id === taskId);
            formFields.title.value = task.title;
            formFields.desc.value = task.desc;
            formFields.priority.value = task.priority;
            formFields.column.value = task.column;
            formFields.date.value = task.dueDate || '';
        } else {
            // Hydrate Create mode
            modalHeading.innerText = 'Create New Task';
            modalDeleteBtn.style.display = 'none';
            
            formFields.title.value = '';
            formFields.desc.value = '';
            formFields.priority.value = 'medium';
            formFields.column.value = 'todo';
            formFields.date.value = new Date().toISOString().split('T')[0]; // Default to today
        }

        taskModal.classList.add('active');
        formFields.title.focus();
    }

    function closeEditorModal() {
        taskModal.classList.remove('active');
        currentEditTaskId = null;
    }

    function saveTaskFromModal() {
        const titleVal = formFields.title.value.trim();
        const descVal = formFields.desc.value.trim();
        const prioVal = formFields.priority.value;
        const colVal = formFields.column.value;
        const dateVal = formFields.date.value;

        if (!titleVal) {
            showToast('⚠️ Task title is required', 'warning');
            return;
        }

        if (currentEditTaskId) {
            // Update exist state
            tasks = tasks.map(t => {
                if (t.id === currentEditTaskId) {
                    return {
                        ...t,
                        title: titleVal,
                        desc: descVal,
                        priority: prioVal,
                        column: colVal,
                        dueDate: dateVal
                    };
                }
                return t;
            });
            showToast('💾 Task details updated');
        } else {
            // Append new task
            const newTask = {
                id: 't-' + Date.now(),
                title: titleVal,
                desc: descVal,
                priority: prioVal,
                column: colVal,
                dueDate: dateVal
            };
            tasks.push(newTask);
            showToast('➕ Created task successfully');
        }

        saveState();
        renderBoard();
        closeEditorModal();
    }

    function deleteTaskFromModal() {
        if (!currentEditTaskId) return;
        tasks = tasks.filter(t => t.id !== currentEditTaskId);
        saveState();
        renderBoard();
        closeEditorModal();
        showToast('🗑️ Deleted task card');
    }

    // --- Quick Add Column triggers ---
    document.querySelectorAll('.column-panel').forEach(panel => {
        const column = panel.dataset.column;
        const quickAddTrigger = panel.querySelector('.quick-add-trigger');
        const quickForm = panel.querySelector('.quick-add-form');
        const input = panel.querySelector('.quick-add-input');
        const cancelBtn = panel.querySelector('.quick-add-cancel-btn');
        const saveBtn = panel.querySelector('.quick-add-save-btn');

        if (!quickAddTrigger) return;

        quickAddTrigger.addEventListener('click', () => {
            quickAddTrigger.style.display = 'none';
            quickForm.style.display = 'flex';
            input.focus();
        });

        const cancelForm = () => {
            quickForm.style.display = 'none';
            quickAddTrigger.style.display = 'flex';
            input.value = '';
        };

        cancelBtn.addEventListener('click', cancelForm);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') cancelForm();
            if (e.key === 'Enter') saveQuick();
        });

        const saveQuick = () => {
            const titleVal = input.value.trim();
            if (!titleVal) {
                showToast('⚠️ Task title cannot be empty', 'warning');
                return;
            }

            const newTask = {
                id: 't-' + Date.now(),
                title: titleVal,
                desc: '',
                priority: 'medium',
                column: column,
                dueDate: new Date().toISOString().split('T')[0]
            };
            tasks.push(newTask);
            saveState();
            renderBoard();
            cancelForm();
            showToast('➕ Added task');
        };

        saveBtn.addEventListener('click', saveQuick);
    });

    // --- HTML5 Dropzone bindings ---
    document.querySelectorAll('.column-panel').forEach(panel => {
        const column = panel.dataset.column;

        panel.addEventListener('dragover', (e) => {
            e.preventDefault();
            panel.classList.add('drag-over');
        });

        panel.addEventListener('dragenter', (e) => {
            e.preventDefault();
            panel.classList.add('drag-over');
        });

        panel.addEventListener('dragleave', () => {
            panel.classList.remove('drag-over');
        });

        panel.addEventListener('drop', (e) => {
            e.preventDefault();
            panel.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            
            // Mutate column state
            tasks = tasks.map(t => {
                if (t.id === taskId) {
                    if (t.column !== column) {
                        showToast(`🚚 Moved card to: ${column.toUpperCase()}`);
                    }
                    return { ...t, column: column };
                }
                return t;
            });
            saveState();
            renderBoard();
        });
    });

    // --- Toast Notification systems ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 2200);
    }

    // --- Setup Main event listeners ---
    addTaskBtn.addEventListener('click', () => openEditorModal());
    modalCloseBtn.addEventListener('click', closeEditorModal);
    
    // Close modal on click background
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeEditorModal();
    });

    modalSaveBtn.addEventListener('click', saveTaskFromModal);
    modalDeleteBtn.addEventListener('click', deleteTaskFromModal);

    // Live search and dropdown filters
    searchField.addEventListener('input', () => renderBoard());
    priorityFilter.addEventListener('change', () => renderBoard());

    // HTML escapers
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // --- Initialize board ---
    loadState();
});
