// =====================
// GITHUB FINDER
// =====================

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

const profileCard = document.getElementById('profile-card');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorText = document.getElementById('error-text');

// Language colors (subset)
const langColors = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Ruby: '#701516',
    Go: '#00ADD8',
    Rust: '#dea584',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Shell: '#89e051',
    Vue: '#41b883',
    Svelte: '#ff3e00',
};

// =====================
// SEARCH
// =====================
async function searchUser() {
    const username = searchInput.value.trim();
    if (!username) {
        searchInput.focus();
        return;
    }

    showLoading();

    try {
        const [userRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`)
        ]);

        if (userRes.status === 404) {
            showError(`User "${username}" not found on GitHub.`);
            return;
        }
        if (userRes.status === 403) {
            showError('GitHub API rate limit reached. Try again later.');
            return;
        }
        if (!userRes.ok) {
            showError('Failed to fetch user. Please try again.');
            return;
        }

        const user = await userRes.json();
        const repos = reposRes.ok ? await reposRes.json() : [];

        renderProfile(user, repos);
    } catch (err) {
        showError('Network error. Please check your connection.');
    }
}

// =====================
// RENDER
// =====================
function renderProfile(user, repos) {
    // Avatar & names
    document.getElementById('avatar').src = user.avatar_url;
    document.getElementById('name').textContent = user.name || user.login;

    const usernameLink = document.getElementById('username-link');
    usernameLink.textContent = '@' + user.login;
    usernameLink.href = user.html_url;

    // Bio
    const bioEl = document.getElementById('bio');
    if (user.bio) {
        bioEl.textContent = user.bio;
        bioEl.classList.remove('hidden');
    } else {
        bioEl.classList.add('hidden');
    }

    // Meta items
    toggleMeta('location-wrap', 'location', user.location);
    if (user.blog) {
        const blogWrap = document.getElementById('blog-wrap');
        const blogLink = document.getElementById('blog-link');
        const url = user.blog.startsWith('http') ? user.blog : 'https://' + user.blog;
        blogLink.href = url;
        blogLink.textContent = user.blog;
        blogWrap.classList.remove('hidden');
    } else {
        document.getElementById('blog-wrap').classList.add('hidden');
    }
    toggleMeta('company-wrap', 'company', user.company);

    // Stats
    document.getElementById('repos').textContent = formatNumber(user.public_repos);
    document.getElementById('followers').textContent = formatNumber(user.followers);
    document.getElementById('following').textContent = formatNumber(user.following);
    document.getElementById('gists').textContent = formatNumber(user.public_gists);

    // Joined date
    const joined = new Date(user.created_at);
    document.getElementById('joined').textContent = 'Joined ' + joined.toLocaleDateString('en-US', {
        month: 'short', year: 'numeric'
    });

    // Repos
    renderRepos(repos);

    showProfile();
}

function toggleMeta(wrapId, fieldId, value) {
    const wrap = document.getElementById(wrapId);
    if (value) {
        document.getElementById(fieldId).textContent = value;
        wrap.classList.remove('hidden');
    } else {
        wrap.classList.add('hidden');
    }
}

function renderRepos(repos) {
    const grid = document.getElementById('repos-grid');

    if (!repos.length) {
        grid.innerHTML = '<p style="font-size:0.8rem;color:#888;font-family:monospace">No public repositories.</p>';
        return;
    }

    // Sort by stars, take top 6
    const top = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 6);

    grid.innerHTML = top.map(repo => {
        const color = repo.language ? (langColors[repo.language] || '#888') : '#ccc';
        const desc = repo.description || 'No description provided.';

        return `
            <a class="repo-card" href="${repo.html_url}" target="_blank" rel="noopener">
                <span class="repo-name">📁 ${escapeHtml(repo.name)}</span>
                <span class="repo-desc">${escapeHtml(desc)}</span>
                <div class="repo-meta">
                    ${repo.language ? `<span class="repo-stat">
                        <span class="lang-dot" style="background:${color}"></span>
                        ${escapeHtml(repo.language)}
                    </span>` : ''}
                    <span class="repo-stat">⭐ ${formatNumber(repo.stargazers_count)}</span>
                    <span class="repo-stat">🍴 ${formatNumber(repo.forks_count)}</span>
                </div>
            </a>
        `;
    }).join('');
}

// =====================
// HELPERS
// =====================
function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    profileCard.classList.add('hidden');
}

function showError(msg) {
    loadingState.classList.add('hidden');
    profileCard.classList.add('hidden');
    errorText.textContent = msg;
    errorState.classList.remove('hidden');
}

function showProfile() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    profileCard.classList.remove('hidden');
}

// =====================
// EVENTS
// =====================
searchBtn.addEventListener('click', searchUser);

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchUser();
});
