import sqlite3
import os
import pandas as pd
import numpy as np
import ast
import re

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'gradmatch.db')
DATASETS_PATH = os.path.join(os.path.dirname(__file__), 'data', 'datasets')


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS programmes (
            programme_id INTEGER PRIMARY KEY AUTOINCREMENT,
            programme_title TEXT NOT NULL,
            university_name TEXT NOT NULL,
            country TEXT NOT NULL,
            tuition_usd REAL,
            duration_months INTEGER,
            min_cgpa_requirement REAL,
            qs_ranking_score REAL,
            cost_of_living_index REAL,
            programme_description_text TEXT,
            entry_requirements_text TEXT,
            accepted_disciplines TEXT DEFAULT 'All',
            programme_url TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS embeddings (
            embedding_id INTEGER PRIMARY KEY AUTOINCREMENT,
            programme_id INTEGER NOT NULL,
            embedding_vector BLOB NOT NULL,
            FOREIGN KEY (programme_id) REFERENCES programmes (programme_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_profiles (
            student_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            cgpa REAL NOT NULL,
            undergraduate_major TEXT,
            undergraduate_discipline TEXT,
            preferred_country TEXT,
            budget_usd REAL,
            duration_preference_months INTEGER,
            interest_statement_text TEXT,
            ielts_score REAL,
            english_test_type TEXT DEFAULT 'None'"
            english_test_score REAL DEFAULT 0"
            work_experience INTEGER DEFAULT 0,
            research_experience INTEGER DEFAULT 0,
            query_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recommendation_log (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            programme_id INTEGER NOT NULL,
            mcdm_score REAL,
            sbert_score REAL,
            ranking_score REAL,
            affordability_score REAL,
            competitiveness_score REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES student_profiles (student_id),
            FOREIGN KEY (programme_id) REFERENCES programmes (programme_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE,
            role TEXT DEFAULT 'student',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS wishlist (
            wishlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            programme_id INTEGER NOT NULL,
            saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id),
            FOREIGN KEY (programme_id) REFERENCES programmes (programme_id),
            UNIQUE(user_id, programme_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS application_tracker (
            tracker_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            programme_id INTEGER NOT NULL,
            university_name TEXT NOT NULL,
            programme_title TEXT NOT NULL,
            country TEXT NOT NULL,
            status TEXT DEFAULT 'Interested',
            notes TEXT,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id),
            UNIQUE(user_id, programme_id)
        )
    ''')

    conn.commit()
    conn.close()
    print("Database tables created successfully.")


def extract_cgpa(text):
    if not text or pd.isna(text):
        return None

    text = str(text).lower()

    if 'first class' in text or '1st class' in text or 'first-class' in text:
        return 3.7
    if 'upper second' in text or '2:1' in text or '2.1' in text:
        return 3.3
    if 'lower second' in text or '2:2' in text or '2.2' in text:
        return 2.7
    if 'third class' in text or '3rd class' in text:
        return 2.3
    if 'distinction' in text:
        return 3.7
    if 'merit' in text:
        return 3.3

    wam_match = re.search(r'wam\s+of\s+(\d+)', text)
    if wam_match:
        wam = float(wam_match.group(1))
        if wam >= 80: return 3.7
        elif wam >= 70: return 3.3
        elif wam >= 60: return 3.0
        else: return 2.7

    gpa_5_match = re.search(r'(\d+\.?\d*)\s*/\s*5', text)
    if gpa_5_match:
        val = float(gpa_5_match.group(1))
        if 0.0 <= val <= 5.0:
            return round(val * 0.8, 2)

    german_match = re.search(r'(\d+\.?\d*)\s+or\s+better', text)
    if german_match:
        val = float(german_match.group(1))
        if 1.0 <= val <= 4.0:
            return round(4.0 - ((val - 1.0) * (4.0 / 3.0)), 2)

    patterns = [
        r'gpa\s+of\s+(\d+\.?\d*)',
        r'gpa\s+(\d+\.?\d*)',
        r'(\d+\.?\d*)\s+gpa',
        r'minimum\s+gpa\s+(\d+\.?\d*)',
        r'grade\s+point\s+average\s+of\s+(\d+\.?\d*)',
        r'cumulative\s+gpa\s+of\s+(\d+\.?\d*)',
        r'required\s+score[:\s]+(\d+\.?\d*)',
        r'(\d+\.?\d*)\s*/\s*4\.0',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            val = float(match.group(1))
            if 0.0 <= val <= 4.0: return val
            elif 4.0 < val <= 5.0: return round(val * 0.8, 2)

    if 'b+ average' in text or 'b plus' in text: return 3.3
    if 'b average' in text or 'grade b' in text: return 3.0
    if 'a average' in text or 'grade a' in text: return 3.7
    if 'c average' in text or 'grade c' in text: return 2.5

    return None


def map_discipline(programme_name):
    name = str(programme_name).lower()

    if any(k in name for k in ['law', 'llm', 'legal', 'jurisprudence', 'barrister', 'solicitor']):
        return 'Law'
    if any(k in name for k in ['medicine', 'medical', 'nursing', 'pharmacy', 'clinical', 'dental', 'physiotherapy', 'psychiatry', 'epidemiology']):
        return 'Medicine and Health'
    if any(k in name for k in ['computer science', 'software engineering', 'information technology', 'data science', 'artificial intelligence', 'machine learning', 'cybersecurity', 'information systems']):
        return 'Computer Science and IT'
    if any(k in name for k in ['mechanical engineering', 'electrical engineering', 'civil engineering', 'aerospace engineering', 'chemical engineering', 'structural engineering', 'robotics engineering']):
        return 'Engineering and Technology'
    if any(k in name for k in ['physics', 'chemistry', 'mathematics', 'biology', 'neuroscience', 'astronomy', 'biochemistry', 'genetics', 'geology', 'ecology']):
        return 'Science and Mathematics'
    if any(k in name for k in ['political science', 'international relations', 'public policy', 'sociology', 'anthropology', 'linguistics', 'gender studies', 'development studies']):
        return 'Social Sciences and Humanities'
    if any(k in name for k in ['mba', 'business administration']):
        return 'Business and Management'
    if any(k in name for k in ['architecture', 'fine art', 'graphic design', 'interior design', 'fashion design']):
        return 'Arts and Design'
    if any(k in name for k in ['education', 'teaching', 'pedagogy']):
        return 'Education'
    if any(k in name for k in ['agriculture', 'agronomy', 'veterinary', 'horticulture', 'forestry']):
        return 'Agriculture'

    discipline_map = {
        'Computer Science and IT': [
            'computing', 'network', 'database', 'programming', 'web development',
            'cloud', 'devops', 'blockchain', 'it management', 'cyber'
        ],
        'Business and Management': [
            'business', 'management', 'marketing', 'finance', 'accounting',
            'economics', 'entrepreneurship', 'supply chain', 'operations',
            'human resources', 'strategy', 'leadership', 'commerce',
            'administration', 'project management'
        ],
        'Engineering and Technology': [
            'engineering', 'mechanical', 'electrical', 'civil', 'aerospace',
            'automotive', 'manufacturing', 'chemical', 'structural', 'robotics',
            'electronics', 'telecommunications'
        ],
        'Science and Mathematics': [
            'science', 'mathematics', 'statistics', 'data analytics',
            'environmental science'
        ],
        'Medicine and Health': [
            'health', 'public health', 'nutrition', 'psychology', 'global health',
            'occupational therapy', 'speech therapy'
        ],
        'Law': [
            'criminology', 'criminal justice', 'human rights', 'compliance',
            'regulatory', 'intellectual property', 'constitutional', 'tort',
            'litigation', 'family law', 'employment law', 'corporate law'
        ],
        'Social Sciences and Humanities': [
            'social', 'political', 'history', 'philosophy', 'communications',
            'media', 'journalism', 'cultural', 'international studies'
        ],
        'Arts and Design': [
            'art', 'design', 'music', 'film', 'photography', 'animation',
            'creative', 'theatre', 'drama', 'dance', 'fashion'
        ],
        'Education': [
            'curriculum', 'e-learning', 'higher education', 'training'
        ],
        'Agriculture': [
            'food science', 'aquaculture', 'rural development', 'crop'
        ],
    }

    for discipline, keywords in discipline_map.items():
        for keyword in keywords:
            if keyword in name:
                return discipline

    return 'All'


def clean_description(text):
    if not text:
        return ''
    text = str(text).strip()
    if text.startswith('[') and text.endswith(']'):
        try:
            items = ast.literal_eval(text)
            if isinstance(items, list):
                return ' '.join([str(i) for i in items if i])
        except:
            pass
    return text


def load_ranking_data():
    from rapidfuzz import process, fuzz

    qs_path = os.path.join(DATASETS_PATH, '2026_QS_World University_Rankings.csv')
    qs_df = pd.read_csv(qs_path, encoding='utf-8', on_bad_lines='skip')
    
    qs_df['qs_ranking_score'] = (
        0.40 * pd.to_numeric(qs_df['Academic Reputation SCORE'], errors='coerce').fillna(0) +
        0.30 * pd.to_numeric(qs_df['Citations per Faculty SCORE'], errors='coerce').fillna(0) +
        0.30 * pd.to_numeric(qs_df['Employment Outcomes SCORE'], errors='coerce').fillna(0)
    )

    qs_df = qs_df.rename(columns={'Name': 'university_name'})
    qs_df = qs_df.dropna(subset=['university_name', 'qs_ranking_score'])
    qs_names = qs_df['university_name'].tolist()
    qs_scores = dict(zip(qs_df['university_name'], qs_df['qs_ranking_score']))

    col_path = os.path.join(DATASETS_PATH, 'Cost_of_Living_Index_by_Country_2024.csv')
    col_df = pd.read_csv(col_path, encoding='utf-8', on_bad_lines='skip')
    col_df = col_df.rename(columns={'Country': 'country', 'Cost of Living Index': 'cost_of_living_index'})
    col_dict = dict(zip(col_df['country'], col_df['cost_of_living_index']))

    def fuzzy_qs(name):
        result = process.extractOne(name, qs_names, scorer=fuzz.token_sort_ratio)
        if result and result[1] >= 80:
            return qs_scores.get(result[0], None)
        return None

    print("Ranking data loaded successfully.")
    return qs_scores, col_dict, fuzzy_qs, qs_names


def process_and_load(qs_scores, col_dict, fuzzy_qs, qs_names):
    mp_path = os.path.join(DATASETS_PATH, 'Cleaned_Dataset.csv')
    df = pd.read_csv(mp_path, encoding='utf-8')
    print(f"Loaded cleaned dataset: {len(df)} records")

    col_fallback = {
        'United States': 70.0, 'United Kingdom': 72.0, 'Australia': 68.0,
        'Canada': 62.0, 'Netherlands': 65.0, 'France': 63.0, 'Germany': 58.0,
        'Ireland': 70.0, 'Sweden': 67.0, 'Italy': 57.0, 'Spain': 52.0,
        'New Zealand': 66.0, 'Malaysia': 38.0, 'Denmark': 74.0,
        'Norway': 80.0, 'Singapore': 76.0
    }

    programmes = []
    for _, row in df.iterrows():
        try:
            university = str(row['university_name']).strip()
            country = str(row['country']).strip()
            programme_title = str(row['programme_title']).strip()
            entry_requirements = str(row['entry_requirements']).strip()

            if not university or not country or not programme_title:
                continue

            discipline = map_discipline(programme_title)

            # Use the enriched description built in the notebook
            # (contains programme title, country, university, modules,
            #  entry requirements and facts — all labelled for SBERT)
            programme_description = clean_description(str(row['programme_description']))

            # If description is empty for any reason, fall back to basics
            if not programme_description or len(programme_description) < 20:
                programme_description = f"Programme: {programme_title} | Discipline: {discipline} | University: {university} | Country: {country}"

            qs_score = qs_scores.get(university)
            if not qs_score:
                qs_score = fuzzy_qs(university)
            if not qs_score:
                qs_score = 30.0

            col_value = col_dict.get(country, col_fallback.get(country, 60.0))

            min_cgpa = extract_cgpa(entry_requirements)
            if min_cgpa is None:
                if qs_score >= 80: min_cgpa = 3.7
                elif qs_score >= 60: min_cgpa = 3.5
                elif qs_score >= 40: min_cgpa = 3.3
                else: min_cgpa = 3.0

            programmes.append({
                'programme_title': programme_title,
                'university_name': university,
                'country': country,
                'tuition_usd': float(row['tuition_usd']),
                'duration_months': int(row['duration_months']),
                'min_cgpa_requirement': round(float(min_cgpa), 2),
                'qs_ranking_score': round(float(qs_score), 2),
                'cost_of_living_index': round(float(col_value), 2),
                'programme_description_text': programme_description,
                'entry_requirements_text': entry_requirements,
                'accepted_disciplines': discipline,
                'programme_url': str(row['program_url']) if pd.notna(row['program_url']) else ''
            })

        except Exception as e:
            print(f"Skipped row: {e}")
            continue

    print(f"Processed {len(programmes)} programme records.")
    return programmes


def populate_db(programmes):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM programmes')
    cursor.execute('DELETE FROM embeddings')

    for p in programmes:
        cursor.execute('''
            INSERT INTO programmes (
                programme_title, university_name, country,
                tuition_usd, duration_months,
                min_cgpa_requirement, qs_ranking_score,
                cost_of_living_index,
                programme_description_text, entry_requirements_text,
                accepted_disciplines, programme_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            p['programme_title'], p['university_name'], p['country'],
            p['tuition_usd'], p['duration_months'],
            p['min_cgpa_requirement'], p['qs_ranking_score'],
            p['cost_of_living_index'],
            p['programme_description_text'], p['entry_requirements_text'],
            p['accepted_disciplines'], p['programme_url']
        ))

    conn.commit()
    count = cursor.execute('SELECT COUNT(*) FROM programmes').fetchone()[0]
    conn.close()
    print(f"Database populated with {count} programme records.")


if __name__ == '__main__':
    init_db()
    qs_scores, col_dict, fuzzy_qs, qs_names = load_ranking_data()
    programmes = process_and_load(qs_scores, col_dict, fuzzy_qs, qs_names)
    populate_db(programmes)
    print("Data loading complete.")