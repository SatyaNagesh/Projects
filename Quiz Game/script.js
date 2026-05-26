// ==========================
// QUIZ GAME - ADVANCED VERSION
// Added:
// 1. Timer
// 2. Categories
// 3. Difficulty Levels
// 4. Leaderboard (Local Storage)
// ==========================


// DOM ELEMENTS
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");

const questionText = document.getElementById("question-text");
const answersContainer = document.getElementById("answers-container");

const currentQuestionSpan = document.getElementById("current-question");
const totalQuestionsSpan = document.getElementById("total-questions");

const scoreSpan = document.getElementById("score");
const finalScoreSpan = document.getElementById("final-score");
const maxScoreSpan = document.getElementById("max-score");

const resultMessage = document.getElementById("result-message");

const progressBar = document.getElementById("progress");


// ==========================
// CREATE EXTRA UI WITH JS
// ==========================

// TIMER
const timerElement = document.createElement("p");
timerElement.style.marginTop = "10px";
timerElement.style.fontWeight = "bold";
timerElement.style.color = "#e86a33";

document.querySelector(".quiz-info").appendChild(timerElement);


// CATEGORY SELECT
const categorySelect = document.createElement("select");

categorySelect.innerHTML = `
<option value="all">All Categories</option>
<option value="General Knowledge">General Knowledge</option>
<option value="Science">Science</option>
<option value="Programming">Programming</option>
`;

categorySelect.style.padding = "10px";
categorySelect.style.margin = "10px";

startScreen.appendChild(categorySelect);


// DIFFICULTY SELECT
const difficultySelect = document.createElement("select");

difficultySelect.innerHTML = `
<option value="easy">Easy</option>
<option value="medium">Medium</option>
<option value="hard">Hard</option>
`;

difficultySelect.style.padding = "10px";
difficultySelect.style.margin = "10px";

startScreen.appendChild(difficultySelect);


// LEADERBOARD
const leaderboardDiv = document.createElement("div");
leaderboardDiv.style.marginTop = "20px";

resultScreen.appendChild(leaderboardDiv);


// ==========================
// QUIZ QUESTIONS
// ==========================

const allQuestions = [

    {
        category: "General Knowledge",
        difficulty: "easy",
        question: "What is the capital of France?",
        answers: [
            { text: "London", correct: false },
            { text: "Berlin", correct: false },
            { text: "Paris", correct: true },
            { text: "Madrid", correct: false },
        ],
    },

    {
        category: "Science",
        difficulty: "easy",
        question: "Which planet is known as the Red Planet?",
        answers: [
            { text: "Venus", correct: false },
            { text: "Mars", correct: true },
            { text: "Jupiter", correct: false },
            { text: "Saturn", correct: false },
        ],
    },

    {
        category: "Science",
        difficulty: "medium",
        question: "What is the chemical symbol for gold?",
        answers: [
            { text: "Go", correct: false },
            { text: "Gd", correct: false },
            { text: "Au", correct: true },
            { text: "Ag", correct: false },
        ],
    },

    {
        category: "Programming",
        difficulty: "easy",
        question: "Which is NOT a programming language?",
        answers: [
            { text: "Java", correct: false },
            { text: "Python", correct: false },
            { text: "Banana", correct: true },
            { text: "JavaScript", correct: false },
        ],
    },

    {
        category: "Programming",
        difficulty: "hard",
        question: "Which company developed JavaScript?",
        answers: [
            { text: "Microsoft", correct: false },
            { text: "Netscape", correct: true },
            { text: "Google", correct: false },
            { text: "Apple", correct: false },
        ],
    },
];


// ==========================
// QUIZ STATE
// ==========================

let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answersDisabled = false;

let timer;
let timeLeft = 15;


// ==========================
// EVENT LISTENERS
// ==========================

startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", restartQuiz);


// ==========================
// START QUIZ
// ==========================

function startQuiz() {

    const selectedCategory = categorySelect.value;
    const selectedDifficulty = difficultySelect.value;

    quizQuestions = allQuestions.filter((question) => {

        const categoryMatch =
            selectedCategory === "all" ||
            question.category === selectedCategory;

        const difficultyMatch =
            question.difficulty === selectedDifficulty;

        return categoryMatch && difficultyMatch;
    });

    if (quizQuestions.length === 0) {
        alert("No questions available for selected filters.");
        return;
    }

    currentQuestionIndex = 0;
    score = 0;

    scoreSpan.textContent = score;

    totalQuestionsSpan.textContent = quizQuestions.length;
    maxScoreSpan.textContent = quizQuestions.length;

    startScreen.classList.remove("active");
    resultScreen.classList.remove("active");

    quizScreen.classList.add("active");

    showQuestion();
}


