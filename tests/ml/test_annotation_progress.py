import sys
import os
import unittest
import argparse
from unittest.mock import patch, mock_open

sys.path.append(os.getcwd())

from apps.backend.app.ml.training.check_annotation_progress import check_progress

class TestAnnotationProgress(unittest.TestCase):
    
    @patch('pathlib.Path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_progress_check_all_clean(self, mock_file, mock_exists):
        mock_exists.return_value = True
        
        # Mock file contents based on filename requested
        def side_effect(filename, *args, **kwargs):
            if "case_manifest.csv" in str(filename):
                return mock_open(read_data="internal_id,canonical_status\nCASE-1,TRUE\n").return_value
            elif "document.json" in str(filename):
                return mock_open(read_data='{"document_id": "D1", "pages": [{"page_number": 1, "normalized_text": "text"}]}').return_value
            elif "annotation_progress.csv" in str(filename):
                return mock_open(read_data="case_id,document_id,page_number,annotation_status\nCASE-1,D1,1,NOT_STARTED\n").return_value
            return mock_open().return_value

        mock_file.side_effect = side_effect
        
        args = argparse.Namespace(validate_only=True, case_id=None)
        stats = check_progress(args)
        
        self.assertEqual(stats["missing_records"], 0)
        self.assertEqual(stats["duplicate_records"], 0)
        self.assertEqual(stats["NOT_STARTED"], 1)

    @patch('pathlib.Path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_progress_check_missing(self, mock_file, mock_exists):
        mock_exists.return_value = True
        
        def side_effect(filename, *args, **kwargs):
            if "case_manifest.csv" in str(filename):
                return mock_open(read_data="internal_id,canonical_status\nCASE-1,TRUE\n").return_value
            elif "document.json" in str(filename):
                return mock_open(read_data='{"document_id": "D1", "pages": [{"page_number": 1, "normalized_text": "text"}]}').return_value
            elif "annotation_progress.csv" in str(filename):
                return mock_open(read_data="case_id,document_id,page_number,annotation_status\nCASE-X,D1,1,NOT_STARTED\n").return_value
            return mock_open().return_value

        mock_file.side_effect = side_effect
        
        args = argparse.Namespace(validate_only=True, case_id=None)
        stats = check_progress(args)
        
        self.assertEqual(stats["missing_records"], 1)
        self.assertEqual(stats["invalid_cases"], 1)

if __name__ == '__main__':
    unittest.main()
