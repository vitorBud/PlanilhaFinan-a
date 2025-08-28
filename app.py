from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Para permitir chamadas do JS local

DB = 'database.db'

# --- Inicializar banco de dados ---
def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            type TEXT NOT NULL,
            value REAL NOT NULL,
            notes TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Helpers ---
def dict_from_row(row):
    return {
        "id": row[0],
        "date": row[1],
        "description": row[2],
        "category": row[3],
        "type": row[4],
        "value": row[5],
        "notes": row[6] or ""
    }

# --- Rotas ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transactions', methods=['GET'])
def get_transactions():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('SELECT * FROM transactions ORDER BY date DESC')
    rows = c.fetchall()
    conn.close()
    return jsonify([dict_from_row(r) for r in rows])

@app.route('/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''
        INSERT INTO transactions (date, description, category, type, value, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['date'], data['description'], data['category'], data['type'], data['value'], data.get('notes', '')))
    conn.commit()
    transaction_id = c.lastrowid
    conn.close()
    return jsonify({"status": "success", "id": transaction_id})

@app.route('/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    data = request.json
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''
        UPDATE transactions
        SET date=?, description=?, category=?, type=?, value=?, notes=?
        WHERE id=?
    ''', (data['date'], data['description'], data['category'], data['type'], data['value'], data.get('notes',''), id))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('DELETE FROM transactions WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True)
