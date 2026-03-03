const TOKEN_KEY = "spark_token";
const USER_KEY = "spark_user";

const apiBaseInput = document.querySelector("#apiBase");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const statusEl = document.querySelector("#status");
const tokenView = document.querySelector("#tokenView");

function showStatus(text, ok = true) {
  statusEl.textContent = text;
  statusEl.style.color = ok ? "#7af7d5" : "#ff8f8f";
}

function saveSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, data.username);
  tokenView.textContent = JSON.stringify(data, null, 2);
}

async function request(path, payload) {
  const base = apiBaseInput.value.trim().replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "请求失败");
  }
  return data;
}

async function handleRegister() {
  try {
    await request("/api/auth/register", {
      username: usernameInput.value.trim(),
      password: passwordInput.value
    });
    showStatus("注册成功，请继续登录");
  } catch (error) {
    showStatus(error.message, false);
  }
}

async function handleLogin() {
  try {
    const data = await request("/api/auth/login", {
      username: usernameInput.value.trim(),
      password: passwordInput.value
    });
    saveSession(data);
    showStatus("登录成功，已保存到 localStorage");
  } catch (error) {
    showStatus(error.message, false);
  }
}

document.querySelector("#registerBtn").addEventListener("click", handleRegister);
document.querySelector("#loginBtn").addEventListener("click", handleLogin);

const token = localStorage.getItem(TOKEN_KEY);
const username = localStorage.getItem(USER_KEY);
if (token && username) {
  tokenView.textContent = JSON.stringify({ token, username }, null, 2);
}
