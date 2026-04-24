# BFHL Tree Visualizer

## 1. Project Overview
This project is a full-stack web application built for the SRM Full Stack Engineering Challenge.  
It accepts directed node relationships, validates and processes them, detects duplicate edges and cycles, builds hierarchy trees, computes depth metrics, and presents everything in a clean visual dashboard plus raw JSON.

## 2. Tech Stack
- **Backend:** Python, Flask, Flask-CORS, python-dotenv
- **Frontend:** Vanilla HTML, CSS, JavaScript

## 3. Project Structure
```text
project/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

## 4. Setup & Run Locally

### Clone repository
```bash
git clone <your-repo-url>
cd project
```

### Run backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend runs on: `http://localhost:5000`

### Run frontend
Option 1:
- Open `frontend/index.html` directly in the browser.

Option 2:
- Use VS Code Live Server (recommended for development).

## 5. API Documentation

### Endpoint
- `POST /bfhl`

### Headers
- `Content-Type: application/json`

### Request Body
```json
{ "data": ["A->B", "A->C", "B->D"] }
```

### Response Schema
```json
{
  "user_id": "anjeethkumar_05082003",
  "email_id": "anjeeth@gmail.com",
  "college_roll_number": "AP21110012345",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": { "D": {} } } }, "depth": 3 },
    { "root": "X", "tree": {}, "has_cycle": true }
  ],
  "invalid_entries": ["hello", "1->2"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 2,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

## 6. Processing Rules Summary
- Trim whitespace from each entry before processing.
- Valid format is strict `X->Y` where `X` and `Y` are single uppercase letters.
- Invalid examples include malformed separators, digits, empty strings, missing nodes, multi-character nodes, and self-loops.
- Duplicate handling is applied only on valid edges; first occurrence is kept, each duplicate pair appears once in `duplicate_edges`.
- If a child receives multiple parents, only the first encountered parent edge is used.
- Root is chosen as a node never appearing as child in a group; if none exists (cycle-only group), lexicographically smallest node is used.
- DFS is used for cycle detection per connected group.
- Cyclic groups return `tree: {}` and `has_cycle: true` (without `depth`).
- Acyclic groups return nested `tree` and `depth` (without `has_cycle`).
- `depth` is the number of nodes in the longest root-to-leaf path.
- Summary includes total trees, total cycles, and largest tree root with lexicographic tiebreak.

## 7. Deployment

### Backend on Render
1. Create a new Web Service on Render and connect your repository.
2. Set build command (optional):  
   `pip install -r requirements.txt`
3. Set start command:  
   `python app.py`
4. Deploy and copy your Render URL.

### Frontend on Netlify
1. Open Netlify dashboard.
2. Drag and drop the `frontend` folder to deploy.
3. Netlify provides a live URL instantly.

### Update Frontend API URL
After backend deployment, update `frontend/script.js`:
- Replace `http://localhost:5000/bfhl` with your Render backend endpoint.

## 8. Example Input/Output

### Example Input
```json
["A->B","A->C","B->D","C->E","E->F","X->Y","Y->Z","Z->X","P->Q","Q->R","G->H","G->H","G->I","hello","1->2","A->"]
```

### Example Output Format
```json
{
  "user_id": "anjeethkumar_05082003",
  "email_id": "anjeeth@gmail.com",
  "college_roll_number": "AP21110012345",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } } },
      "depth": 4
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    },
    {
      "root": "G",
      "tree": { "G": { "H": {}, "I": {} } },
      "depth": 2
    },
    {
      "root": "P",
      "tree": { "P": { "Q": { "R": {} } } },
      "depth": 3
    }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 3,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```
