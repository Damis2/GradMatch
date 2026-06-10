import requests

test_cases = [
    {
        "name": "CS student interested in finance",
        "payload": {
            "cgpa": 3.5, "country": "United States", "duration": "24",
            "discipline": "Computer Science and IT", "major": "Information Systems",
            "interests": "I am interested in finance and banking",
            "english_test_type": "None", "english_test_score": "", "user_id": None
        }
    },
    {
        "name": "Business student interested in AI",
        "payload": {
            "cgpa": 3.3, "country": "United Kingdom", "duration": "12",
            "discipline": "Business and Management", "major": "Business Administration",
            "interests": "I want to study artificial intelligence and machine learning",
            "english_test_type": "IELTS", "english_test_score": "6.5", "user_id": None
        }
    },
    {
        "name": "Engineering student interested in sustainability",
        "payload": {
            "cgpa": 3.6, "country": "Germany", "duration": "24",
            "discipline": "Engineering and Technology", "major": "Civil Engineering",
            "interests": "I want to study renewable energy and sustainable development",
            "english_test_type": "None", "english_test_score": "", "user_id": None
        }
    },
    {
        "name": "Science student interested in data",
        "payload": {
            "cgpa": 3.4, "country": "Canada", "duration": "24",
            "discipline": "Science and Mathematics", "major": "Statistics",
            "interests": "I want to study data science and analytics",
            "english_test_type": "TOEFL", "english_test_score": "95", "user_id": None
        }
    },
    {
        "name": "Law student interested in human rights",
        "payload": {
            "cgpa": 3.2, "country": "United Kingdom", "duration": "12",
            "discipline": "Law", "major": "Law",
            "interests": "I am interested in international human rights law",
            "english_test_type": "IELTS", "english_test_score": "7.0", "user_id": None
        }
    },
    {
        "name": "Health student interested in digital health",
        "payload": {
            "cgpa": 3.3, "country": "Australia", "duration": "24",
            "discipline": "Medicine and Health", "major": "Public Health",
            "interests": "I want to study health informatics and digital health",
            "english_test_type": "IELTS", "english_test_score": "7.0", "user_id": None
        }
    },
    {
        "name": "Arts student interested in UX",
        "payload": {
            "cgpa": 3.1, "country": "Netherlands", "duration": "24",
            "discipline": "Arts and Design", "major": "Graphic Design",
            "interests": "I am interested in UX design and human computer interaction",
            "english_test_type": "None", "english_test_score": "", "user_id": None
        }
    },
    {
        "name": "Social science student interested in policy",
        "payload": {
            "cgpa": 3.4, "country": "United Kingdom", "duration": "12",
            "discipline": "Social Sciences and Humanities", "major": "Political Science",
            "interests": "I want to study public policy and governance",
            "english_test_type": "IELTS", "english_test_score": "7.5", "user_id": None
        }
    },
    {
        "name": "Education student interested in e-learning",
        "payload": {
            "cgpa": 3.2, "country": "Malaysia", "duration": "24",
            "discipline": "Education", "major": "Education",
            "interests": "I am interested in educational technology and e-learning",
            "english_test_type": "None", "english_test_score": "", "user_id": None
        }
    },
    {
        "name": "Agriculture student interested in food science",
        "payload": {
            "cgpa": 3.0, "country": "Australia", "duration": "24",
            "discipline": "Agriculture", "major": "Agricultural Science",
            "interests": "I want to study food science and food safety",
            "english_test_type": "IELTS", "english_test_score": "6.5", "user_id": None
        }
    },
]

for tc in test_cases:
    print(f"\n{'='*60}")
    print(f"TEST: {tc['name']}")
    print('='*60)
    
    response = requests.post("http://127.0.0.1:5000/api/recommend", json=tc['payload'])
    data = response.json()
    
    if not data.get('success'):
        print(f"FAILED: {data.get('error')}")
        continue
    
    recs = data.get('recommendations', [])
    print(f"Total results: {len(recs)}")
    
    for r in recs[:5]:
        print(f"  {r['programme_title']} — {r['university_name']}")
        print(f"  MCDM: {r['mcdm_score']}% | Semantic: {round(r['sbert_score']*100,1)}%")