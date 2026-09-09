import sys
import os
sys.path.append(os.getcwd())

import unittest
import argparse
from unittest.mock import patch, MagicMock

from apps.backend.app.ml.training.create_doccano_import import process_doccano_import

class TestDoccanoImport(unittest.TestCase):
    
    @patch('apps.backend.app.ml.training.create_doccano_import.load_manifest')
    @patch('pathlib.Path.exists')
    @patch('builtins.open')
    @patch('json.load')
    def test_canonical_filtering_and_duplicate_exclusion(self, mock_json_load, mock_open, mock_exists, mock_load_manifest):
        mock_load_manifest.return_value = [
            {'internal_id': 'CASE-A', 'canonical_status': 'TRUE', 'sha256': 'hashA'},
            {'internal_id': 'CASE-B', 'canonical_status': 'FALSE', 'sha256': 'hashB'} # Duplicate
        ]
        mock_exists.return_value = True
        
        # Return a single valid page for CASE-A
        mock_json_load.return_value = {
            'source_sha256': 'hashA',
            'pages': [{'page_number': 1, 'normalized_text': 'Valid text'}]
        }
        
        args = argparse.Namespace(dry_run=True, case_id=None, force=False, validate_only=False)
        stats = process_doccano_import(args)
        
        self.assertEqual(stats['cases_available'], 1)
        self.assertEqual(stats['cases_processed'], 1)
        self.assertEqual(stats['excluded_duplicates'], 1)
        self.assertEqual(stats['total_non_empty_pages_exported'], 1)
        self.assertEqual(stats['hash_mismatches'], 0)
        
    @patch('apps.backend.app.ml.training.create_doccano_import.load_manifest')
    @patch('pathlib.Path.exists')
    @patch('builtins.open')
    @patch('json.load')
    def test_blank_page_handling(self, mock_json_load, mock_open, mock_exists, mock_load_manifest):
        mock_load_manifest.return_value = [
            {'internal_id': 'CASE-A', 'canonical_status': 'TRUE'}
        ]
        mock_exists.return_value = True
        
        # One valid, one blank page
        mock_json_load.return_value = {
            'pages': [
                {'page_number': 1, 'normalized_text': 'Valid text'},
                {'page_number': 2, 'normalized_text': '   \n  '}
            ]
        }
        
        args = argparse.Namespace(dry_run=True, case_id=None, force=False, validate_only=False)
        stats = process_doccano_import(args)
        
        self.assertEqual(stats['total_non_empty_pages_exported'], 1)
        self.assertEqual(stats['pages_skipped'], 1)
        
    @patch('apps.backend.app.ml.training.create_doccano_import.load_manifest')
    @patch('pathlib.Path.exists')
    @patch('builtins.open')
    @patch('json.load')
    def test_hash_validation(self, mock_json_load, mock_open, mock_exists, mock_load_manifest):
        mock_load_manifest.return_value = [
            {'internal_id': 'CASE-A', 'canonical_status': 'TRUE', 'sha256': 'EXPECTED'}
        ]
        mock_exists.return_value = True
        
        mock_json_load.return_value = {
            'source_sha256': 'ACTUAL_MISMATCH',
            'pages': [{'page_number': 1, 'normalized_text': 'text'}]
        }
        
        args = argparse.Namespace(dry_run=True, case_id=None, force=False, validate_only=False)
        stats = process_doccano_import(args)
        
        self.assertEqual(stats['hash_mismatches'], 1)

    @patch('apps.backend.app.ml.training.create_doccano_import.load_manifest')
    @patch('pathlib.Path.exists')
    def test_missing_json_handling(self, mock_exists, mock_load_manifest):
        mock_load_manifest.return_value = [
            {'internal_id': 'CASE-A', 'canonical_status': 'TRUE'}
        ]
        # Simulate missing document.json
        mock_exists.return_value = False
        
        args = argparse.Namespace(dry_run=True, case_id=None, force=False, validate_only=False)
        stats = process_doccano_import(args)
        
        self.assertEqual(stats['missing_extracted_json'], 1)
        self.assertEqual(stats['status'], 'FAIL')

    @patch('apps.backend.app.ml.training.create_doccano_import.load_manifest')
    @patch('pathlib.Path.exists')
    @patch('builtins.open')
    @patch('json.load')
    def test_duplicate_record_detection(self, mock_json_load, mock_open, mock_exists, mock_load_manifest):
        mock_load_manifest.return_value = [
            {'internal_id': 'CASE-A', 'canonical_status': 'TRUE'}
        ]
        mock_exists.return_value = True
        
        # Duplicate page numbers in the same document
        mock_json_load.return_value = {
            'pages': [
                {'page_number': 1, 'normalized_text': 'Valid text'},
                {'page_number': 1, 'normalized_text': 'Duplicate text'}
            ]
        }
        
        args = argparse.Namespace(dry_run=True, case_id=None, force=False, validate_only=False)
        
        with self.assertRaises(ValueError) as context:
            process_doccano_import(args)
            
        self.assertTrue("Duplicate record detected" in str(context.exception))

if __name__ == '__main__':
    unittest.main()
