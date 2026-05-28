// =====================
// STATE
// =====================
let transactions = JSON.parse(localStorage.getItem('xpns-transactions')) || [];
let currentType = 'income';
let currentFilter = 'all';

const categoryEmojis = {
    general: '📦',
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    bills: '💡',
    health: '💊',
    entertainment: '🎮',
    salary: '💼',
    freelance: '💻',
    investment: '📈'
};

// =====================
// DOM ELEMENTS
// =====================
const balanceEl = document.getElementById('balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const transactionList = document.getElementById('transaction-list');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const addBtn = document.getElementById('add-btn');
const errorMsg = document.getElementById('error-msg');
const clearBtn = document.getElementById('clear-btn');
const incomeBtn = document.getElementById('income-btn');
const expenseBtn = document.getElementById('expense-btn');

// =====================
// INIT
// =====================
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

// =====================
// SAVE
// =====================
function save() {
    localStorage.setItem('xpns-transactions', JSON.stringify(transactions));
}

// =====================
// CALCULATE TOTALS
// =====================
function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    balanceEl.textContent = formatCurrency(balance);
    balanceEl.className = 'balance-amount' + (balance > 0 ? ' positive' : balance < 0 ? ' negative' : '');
    totalIncomeEl.textContent = '+ ' + formatCurrency(income);
    totalExpenseEl.textContent = '- ' + formatCurrency(expense);
}

function formatCurrency(amount) {
    return '₹' + Math.abs(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// =====================
// RENDER LIST
// =====================
function renderTransactions() {
    let filtered = transactions;
    if (currentFilter !== 'all') {
        filtered = transactions.filter(t => t.type === currentFilter);
    }

    if (filtered.length === 0) {
        transactionList.innerHTML = `<li class="empty-state">${
            currentFilter === 'all'
                ? 'No transactions yet. Add one above!'
                : `No ${currentFilter} transactions found.`
        }</li>`;
        return;
    }

    // Sort by date descending, then by id
    filtered = [...filtered].sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.id - a.id;
    });

    transactionList.innerHTML = filtered.map(t => `
        <li class="transaction-item" data-id="${t.id}">
            <div class="t-icon ${t.type}">
                ${categoryEmojis[t.category] || '📦'}
            </div>
            <div class="t-info">
                <p class="t-desc">${escapeHtml(t.description)}</p>
                <p class="t-meta">${t.category} · ${formatDate(t.date)}</p>
            </div>
            <span class="t-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
            </span>
            <button class="t-delete" data-id="${t.id}" title="Delete">✕</button>
        </li>
    `).join('');
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// =====================
// ADD TRANSACTION
// =====================
function addTransaction() {
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    errorMsg.textContent = '';

    if (!description) {
        errorMsg.textContent = 'Please enter a description.';
        descriptionInput.focus();
        return;
    }
    if (!amount || amount <= 0) {
        errorMsg.textContent = 'Please enter a valid amount.';
        amountInput.focus();
        return;
    }
    if (!date) {
        errorMsg.textContent = 'Please select a date.';
        return;
    }

    const transaction = {
        id: Date.now(),
        description,
        amount,
        category,
        date,
        type: currentType
    };

    transactions.unshift(transaction);
    save();
    updateSummary();
    renderTransactions();

    // Reset form
    descriptionInput.value = '';
    amountInput.value = '';
    dateInput.value = today;
    descriptionInput.focus();
}

// =====================
// DELETE
// =====================
transactionList.addEventListener('click', (e) => {
    const btn = e.target.closest('.t-delete');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    transactions = transactions.filter(t => t.id !== id);
    save();
    updateSummary();
    renderTransactions();
});

// =====================
// TYPE TOGGLE
// =====================
incomeBtn.addEventListener('click', () => {
    currentType = 'income';
    incomeBtn.classList.add('active');
    expenseBtn.classList.remove('active');
});

expenseBtn.addEventListener('click', () => {
    currentType = 'expense';
    expenseBtn.classList.add('active');
    incomeBtn.classList.remove('active');
});

// =====================
// FILTER
// =====================
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTransactions();
    });
});

// =====================
// CLEAR ALL
// =====================
clearBtn.addEventListener('click', () => {
    if (transactions.length === 0) return;
    if (confirm('Clear all transactions? This cannot be undone.')) {
        transactions = [];
        save();
        updateSummary();
        renderTransactions();
    }
});

// =====================
// ADD BUTTON & ENTER KEY
// =====================
addBtn.addEventListener('click', addTransaction);

[descriptionInput, amountInput, categoryInput, dateInput].forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addTransaction();
    });
});

// =====================
// INITIAL RENDER
// =====================
updateSummary();
renderTransactions();
