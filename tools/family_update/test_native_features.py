"""QA can inherit only existing captured flags and never changes the input save."""
import io,json,struct,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import nbtlib
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import native_common as m

class NativeFeatureTests(unittest.TestCase):
    def test_exact_existing_flags_are_preserved_only_when_explicitly_selected(self):
        with tempfile.TemporaryDirectory() as tmp:
            r=Path(tmp);before=r/'production-before';before.mkdir()
            captured=before/'level-metadata.dat';flags={'upcoming_creator_features':nbtlib.Byte(1),'experiments_ever_used':nbtlib.Byte(1)}
            body=io.BytesIO();nbtlib.File({'experiments':nbtlib.Compound(flags)}).write(body,byteorder='little');raw=body.getvalue()
            captured.write_bytes(struct.pack('<II',10,len(raw))+raw)
            (before/'capture.json').write_text(json.dumps({'level_metadata':{'sha256':m.sha(captured)}}))
            for enabled in [False,True]:
                out=r/str(enabled);out.mkdir()
                with patch.multiple(m,R=r,CONFIG={'preserve_captured_experiments':enabled}):m.blank_level(out,'QA')
                actual=m.level_metadata(out)['experiments'].unpack()
                self.assertEqual(actual,{k:int(v) for k,v in flags.items()} if enabled else {})
            self.assertEqual(captured.read_bytes(),struct.pack('<II',10,len(raw))+raw)
    def test_modified_captured_input_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            r=Path(tmp);(r/'production-before').mkdir();p=r/'production-before/level-metadata.dat';p.write_bytes(b'changed')
            (r/'production-before/capture.json').write_text('{"level_metadata":{"sha256":"original"}}')
            with patch.multiple(m,R=r,CONFIG={'preserve_captured_experiments':True}),self.assertRaises(AssertionError):m.blank_level(r,'QA')

if __name__=='__main__':unittest.main()