// ==========================
// SHOW QUESTION
// ==========================

function showQuestion() {

    clearInterval(timer);

    answersDisabled = false;

    const currentQuestion =
        quizQuestions[currentQuestionIndex];

    currentQuestionSpan.textContent =
        currentQuestionIndex + 1;

    const progressPercent =
        ((currentQuestionIndex + 1) /
            quizQuestions.length) * 100;

    progressBar.style.width =
        progressPercent + "%";

    questionText.textContent =
        currentQuestion.question;

    answersContainer.innerHTML = "";

    currentQuestion.answers.forEach((answer) => {

        const button =
            document.createElement("button");

        button.textContent = answer.text;

        button.classList.add("answer-btn");

        button.dataset.correct = answer.correct;

        button.addEventListener(
            "click",
            selectAnswer
        );

        answersContainer.appendChild(button);
    });

    startTimer();
}


// ==========================
// TIMER
// ==========================

function startTimer() {

    timeLeft = 15;

    timerElement.textContent =
        `Time Left: ${timeLeft}s`;

    timer = setInterval(() => {

        timeLeft--;

        timerElement.textContent =
            `Time Left: ${timeLeft}s`;

        if (timeLeft <= 0) {

            clearInterval(timer);

            currentQuestionIndex++;

            if (
                currentQuestionIndex <
                quizQuestions.length
            ) {
                showQuestion();
            }

            else {
                showResults();
            }
        }

    }, 1000);
}


// ==========================
// SELECT ANSWER
// ==========================

function selectAnswer(event) {

    if (answersDisabled) return;

    answersDisabled = true;

    clearInterval(timer);

    const selectedButton = event.target;

    const isCorrect =
        selectedButton.dataset.correct === "true";

    Array.from(
        answersContainer.children
    ).forEach((button) => {

        if (
            button.dataset.correct === "true"
        ) {
            button.classList.add("correct");
        }

        else if (
            button === selectedButton
        ) {
            button.classList.add("incorrect");
        }
    });

    if (isCorrect) {

        score++;

        scoreSpan.textContent = score;
    }

    setTimeout(() => {

        currentQuestionIndex++;

        if (
            currentQuestionIndex <
            quizQuestions.length
        ) {
            showQuestion();
        }

        else {
            showResults();
        }

    }, 1000);
}


// ==========================
// SHOW RESULTS
// ==========================

function showResults() {

    clearInterval(timer);

    quizScreen.classList.remove("active");

    resultScreen.classList.add("active");

    finalScoreSpan.textContent = score;

    const percentage =
        (score / quizQuestions.length) * 100;

    if (percentage === 100) {

        resultMessage.textContent =
            "Perfect Score!";
    }

    else if (percentage >= 80) {

        resultMessage.textContent =
            "Excellent!";
    }

    else if (percentage >= 60) {

        resultMessage.textContent =
            "Good Job!";
    }

    else {

        resultMessage.textContent =
            "Keep Practicing!";
    }

    saveLeaderboard();
    showLeaderboard();
}


// ==========================
// LEADERBOARD
// ==========================

function saveLeaderboard() {

    let leaderboard =
        JSON.parse(
            localStorage.getItem("leaderboard")
        ) || [];

    leaderboard.push(score);

    leaderboard.sort((a, b) => b - a);

    leaderboard = leaderboard.slice(0, 5);

    localStorage.setItem(
        "leaderboard",
        JSON.stringify(leaderboard)
    );
}


function showLeaderboard() {

    let leaderboard =
        JSON.parse(
            localStorage.getItem("leaderboard")
        ) || [];

    leaderboardDiv.innerHTML =
        "<h3>Leaderboard</h3>";

    leaderboard.forEach((score, index) => {

        leaderboardDiv.innerHTML += `
            <p>
                ${index + 1}. Score: ${score}
            </p>
        `;
    });
}


// ==========================
// RESTART QUIZ
// ==========================

function restartQuiz() {

    startQuiz();
}
