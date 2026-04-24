const API_CANDIDATES = [
  `${window.location.origin}/bfhl`,
  "http://localhost:5001/bfhl",
  "http://127.0.0.1:5001/bfhl",
  "http://localhost:5000/bfhl",
  "http://127.0.0.1:5000/bfhl",
];

const edgesInput = document.getElementById("edgesInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const spinner = document.getElementById("spinner");
const errorBox = document.getElementById("errorBox");
const hierarchiesContainer = document.getElementById("hierarchiesContainer");
const rawJsonOutput = document.getElementById("rawJsonOutput");
const invalidBadges = document.getElementById("invalidBadges");
const duplicateBadges = document.getElementById("duplicateBadges");
const totalTrees = document.getElementById("totalTrees");
const totalCycles = document.getElementById("totalCycles");
const largestRoot = document.getElementById("largestRoot");

function setLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  spinner.classList.toggle("hidden", !isLoading);
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function createBadge(text, className) {
  const badge = document.createElement("span");
  badge.className = `badge ${className}`;
  badge.textContent = text;
  return badge;
}

function renderBadges(container, list, className) {
  container.innerHTML = "";
  if (!list || list.length === 0) {
    container.textContent = "None";
    return;
  }
  list.forEach((value) => container.appendChild(createBadge(value, className)));
}

function createTreeNode(node, subtree) {
  const li = document.createElement("li");
  li.textContent = node;
  const children = Object.keys(subtree || {});
  if (children.length > 0) {
    const ul = document.createElement("ul");
    children.forEach((child) => ul.appendChild(createTreeNode(child, subtree[child])));
    li.appendChild(ul);
  }
  return li;
}

function renderHierarchies(hierarchies) {
  hierarchiesContainer.innerHTML = "";
  if (!hierarchies || hierarchies.length === 0) {
    hierarchiesContainer.textContent = "No hierarchies found.";
    return;
  }

  hierarchies.forEach((item) => {
    const card = document.createElement("article");
    const cycle = item.has_cycle === true;
    card.className = `tree-card ${cycle ? "cycle" : "valid"}`;

    const title = document.createElement("h3");
    title.textContent = `Root: ${item.root}`;
    const status = document.createElement("span");
    status.className = `status-pill ${cycle ? "cycle" : "valid"}`;
    status.textContent = cycle ? "Cycle detected" : `Depth: ${item.depth}`;
    title.appendChild(status);
    card.appendChild(title);

    if (cycle) {
      const note = document.createElement("p");
      note.textContent = "This group contains a cycle.";
      card.appendChild(note);
    } else {
      const root = Object.keys(item.tree)[0];
      const ul = document.createElement("ul");
      ul.className = "tree-list";
      ul.appendChild(createTreeNode(root, item.tree[root]));
      card.appendChild(ul);
    }
    hierarchiesContainer.appendChild(card);
  });
}

function renderResponse(data) {
  totalTrees.textContent = data.summary?.total_trees ?? "-";
  totalCycles.textContent = data.summary?.total_cycles ?? "-";
  largestRoot.textContent = data.summary?.largest_tree_root ?? "-";
  renderBadges(invalidBadges, data.invalid_entries, "badge-invalid");
  renderBadges(duplicateBadges, data.duplicate_edges, "badge-duplicate");
  renderHierarchies(data.hierarchies);
  rawJsonOutput.textContent = JSON.stringify(data, null, 2);
}

async function analyze() {
  clearError();
  setLoading(true);
  try {
    const entries = edgesInput.value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    if (entries.length === 0) {
      throw new Error("Please enter at least one relationship before analyzing.");
    }

    let lastError = null;
    let payload = null;
    let connected = false;

    for (const endpoint of API_CANDIDATES) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: entries }),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(`API error ${response.status}: ${json.error || "Unknown error"}`);
        }
        payload = json;
        connected = true;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!connected) {
      throw new Error(
        `Unable to connect to backend API. ${lastError ? lastError.message : ""}`.trim()
      );
    }

    renderResponse(payload);
  } catch (error) {
    showError(error.message || "Failed to call API.");
  } finally {
    setLoading(false);
  }
}

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });
}

analyzeBtn.addEventListener("click", analyze);
setupTabs();
