// =====================
// RECIPE FINDER
// Uses TheMealDB free API (no key needed)
// =====================

const MEALDB = 'https://www.themealdb.com/api/json/v1/1';

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorText = document.getElementById('error-text');
const resultsSection = document.getElementById('results-section');
const resultsGrid = document.getElementById('results-grid');
const resultsCount = document.getElementById('results-count');

const modalBackdrop = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');
const modalContent = document.getElementById('modal-content');

// =====================
// SEARCH BY NAME
// =====================
async function searchRecipes(query) {
    showLoading();
    try {
        const res = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!data.meals) {
            showError(`No recipes found for "${query}". Try something else!`);
            return;
        }

        renderResults(data.meals);
    } catch (err) {
        showError('Network error. Please check your connection.');
    }
}

// =====================
// SEARCH BY CATEGORY
// =====================
async function searchByCategory(category) {
    if (!category) {
        searchRecipes('');
        return;
    }

    showLoading();
    try {
        const res = await fetch(`${MEALDB}/filter.php?c=${encodeURIComponent(category)}`);
        const data = await res.json();

        if (!data.meals) {
            showError(`No recipes found in "${category}".`);
            return;
        }

        // Category filter returns minimal data — enrich top 12 with full details
        const top = data.meals.slice(0, 12);
        const full = await Promise.all(
            top.map(m => fetch(`${MEALDB}/lookup.php?i=${m.idMeal}`)
                .then(r => r.json())
                .then(d => d.meals?.[0])
                .catch(() => null)
            )
        );

        renderResults(full.filter(Boolean));
    } catch (err) {
        showError('Network error. Please check your connection.');
    }
}

// =====================
// RENDER RESULTS
// =====================
function renderResults(meals) {
    if (!meals || meals.length === 0) {
        showError('No recipes found. Try a different search.');
        return;
    }

    resultsCount.textContent = `${meals.length} recipe${meals.length === 1 ? '' : 's'} found`;
    resultsGrid.innerHTML = meals.map(meal => `
        <div class="recipe-card" data-id="${meal.idMeal}">
            <img
                class="recipe-img"
                src="${meal.strMealThumb}"
                alt="${escapeHtml(meal.strMeal)}"
                loading="lazy"
            >
            <div class="recipe-body">
                <h3 class="recipe-title">${escapeHtml(meal.strMeal)}</h3>
                <div class="recipe-tags">
                    ${meal.strCategory ? `<span class="tag tag-category">${escapeHtml(meal.strCategory)}</span>` : ''}
                    ${meal.strArea ? `<span class="tag tag-area">${escapeHtml(meal.strArea)}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Store meal data for modal lookup
    window._meals = {};
    meals.forEach(m => { window._meals[m.idMeal] = m; });

    hideAll();
    resultsSection.classList.remove('hidden');
}

// =====================
// MODAL
// =====================
resultsGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.recipe-card');
    if (!card) return;

    const id = card.dataset.id;
    let meal = window._meals?.[id];

    // If meal data is incomplete (missing instructions), fetch full details
    if (!meal || !meal.strInstructions) {
        showLoading();
        try {
            const res = await fetch(`${MEALDB}/lookup.php?i=${id}`);
            const data = await res.json();
            meal = data.meals?.[0];
            hideAll();
            resultsSection.classList.remove('hidden');
        } catch (err) {
            return;
        }
    }

    if (!meal) return;
    openModal(meal);
});

function openModal(meal) {
    // Build ingredients list
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingr = meal[`strIngredient${i}`];
        const meas = meal[`strMeasure${i}`];
        if (ingr && ingr.trim()) {
            ingredients.push(`${meas ? meas.trim() + ' ' : ''}${ingr.trim()}`);
        }
    }

    const instructions = (meal.strInstructions || '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    modalContent.innerHTML = `
        <img
            class="modal-hero"
            src="${meal.strMealThumb}"
            alt="${escapeHtml(meal.strMeal)}"
        >
        <div class="modal-body">
            <h2 class="modal-title">${escapeHtml(meal.strMeal)}</h2>
            <div class="modal-tags">
                ${meal.strCategory ? `<span class="tag tag-category">${escapeHtml(meal.strCategory)}</span>` : ''}
                ${meal.strArea ? `<span class="tag tag-area">🌍 ${escapeHtml(meal.strArea)}</span>` : ''}
                ${meal.strTags ? meal.strTags.split(',').map(t => t.trim()).filter(Boolean)
                    .map(t => `<span class="tag" style="background:#f3f3f0;color:#666">${escapeHtml(t)}</span>`).join('') : ''}
            </div>

            <div class="modal-meta">
                <div class="modal-meta-item">
                    <span class="meta-val">${ingredients.length}</span>
                    <span class="meta-key">Ingredients</span>
                </div>
                ${meal.strArea ? `<div class="modal-meta-item">
                    <span class="meta-val">${escapeHtml(meal.strArea)}</span>
                    <span class="meta-key">Cuisine</span>
                </div>` : ''}
                ${meal.strCategory ? `<div class="modal-meta-item">
                    <span class="meta-val">${escapeHtml(meal.strCategory)}</span>
                    <span class="meta-key">Category</span>
                </div>` : ''}
            </div>

            <h3 class="modal-section-title">Ingredients</h3>
            <ul class="ingredients-list">
                ${ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
            </ul>

            ${instructions ? `
                <h3 class="modal-section-title">Instructions</h3>
                <p class="instructions-text">${escapeHtml(instructions)}</p>
            ` : ''}

            ${meal.strYoutube ? `
                <a href="${meal.strYoutube}" target="_blank" rel="noopener" class="youtube-link">
                    ▶ Watch on YouTube
                </a>
            ` : ''}
        </div>
    `;

    modalBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// =====================
// CATEGORIES
// =====================
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        searchInput.value = '';
        searchByCategory(btn.dataset.cat);
    });
});

// =====================
// SEARCH EVENTS
// =====================
searchBtn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.cat-btn[data-cat=""]').classList.add('active');
    searchRecipes(searchInput.value.trim());
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.cat-btn[data-cat=""]').classList.add('active');
        searchRecipes(searchInput.value.trim());
    }
});

// =====================
// STATE HELPERS
// =====================
function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    resultsSection.classList.add('hidden');
}

function showError(msg) {
    loadingState.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorText.textContent = msg;
    errorState.classList.remove('hidden');
}

function hideAll() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
}

// =====================
// HELPERS
// =====================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// =====================
// LOAD DEFAULT ON START
// =====================
searchByCategory('Chicken');
