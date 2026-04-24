import os
import re
from collections import defaultdict

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS


load_dotenv()

app = Flask(__name__)
CORS(app)

EDGE_PATTERN = re.compile(r"^[A-Z]->[A-Z]$")

USER_ID = "anjeethkumar_05082003"
EMAIL_ID = "anjeeth@gmail.com"
COLLEGE_ROLL_NUMBER = "AP21110012345"


def find_components(nodes, undirected):
    visited = set()
    components = []
    for node in sorted(nodes):
        if node in visited:
            continue
        stack = [node]
        component = set()
        while stack:
            current = stack.pop()
            if current in visited:
                continue
            visited.add(current)
            component.add(current)
            for neighbor in undirected[current]:
                if neighbor not in visited:
                    stack.append(neighbor)
        components.append(component)
    return components


def component_root(component, indegree):
    roots = sorted([node for node in component if indegree[node] == 0])
    if roots:
        return roots[0]
    return min(component)


def has_cycle(component, directed):
    state = {}

    def dfs(node):
        state[node] = 1
        for child in directed[node]:
            if child not in component:
                continue
            child_state = state.get(child, 0)
            if child_state == 1:
                return True
            if child_state == 0 and dfs(child):
                return True
        state[node] = 2
        return False

    for node in sorted(component):
        if state.get(node, 0) == 0 and dfs(node):
            return True
    return False


def build_tree(node, directed):
    return {child: build_tree(child, directed) for child in sorted(directed[node])}


def tree_depth(node, directed):
    if not directed[node]:
        return 1
    return 1 + max(tree_depth(child, directed) for child in directed[node])


@app.route("/bfhl", methods=["POST"])
def bfhl():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or "data" not in payload or not isinstance(payload["data"], list):
        return jsonify({"error": "Request body must be {\"data\": [...]}"}), 400

    invalid_entries = []
    duplicate_edges = []

    valid_edges = []
    seen_edges = set()
    duplicate_seen = set()

    for raw_entry in payload["data"]:
        if not isinstance(raw_entry, str):
            invalid_entries.append(str(raw_entry).strip())
            continue

        entry = raw_entry.strip()
        if not entry or not EDGE_PATTERN.match(entry):
            invalid_entries.append(entry)
            continue

        parent, child = entry.split("->")
        if parent == child:
            invalid_entries.append(entry)
            continue

        if entry in seen_edges:
            if entry not in duplicate_seen:
                duplicate_edges.append(entry)
                duplicate_seen.add(entry)
            continue

        seen_edges.add(entry)
        valid_edges.append((parent, child, entry))

    directed = defaultdict(list)
    undirected = defaultdict(set)
    indegree = defaultdict(int)
    nodes = set()
    assigned_parent = {}

    for parent, child, _entry in valid_edges:
        nodes.add(parent)
        nodes.add(child)
        if child in assigned_parent:
            continue

        assigned_parent[child] = parent
        directed[parent].append(child)
        directed[child]
        undirected[parent].add(child)
        undirected[child].add(parent)
        indegree[parent] += 0
        indegree[child] += 1

    hierarchies = []
    tree_records = []

    if nodes:
        components = find_components(nodes, undirected)
        for component in components:
            root = component_root(component, indegree)
            cycle_found = has_cycle(component, directed)

            if cycle_found:
                hierarchies.append({"root": root, "tree": {}, "has_cycle": True})
                continue

            nested = {root: build_tree(root, directed)}
            depth = tree_depth(root, directed)
            hierarchies.append({"root": root, "tree": nested, "depth": depth})
            tree_records.append((depth, root))

    total_trees = len(tree_records)
    total_cycles = len([item for item in hierarchies if item.get("has_cycle") is True])

    largest_tree_root = None
    if tree_records:
        tree_records.sort(key=lambda item: (-item[0], item[1]))
        largest_tree_root = tree_records[0][1]

    response = {
        "user_id": USER_ID,
        "email_id": EMAIL_ID,
        "college_roll_number": COLLEGE_ROLL_NUMBER,
        "hierarchies": hierarchies,
        "invalid_entries": invalid_entries,
        "duplicate_edges": duplicate_edges,
        "summary": {
            "total_trees": total_trees,
            "total_cycles": total_cycles,
            "largest_tree_root": largest_tree_root,
        },
    }
    return jsonify(response), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
