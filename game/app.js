const TOKEN_KEY = "spark_token";
const USER_KEY = "spark_user";

const apiBaseInput = document.querySelector("#apiBase");
const userNameEl = document.querySelector("#userName");
const timeLeftEl = document.querySelector("#timeLeft");
const scoreEl = document.querySelector("#score");
const statusEl = document.querySelector("#status");
const leaderboardEl = document.querySelector("#leaderboard");
const tapBtn = document.querySelector("#tapBtn");

let score = 0;
let timeLeft = 30;
let timer = null;

function showStatus(text, ok = true) {
  statusEl.textContent = text;
  statusEl.style.color = ok ? "#7af7d5" : "#ff8f8f";
}

function getSession() {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    username: localStorage.getItem(USER_KEY)
  };
}

async function fetchLeaderboard() {
  const base = apiBaseInput.value.trim().replace(/\/$/, "");
  const res = await fetch(`${base}/api/game/leaderboard`);
  const data = await res.json();
  leaderboardEl.innerHTML = "";
  data.items.forEach((item, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${item.username} - ${item.score} 分`;
    leaderboardEl.appendChild(li);
  });
  if (!data.items.length) {
    leaderboardEl.innerHTML = "<li>暂无成绩</li>";
  }
}

function startGame() {
  score = 0;
  timeLeft = 30;
  scoreEl.textContent = String(score);
  timeLeftEl.textContent = String(timeLeft);
  tapBtn.disabled = false;

  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft -= 1;
    timeLeftEl.textContent = String(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timer);
      tapBtn.disabled = true;
      showStatus(`游戏结束！你的分数：${score}`);
    }
  }, 1000);
}

function tap() {
  if (timeLeft <= 0) return;
  score += 1;
  scoreEl.textContent = String(score);
}

async function submitScore() {
  const session = getSession();
  if (!session.token || !session.username) {
    showStatus("请先在登录模块登录", false);
    return;
  }

  const base = apiBaseInput.value.trim().replace(/\/$/, "");
  const res = await fetch(`${base}/api/game/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: session.token, score })
  });
  const data = await res.json();
  if (!res.ok) {
    showStatus(data.detail || "提交失败", false);
    return;
  }
  showStatus("提交成功，排行榜已刷新");
  await fetchLeaderboard();
}

document.querySelector("#startBtn").addEventListener("click", startGame);
tapBtn.addEventListener("click", tap);
document.querySelector("#submitBtn").addEventListener("click", submitScore);
document.querySelector("#refreshBtn").addEventListener("click", fetchLeaderboard);

const session = getSession();
if (session.username) userNameEl.textContent = session.username;
fetchLeaderboard();
