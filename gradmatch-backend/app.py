import re
import os
import bcrypt
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_connection
from recommender import recommend

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])


# ─── helpers ────────────────────────────────────────────────────────────────

def db_query(sql, params=()):
    conn = get_connection()
    cursor = conn.cursor()
    rows = cursor.execute(sql, params).fetchall()
    conn.close()
    return rows

def db_one(sql, params=()):
    conn = get_connection()
    cursor = conn.cursor()
    row = cursor.execute(sql, params).fetchone()
    conn.close()
    return row

def db_write(sql, params=()):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    last_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return last_id


# ─── auth ────────────────────────────────────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email    = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not username or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400
        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters'}), 400
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({'error': 'Invalid email address'}), 400
        if len(password) < 8 or not re.search(r'[A-Z]', password) or not re.search(r'[0-9]', password):
            return jsonify({'error': 'Password must be 8+ chars with one uppercase and one number'}), 400
        if db_one('SELECT user_id FROM users WHERE username = ?', (username,)):
            return jsonify({'error': 'Username already exists'}), 400
        if db_one('SELECT user_id FROM users WHERE email = ?', (email,)):
            return jsonify({'error': 'Email already registered'}), 400

        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            (username, email, password_hash, 'student')
        )
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'user_id': user_id, 'username': username, 'role': 'student'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data     = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400

        user = db_one('SELECT * FROM users WHERE username = ?', (username,))
        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401

        stored = user['password_hash']
        if isinstance(stored, str):
            stored = stored.encode()
        if bcrypt.checkpw(password.encode(), stored):
            return jsonify({'success': True, 'user_id': user['user_id'], 'username': username, 'role': user['role']})
        return jsonify({'error': 'Invalid username or password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── recommendations ─────────────────────────────────────────────────────────

@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    try:
        data = request.get_json()
        for field in ['cgpa', 'country', 'duration', 'interests']:
            if data.get(field) is None:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        cgpa = float(data['cgpa'])
        if not (0 <= cgpa <= 4.0):
            return jsonify({'error': 'CGPA must be between 0 and 4.0'}), 400

        profile = {
            'cgpa': cgpa,
            'country': data['country'],
            'duration': int(data['duration']),
            'discipline': data.get('discipline', 'All'),
            'major': data.get('major', ''),
            'interests': data['interests'],
            'english_test_type': data.get('english_test_type', 'None'),
            'english_test_score': data.get('english_test_score', 0),
            'work_experience': int(data.get('work_experience', 0)),
            'research_experience': int(data.get('research_experience', 0)),
        }
        user_id = data.get('user_id')

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO student_profiles
            (user_id, cgpa, undergraduate_major, undergraduate_discipline,
            preferred_country, duration_preference_months,
            interest_statement_text, work_experience, research_experience,
            english_test_type, english_test_score)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, profile['cgpa'], profile['major'], profile['discipline'],
            profile['country'], profile['duration'], profile['interests'],
            profile['work_experience'], profile['research_experience'],
            profile['english_test_type'], profile['english_test_score']
        ))
        student_id = cursor.lastrowid
        conn.commit()

        results = recommend(profile)

        for r in results[:10]:
            cursor.execute('''
                INSERT INTO recommendation_log
                (student_id, programme_id, mcdm_score, sbert_score,
                 ranking_score, affordability_score, competitiveness_score)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (student_id, r['programme_id'], r['mcdm_score'],
                  r['sbert_score'], r['qs_normalised'],
                  r['affordability_score'], r['competitiveness_score']))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'count': len(results), 'recommendations': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── history ─────────────────────────────────────────────────────────────────

@app.route('/api/history/<int:user_id>', methods=['GET'])
def get_history(user_id):
    try:
        sessions = db_query('''
            SELECT s.student_id, s.cgpa, s.preferred_country,
                    s.english_test_type, s.english_test_score,
                   s.undergraduate_major, s.undergraduate_discipline,
                   s.interest_statement_text, s.query_timestamp,
                   s.duration_preference_months, s.work_experience,
                   s.research_experience, COUNT(r.log_id) as match_count
            FROM student_profiles s
            LEFT JOIN recommendation_log r ON s.student_id = r.student_id
            WHERE s.user_id = ?
            GROUP BY s.student_id
            ORDER BY s.query_timestamp DESC
        ''', (user_id,))

        history = []
        for s in sessions:
            recs = db_query('''
                SELECT r.mcdm_score, r.competitiveness_score,
                       p.programme_title, p.university_name, p.country
                FROM recommendation_log r
                JOIN programmes p ON r.programme_id = p.programme_id
                WHERE r.student_id = ?
                ORDER BY r.mcdm_score DESC LIMIT 5
            ''', (s['student_id'],))
            history.append({
                'student_id': s['student_id'],
                'cgpa': s['cgpa'],
                'preferred_country': s['preferred_country'],
                'undergraduate_major': s['undergraduate_major'],
                'undergraduate_discipline': s['undergraduate_discipline'],
                'english_test_type': s['english_test_type'],
                'english_test_score': s['english_test_score'],
                'interest_statement': s['interest_statement_text'],
                'query_timestamp': s['query_timestamp'],
                'duration_preference_months': s['duration_preference_months'],
                'work_experience': s['work_experience'],
                'research_experience': s['research_experience'],
                'match_count': s['match_count'],
                'top_recommendations': [dict(r) for r in recs],
            })
        return jsonify({'history': history})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── wishlist ────────────────────────────────────────────────────────────────

@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id required'}), 400
        items = db_query('''
            SELECT w.wishlist_id, w.saved_at, p.*
            FROM wishlist w
            JOIN programmes p ON w.programme_id = p.programme_id
            WHERE w.user_id = ? ORDER BY w.saved_at DESC
        ''', (user_id,))
        return jsonify({'wishlist': [dict(i) for i in items]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    try:
        data = request.get_json()
        user_id, programme_id = data.get('user_id'), data.get('programme_id')
        if not user_id or not programme_id:
            return jsonify({'error': 'user_id and programme_id required'}), 400
        db_write('INSERT OR IGNORE INTO wishlist (user_id, programme_id) VALUES (?, ?)', (user_id, programme_id))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/wishlist/<int:wishlist_id>', methods=['DELETE'])
def remove_from_wishlist(wishlist_id):
    try:
        db_write('DELETE FROM wishlist WHERE wishlist_id = ?', (wishlist_id,))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── tracker ─────────────────────────────────────────────────────────────────

@app.route('/api/tracker', methods=['GET'])
def get_tracker():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id required'}), 400
        items = db_query('''
            SELECT t.*, p.tuition_usd, p.duration_months, p.qs_ranking_score
            FROM application_tracker t
            JOIN programmes p ON t.programme_id = p.programme_id
            WHERE t.user_id = ? ORDER BY t.updated_at DESC
        ''', (user_id,))
        return jsonify({'tracker': [dict(i) for i in items]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tracker', methods=['POST'])
def add_to_tracker():
    try:
        data = request.get_json()
        user_id, programme_id = data.get('user_id'), data.get('programme_id')
        university_name = data.get('university_name')
        programme_title = data.get('programme_title')
        country = data.get('country')
        if not all([user_id, programme_id, university_name, programme_title, country]):
            return jsonify({'error': 'Missing required fields'}), 400
        db_write('''
            INSERT OR IGNORE INTO application_tracker
            (user_id, programme_id, university_name, programme_title, country, status)
            VALUES (?, ?, ?, ?, ?, 'Interested')
        ''', (user_id, programme_id, university_name, programme_title, country))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tracker/<int:tracker_id>', methods=['PUT'])
def update_tracker(tracker_id):
    try:
        data = request.get_json()
        db_write('''
            UPDATE application_tracker
            SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE tracker_id = ?
        ''', (data.get('status'), data.get('notes', ''), tracker_id))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tracker/<int:tracker_id>', methods=['DELETE'])
def delete_from_tracker(tracker_id):
    try:
        db_write('DELETE FROM application_tracker WHERE tracker_id = ?', (tracker_id,))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── dashboard ───────────────────────────────────────────────────────────────

@app.route('/api/dashboard/<int:user_id>', methods=['GET'])
def get_dashboard(user_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        def count(sql, params=()):
            return cursor.execute(sql, params).fetchone()['count']

        stats = {
            'searches':     count('SELECT COUNT(*) as count FROM student_profiles WHERE user_id = ?', (user_id,)),
            'wishlist':     count('SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?', (user_id,)),
            'applications': count('SELECT COUNT(*) as count FROM application_tracker WHERE user_id = ?', (user_id,)),
            'admitted':     count("SELECT COUNT(*) as count FROM application_tracker WHERE user_id = ? AND status = 'Admitted'", (user_id,)),
        }

        tracker_breakdown = {
            row['status']: row['count']
            for row in cursor.execute('''
                SELECT status, COUNT(*) as count FROM application_tracker
                WHERE user_id = ? GROUP BY status
            ''', (user_id,)).fetchall()
        }

        last_search = cursor.execute('''
            SELECT s.cgpa, s.preferred_country, s.undergraduate_discipline,
                   s.undergraduate_major, s.interest_statement_text,
                   s.query_timestamp, s.duration_preference_months,
                   COUNT(r.log_id) as match_count
            FROM student_profiles s
            LEFT JOIN recommendation_log r ON s.student_id = r.student_id
            WHERE s.user_id = ?
            GROUP BY s.student_id
            ORDER BY s.query_timestamp DESC LIMIT 1
        ''', (user_id,)).fetchone()

        top_rec = None
        if last_search:
            row = cursor.execute('''
                SELECT p.programme_title, p.university_name, p.country,
                       r.mcdm_score, r.competitiveness_score
                FROM recommendation_log r
                JOIN programmes p ON r.programme_id = p.programme_id
                JOIN student_profiles s ON r.student_id = s.student_id
                WHERE s.user_id = ?
                ORDER BY r.mcdm_score DESC LIMIT 1
            ''', (user_id,)).fetchone()
            if row:
                top_rec = dict(row)

        # Recent activity — merge searches, wishlist, tracker events
        searches = cursor.execute('''
            SELECT 'search' as type,
                   'Searched for programmes in ' || sp.preferred_country as text,
                   CAST(COUNT(r.log_id) as TEXT) || ' matches found' as sub,
                   sp.query_timestamp as timestamp
            FROM student_profiles sp
            LEFT JOIN recommendation_log r ON sp.student_id = r.student_id
            WHERE sp.user_id = ?
            GROUP BY sp.student_id
            ORDER BY sp.query_timestamp DESC LIMIT 5
        ''', (user_id,)).fetchall()

        wishlist_events = cursor.execute('''
            SELECT 'wishlist' as type,
                   'Saved ' || p.programme_title as text,
                   p.university_name || ' · ' || p.country as sub,
                   w.saved_at as timestamp
            FROM wishlist w
            JOIN programmes p ON w.programme_id = p.programme_id
            WHERE w.user_id = ?
            ORDER BY w.saved_at DESC LIMIT 5
        ''', (user_id,)).fetchall()

        tracker_events = cursor.execute('''
            SELECT 'tracker' as type,
                   'Updated ' || programme_title || ' to ' || status as text,
                   university_name || ' · ' || country as sub,
                   updated_at as timestamp
            FROM application_tracker
            WHERE user_id = ?
            ORDER BY updated_at DESC LIMIT 5
        ''', (user_id,)).fetchall()

        recent_activity = [dict(r) for r in searches + wishlist_events + tracker_events]
        recent_activity.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        recent_activity = recent_activity[:5]

        conn.close()
        return jsonify({
            'stats': stats,
            'tracker_breakdown': tracker_breakdown,
            'last_search': dict(last_search) if last_search else None,
            'top_rec': top_rec,
            'recent_activity': recent_activity,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── misc ────────────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'GradMatch API is running'})


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        total_queries = cursor.execute('SELECT COUNT(*) as count FROM student_profiles').fetchone()['count']
        avg_score = cursor.execute('SELECT AVG(mcdm_score) as avg FROM recommendation_log').fetchone()['avg']
        avg_comp = cursor.execute('SELECT AVG(competitiveness_score) as avg FROM recommendation_log').fetchone()['avg']
        top_country = cursor.execute('''
            SELECT preferred_country FROM student_profiles
            GROUP BY preferred_country ORDER BY COUNT(*) DESC LIMIT 1
        ''').fetchone()
        top_programmes = cursor.execute('''
            SELECT p.programme_title, p.university_name, COUNT(*) as count
            FROM recommendation_log r
            JOIN programmes p ON r.programme_id = p.programme_id
            GROUP BY r.programme_id ORDER BY count DESC LIMIT 10
        ''').fetchall()
        recent_sessions = cursor.execute('''
            SELECT s.student_id, s.cgpa, s.preferred_country,
                   s.undergraduate_major, s.query_timestamp,
                   COUNT(r.log_id) as match_count
            FROM student_profiles s
            LEFT JOIN recommendation_log r ON s.student_id = r.student_id
            GROUP BY s.student_id ORDER BY s.query_timestamp DESC LIMIT 10
        ''').fetchall()
        conn.close()
        return jsonify({
            'total_queries': total_queries,
            'avg_mcdm_score': round(avg_score, 2) if avg_score else 0,
            'avg_competitiveness': round(avg_comp, 2) if avg_comp else 0,
            'top_country': top_country['preferred_country'] if top_country else 'N/A',
            'top_programmes': [dict(r) for r in top_programmes],
            'recent_sessions': [dict(r) for r in recent_sessions],
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/profile/latest/<int:user_id>', methods=['GET'])
def get_latest_profile(user_id):
    try:
        profile = db_one('''
            SELECT * FROM student_profiles WHERE user_id = ?
            ORDER BY query_timestamp DESC LIMIT 1
        ''', (user_id,))
        return jsonify({'profile': dict(profile) if profile else None})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=False, host='0.0.0.0', port=port)