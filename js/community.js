const STORAGE_KEY = "spark-community-posts";
const MEMBER_COUNT = 1842;

const defaultPosts = [
  {
    id: crypto.randomUUID(),
    author: "阿泽",
    title: "大家如何组织线上读书会？",
    content: "我们准备每周一次 45 分钟，想听听你们的流程建议。",
    createdAt: new Date().toISOString(),
    replies: ["建议固定主持人和轮值记录员", "先收集问题再共读会更高效"]
  },
  {
    id: crypto.randomUUID(),
    author: "Mia",
    title: "开源协作招募前端同学",
    content: "正在做一个社区工具面板，欢迎来一起打磨交互和可访问性。",
    createdAt: new Date(Date.now() - 36e5).toISOString(),
    replies: ["有仓库地址吗？", "可否支持移动端优先？", "我想参与测试"]
  }
];

const api = {
  async listPosts() {
    return this._read();
  },
  async createPost(data) {
    const posts = this._read();
    posts.unshift({
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
      replies: []
    });
    this._write(posts);
    return posts;
  },
  async createReply(postId, text) {
    const posts = this._read();
    const target = posts.find((post) => post.id === postId);
    if (!target) return posts;
    target.replies.push(text);
    this._write(posts);
    return posts;
  },
  _read() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPosts));
      return [...defaultPosts];
    }
    return JSON.parse(raw);
  },
  _write(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }
};

const postForm = document.querySelector("#postForm");
const postList = document.querySelector("#postList");
const sortSelect = document.querySelector("#sortSelect");
const template = document.querySelector("#postTemplate");
const topicList = document.querySelector("#topicList");
const memberCount = document.querySelector("#memberCount");
const postCount = document.querySelector("#postCount");
const todayCount = document.querySelector("#todayCount");

function formatTime(iso) {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function sortPosts(posts) {
  if (sortSelect.value === "hot") {
    return [...posts].sort((a, b) => b.replies.length - a.replies.length);
  }
  return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderTopics(posts) {
  const counter = new Map();
  posts.forEach((post) => {
    post.title.split(/\s+/).forEach((word) => {
      if (word.length < 2) return;
      counter.set(word, (counter.get(word) || 0) + 1);
    });
  });

  const topics = [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word, count]) => `<li>#${word} · ${count} 次讨论</li>`)
    .join("");

  topicList.innerHTML = topics || "<li>#新人报到 · 1 次讨论</li>";
}

function renderStats(posts) {
  memberCount.textContent = MEMBER_COUNT.toLocaleString("zh-CN");
  postCount.textContent = posts.length.toString();
  const today = new Date().toDateString();
  const todayPosts = posts.filter((post) => new Date(post.createdAt).toDateString() === today).length;
  todayCount.textContent = String(todayPosts);
}

function renderPosts(posts) {
  postList.innerHTML = "";
  sortPosts(posts).forEach((post) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".post-title").textContent = post.title;
    node.querySelector(".post-meta").textContent = `${post.author} · ${formatTime(post.createdAt)}`;
    node.querySelector(".post-content").textContent = post.content;
    node.querySelector(".post-replies").textContent = `${post.replies.length} 条回复`;

    const replyList = node.querySelector(".reply-list");
    replyList.innerHTML = post.replies.map((reply) => `<li>${reply}</li>`).join("");

    const replyForm = node.querySelector(".reply-form");
    replyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = replyForm.querySelector("input");
      const value = input.value.trim();
      if (!value) return;
      const updated = await api.createReply(post.id, value);
      input.value = "";
      render(updated);
    });

    postList.appendChild(node);
  });
}

async function render(postsInput) {
  const posts = postsInput || (await api.listPosts());
  renderStats(posts);
  renderTopics(posts);
  renderPosts(posts);
}

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = {
    author: document.querySelector("#authorInput").value.trim(),
    title: document.querySelector("#titleInput").value.trim(),
    content: document.querySelector("#contentInput").value.trim()
  };
  if (!data.author || !data.title || !data.content) return;

  const updated = await api.createPost(data);
  postForm.reset();
  render(updated);
});

sortSelect.addEventListener("change", () => render());
document.querySelector("#joinBtn").addEventListener("click", () => {
  alert("欢迎加入星火社区！先从发布第一条动态开始吧～");
});

render();
