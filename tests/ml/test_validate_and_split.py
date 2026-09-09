import sys
import os
import json
import unittest
from pathlib import Path

sys.path.append(os.getcwd())

from apps.backend.app.ml.training.validate_and_split import validate_annotations, create_splits

class TestValidateAndSplit(unittest.TestCase):
    def setUp(self):
        self.test_dir = Path("data/case_type_cyber/annotations/ner")
        os.makedirs(self.test_dir, exist_ok=True)
        self.valid_input = self.test_dir / "valid_export_for_test.jsonl"
        self.mock_input = self.test_dir / "invalid_mock_artifacts" / "mock.jsonl"

    def tearDown(self):
        if self.valid_input.exists():
            os.remove(self.valid_input)
        if self.mock_input.exists():
            os.remove(self.mock_input)

    def write_mock_records(self, filepath, records):
        os.makedirs(filepath.parent, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            for r in records:
                f.write(json.dumps(r) + "\n")

    def test_reject_missing_file(self):
        with self.assertRaises(FileNotFoundError):
            validate_annotations("non_existent_file.jsonl")

    def test_reject_invalid_mock_dir(self):
        self.write_mock_records(self.mock_input, [{"text": "Hello"}])
        with self.assertRaises(ValueError) as context:
            validate_annotations(str(self.mock_input))
        self.assertIn("invalid_mock_artifacts", str(context.exception))

    def test_reject_forbidden_markers(self):
        self.write_mock_records(self.valid_input, [
            {
                "text": "Hello John Doe",
                "meta": {"case_id": "CASE-1", "document_id": "D1", "page_number": 1, "test_status": "MOCK"},
                "label": [[6, 14, "PERSON"]]
            }
        ])
        with self.assertRaises(ValueError) as context:
            validate_annotations(str(self.valid_input))
        self.assertIn("forbidden mock/test marker: MOCK", str(context.exception))

    def test_valid_annotations(self):
        self.write_mock_records(self.valid_input, [
            {
                "text": "Hello John Doe",
                "meta": {"case_id": "CASE-1", "document_id": "D1", "page_number": 1, "section_categories": ["FIR"]},
                "label": [[6, 14, "PERSON"]]
            }
        ])
        stats, cases = validate_annotations(str(self.valid_input))
        self.assertEqual(stats["status"], "PASS")
        self.assertEqual(stats["total_entities"], 1)

    def test_invalid_label(self):
        self.write_mock_records(self.valid_input, [
            {
                "text": "Hello John Doe",
                "meta": {"case_id": "CASE-1", "document_id": "D1", "page_number": 1},
                "label": [[6, 14, "INVALID_LABEL"]]
            }
        ])
        stats, cases = validate_annotations(str(self.valid_input))
        self.assertEqual(stats["status"], "FAIL")
        self.assertEqual(stats["label_warnings"], 1)

    def test_split_leakage_prevention(self):
        cases = {f"CASE-{i}": 5 for i in range(1, 9)}
        create_splits(cases)
        
        splits_dir = Path("data/case_type_cyber/splits")
        with open(splits_dir / "train_cases.txt", "r") as f:
            train = set(f.read().splitlines())
        with open(splits_dir / "dev_cases.txt", "r") as f:
            dev = set(f.read().splitlines())
        with open(splits_dir / "test_cases.txt", "r") as f:
            test = set(f.read().splitlines())
            
        self.assertEqual(len(train.intersection(dev)), 0)
        self.assertEqual(len(train.intersection(test)), 0)
        self.assertEqual(len(dev.intersection(test)), 0)
        
        self.assertEqual(len(train), 5)
        self.assertEqual(len(dev), 1)
        self.assertEqual(len(test), 2)

if __name__ == '__main__':
    unittest.main()
