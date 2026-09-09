import sys
import os
sys.path.append(os.getcwd())

import unittest
from pathlib import Path

from apps.backend.app.ml.training.extract_case_documents import (
    normalize_text,
    detect_sections,
    compute_sha256,
    process_case
)

class TestExtraction(unittest.TestCase):
    def test_conservative_normalization(self):
        # Line endings
        raw = "Line 1\r\nLine 2\r\n"
        norm, logs = normalize_text(raw)
        self.assertEqual(norm, "Line 1\nLine 2\n")
        self.assertTrue(len(logs) > 0)
        
        # Blank lines
        raw_blanks = "A\n\n\n\nB"
        norm_blanks, logs2 = normalize_text(raw_blanks)
        self.assertEqual(norm_blanks, "A\n\nB")
        
        # Normal content stays same
        raw_ok = "CASE-2025"
        norm_ok, logs3 = normalize_text(raw_ok)
        self.assertEqual(norm_ok, raw_ok)
        self.assertEqual(len(logs3), 0)

    def test_section_heading_detection(self):
        text = "Some random text\n\nCase Overview\nHere is the overview.\nFirst Information Report\nFIR details."
        candidates = detect_sections(text)
        self.assertEqual(len(candidates), 2)
        categories = [c['category'] for c in candidates]
        self.assertIn('CASE_OVERVIEW', categories)
        self.assertIn('FIR', categories)

    def test_raw_text_immutability(self):
        raw = "Original\r\nText\n\n\n"
        norm, _ = normalize_text(raw)
        self.assertNotEqual(raw, norm)
        self.assertEqual(raw, "Original\r\nText\n\n\n")

if __name__ == '__main__':
    unittest.main()
