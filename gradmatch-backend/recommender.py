import os
import numpy as np
from sentence_transformers import SentenceTransformer ,CrossEncoder
from database import get_connection

MODEL_NAME = 'all-mpnet-base-v2'
CROSS_ENCODER_NAME = 'cross-encoder/ms-marco-MiniLM-L-6-v2'

print("Loading SBERT model...")
sbert_model = SentenceTransformer(MODEL_NAME)
print("SBERT model loaded.")

print("Loading cross-encoder model...")
cross_encoder = CrossEncoder(CROSS_ENCODER_NAME)
print("Cross-encoder loaded.")
MODEL_NAME = 'all-mpnet-base-v2'


def load_embeddings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT programme_id, embedding_vector FROM embeddings')
    rows = cursor.fetchall()
    conn.close()
    embeddings = {}
    for row in rows:
        vector = np.frombuffer(row['embedding_vector'], dtype=np.float32)
        embeddings[row['programme_id']] = vector
    return embeddings


def cosine_similarity(vec1, vec2):
    dot = np.dot(vec1, vec2)
    norm = np.linalg.norm(vec1) * np.linalg.norm(vec2)
    if norm == 0:
        return 0.0
    return float(dot / norm)



def stage1_filter(profile):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM programmes
        WHERE LOWER(country) = LOWER(?)
        AND min_cgpa_requirement <= ?
        AND duration_months <= ?
    ''', (
        profile['country'],
        float(profile['cgpa']),
        int(profile['duration'])
    ))

    all_matching = cursor.fetchall()
    conn.close()

    if len(all_matching) == 0:
        conn2 = get_connection()
        cursor2 = conn2.cursor()
        cursor2.execute('''
            SELECT * FROM programmes
            WHERE LOWER(country) = LOWER(?)
            AND min_cgpa_requirement <= ?
        ''', (profile['country'], float(profile['cgpa'])))
        all_matching = cursor2.fetchall()
        conn2.close()
        print(f"Duration fallback applied: {len(all_matching)} programmes")

    print(f"Stage 1 after hard filters: {len(all_matching)} programmes")
    return all_matching


def normalise_english_score(test_type, score):
    try:
        score = float(score)
    except:
        return 0.5
    if test_type == 'IELTS':
        return max(0.0, min(1.0, (score - 5.0) / 4.0))
    elif test_type == 'TOEFL':
        return max(0.0, min(1.0, (score - 60.0) / 60.0))
    elif test_type == 'PTE':
        return max(0.0, min(1.0, (score - 40.0) / 50.0))
    elif test_type == 'Duolingo':
        return max(0.0, min(1.0, (score - 75.0) / 85.0))
    else:
        return 0.5


def compute_student_fit(profile, prog):
    student_cgpa = float(profile['cgpa'])
    min_cgpa = float(prog['min_cgpa_requirement'])
    student_duration = int(profile['duration'])
    prog_duration = int(prog['duration_months'])

    cgpa_gap = student_cgpa - min_cgpa
    cgpa_component = max(0.0, min(1.0, (cgpa_gap + 1.0) / 2.0))
    duration_match = 1.0 if student_duration == prog_duration else 0.5
    student_fit = round((0.70 * cgpa_component) + (0.30 * duration_match), 4)

    return student_fit, cgpa_gap


def compute_mcdm_score(sbert_score, qs_score, cost_of_living_index, student_fit):
    # AHP-derived weights (CR = 0.045, consistent)
    # Pairwise: Semantic vs QS=7, Semantic vs Afford=5, Semantic vs Fit=3,
    # QS vs Afford=1, QS vs Fit=1/5, Afford vs Fit=1/5
    W_SEMANTIC      = 0.5488
    W_QS            = 0.0714
    W_AFFORDABILITY = 0.0799
    W_STUDENT_FIT   = 0.3000

    qs_normalised = round(min(float(qs_score or 30.0) / 100.0, 1.0), 4)
    affordability = round(1 - min(float(cost_of_living_index or 60.0) / 100.0, 1.0), 4)

    mcdm_score = round(
        W_SEMANTIC      * sbert_score +
        W_QS            * qs_normalised +
        W_AFFORDABILITY * affordability +
        W_STUDENT_FIT   * student_fit,
        4
    )
    return mcdm_score, qs_normalised, affordability


def compute_competitiveness(profile, prog):
    student_cgpa = float(profile['cgpa'])
    min_cgpa = float(prog['min_cgpa_requirement'])
    student_discipline = profile.get('discipline', 'All').strip()
    prog_discipline = prog['accepted_disciplines'].strip()

    cgpa_gap = student_cgpa - min_cgpa
    cgpa_component = max(0.0, min(1.0, (cgpa_gap + 1.0) / 2.0))

    english_component = normalise_english_score(
        profile.get('english_test_type', 'None'),
        profile.get('english_test_score', 0)
    )

    # Discipline alignment
    if student_discipline == 'All' or prog_discipline == 'All':
        discipline_component = 0.7  # neutral — open to all disciplines
    elif student_discipline == prog_discipline:
        discipline_component = 1.0  # exact match
    else:
        discipline_component = 0.3  # mismatch

    competitiveness = round(
        0.55 * cgpa_component +
        0.25 * english_component +
        0.20 * discipline_component,
        4
    )

    return competitiveness, cgpa_gap


def recommend(profile):
    print(f"Running recommendation for CGPA: {profile['cgpa']}, Country: {profile['country']}")

    candidates = stage1_filter(profile)
    print(f"Total candidates after Stage 1: {len(candidates)}")

    if not candidates:
        return []

    all_embeddings = load_embeddings()

    interest_text = profile.get('interests', '').strip()
    major = profile.get('major', '').strip()
    discipline = profile.get('discipline', '').strip()

    # Build enriched query to match structure of programme descriptions
    query_parts = []
    if major:
        query_parts.append(f"Programme: {major}")
    if discipline and discipline != 'All':
        query_parts.append(f"Discipline: {discipline}")
    if interest_text:
        query_parts.append(f"Modules and topics: {interest_text}")
        query_parts.append(f"Entry requirements: {interest_text}")
    if not query_parts:
        query_parts.append("postgraduate studies")

    enriched_query = ' | '.join(query_parts)
    print(f"Enriched query: {enriched_query}")
    student_vector = sbert_model.encode(enriched_query)

    results = []

    for prog in candidates:
        prog_id = prog['programme_id']

        if prog_id in all_embeddings:
            prog_vector = all_embeddings[prog_id]
            sbert_score = cosine_similarity(student_vector, prog_vector)
        else:
            sbert_score = 0.3

        if sbert_score < 0.35:
            continue

        student_fit, cgpa_gap = compute_student_fit(profile, prog)

        mcdm_score, qs_normalised, affordability_score = compute_mcdm_score(
            sbert_score,
            prog['qs_ranking_score'],
            prog['cost_of_living_index'],
            student_fit
        )

        competitiveness, _ = compute_competitiveness(profile, prog)

        results.append({
            'programme_id': prog_id,
            'programme_title': prog['programme_title'],
            'university_name': prog['university_name'],
            'country': prog['country'],
            'tuition_usd': prog['tuition_usd'],
            'duration_months': prog['duration_months'],
            'qs_ranking_score': prog['qs_ranking_score'],
            'cost_of_living_index': prog['cost_of_living_index'],
            'programme_description_text': prog['programme_description_text'],
            'entry_requirements_text': prog['entry_requirements_text'],
            'accepted_disciplines': prog['accepted_disciplines'],
            'programme_url': prog['programme_url'] if 'programme_url' in prog.keys() else '',
            'sbert_score': round(sbert_score, 4),
            'qs_normalised': round(qs_normalised, 4),
            'affordability_score': round(affordability_score, 4),
            'student_fit': round(student_fit, 4),
            'mcdm_score': round(mcdm_score * 100, 2),
            'competitiveness_score': round(competitiveness * 100, 2),
            'cgpa_gap': round(cgpa_gap, 2)
        })

    # Stage 3 — Cross-encoder re-ranking on top 50 SBERT results
    results.sort(key=lambda x: x['sbert_score'], reverse=True)
    top_50 = results[:50]

    if top_50:
        pairs = [
            (enriched_query, prog['programme_description_text'])
            for prog in top_50
        ]
        cross_scores = cross_encoder.predict(pairs)

        min_score = min(cross_scores)
        max_score = max(cross_scores)
        score_range = max_score - min_score if max_score != min_score else 1.0

        for i, score in enumerate(cross_scores):
            normalised = float((score - min_score) / score_range)
            top_50[i]['sbert_score'] = round(normalised, 4)

            mcdm, qs_n, afford = compute_mcdm_score(
                normalised,
                top_50[i]['qs_ranking_score'],
                top_50[i]['cost_of_living_index'],
                top_50[i]['student_fit']
            )
            top_50[i]['mcdm_score'] = round(mcdm * 100, 2)

        results = top_50

    results.sort(key=lambda x: x['mcdm_score'], reverse=True)
    print(f"Final results: {len(results)} programmes")
    return results[:20]