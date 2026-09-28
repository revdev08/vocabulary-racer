import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


class TopicCatalogTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.content = self.root / 'content/es-en'
        self.content.mkdir(parents=True)
        (self.root / 'scripts').mkdir()
        (self.root / 'src/game/data').mkdir(parents=True)
        project = Path(__file__).resolve().parents[2]
        self.script = self.root / 'scripts/build-topic-catalog.py'
        shutil.copyfile(project / 'scripts/build-topic-catalog.py', self.script)
        for name in ('topic-lexicon.tsv', 'topic-senses.json', 'thematic-race-manifest.json'):
            shutil.copyfile(project / 'content/es-en' / name, self.content / name)
        self.catalog = self.root / 'src/game/data/excelCatalog.ts'
        shutil.copyfile(project / 'src/game/data/excelCatalog.ts', self.catalog)

    def run_build(self):
        return subprocess.run([sys.executable, str(self.script)], capture_output=True, text=True)

    def test_generation_is_idempotent_and_covers_every_word(self):
        self.assertEqual(self.run_build().returncode, 0)
        path = self.root / 'src/game/data/thematicCatalog.ts'
        first = path.read_bytes()
        manifest = (self.content / 'thematic-race-manifest.json').read_bytes()
        self.assertEqual(self.run_build().returncode, 0)
        self.assertEqual(path.read_bytes(), first)
        self.assertEqual((self.content / 'thematic-race-manifest.json').read_bytes(), manifest)
        report = json.loads((self.content / 'category-report.json').read_text(encoding='utf-8'))
        self.assertEqual(report['words'], 3847)
        self.assertEqual(report['unclassified'], 0)
        self.assertEqual(report['races'], 416)

    def test_unknown_word_fails_instead_of_silently_becoming_general_vocabulary(self):
        self.assertEqual(self.run_build().returncode, 0)
        path = self.root / 'src/game/data/thematicCatalog.ts'
        before = path.read_bytes()
        text = self.catalog.read_text(encoding='utf-8')
        data = json.loads(text.split('export const excelCatalog = ', 1)[1].strip().removesuffix(';'))
        data['words'].append({**data['words'][0], 'id': 'test-new-word', 'correct': 'unclassified test fixture'})
        self.catalog.write_text('export const excelCatalog = ' + json.dumps(data) + ';', encoding='utf-8')
        result = self.run_build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('no general fallback', result.stderr)
        self.assertEqual(path.read_bytes(), before)

    def test_published_race_membership_cannot_change_without_explicit_migration(self):
        self.assertEqual(self.run_build().returncode, 0)
        path = self.content / 'topic-senses.json'
        senses = json.loads(path.read_text(encoding='utf-8'))
        senses['es-en-fd345e1223e9e6c71ffa'] = 'Opiniones y acuerdos'
        path.write_text(json.dumps(senses), encoding='utf-8')
        result = self.run_build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('membership changed', result.stderr)


if __name__ == '__main__':
    unittest.main()
