#!/usr/bin/env python3
"""Compare shipped barrel boxes with the pinned author's actual getShape body.

Only state reads and Block.box are stubbed. The Java decision and its constants
run unchanged; this does not simulate a player or certify engine collision.
"""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
WITNESS = ROOT / 'data/java-parity/barrel-shape-source.json'


def author_shapes(java_source=None):
    witness = json.loads(WITNESS.read_text())
    if java_source is not None:
        source = Path(java_source) / witness['sources'][0]['path']
        raw = source.read_bytes().replace(b'\r\n', b'\n')
        assert hashlib.sha256(raw).hexdigest() == witness['sources'][0]['sha256'], 'Author barrel source changed'
        text = raw.decode()
        constants = text.split('    private static final VoxelShape SHAPE_FULL', 1)[1].split('    private static final AttachFace[]', 1)[0]
        constants = 'private static final VoxelShape SHAPE_FULL' + constants
        constants = '\n'.join(line for line in constants.splitlines() if not line.lstrip().startswith('//')).strip()
        assert witness['author_constants_java'] == constants, 'Original Java constants drift'
        assert witness['author_get_shape_java'] in text, 'Original Java getShape drift'
    source = '''import java.util.*;
class BarrelShapeOracle {
 enum Direction { NORTH, EAST, SOUTH, WEST }
 static final String FACING="facing", INDEX="index";
 record VoxelShape(double[] box) {}
 static class Block { static VoxelShape box(double... box) { return new VoxelShape(box); } }
 static class BlockGetter {} static class BlockPos {} static class CollisionContext {}
 record BlockState(Direction facing, int index) {
  @SuppressWarnings("unchecked") <T> T getValue(String key) {
   return (T)(key.equals(FACING) ? facing : Integer.valueOf(index));
  }
 }
''' + witness['author_constants_java'] + '\n' + witness['author_get_shape_java'] + '''
 public static void main(String[] args) {
  var original=new BarrelShapeOracle();
  for(var facing:Direction.values()) for(int index=0;index<9;index++) {
   var shape=original.getShape(new BlockState(facing,index),null,null,null);
   System.out.println(facing+":"+index+":"+Arrays.toString(shape.box()));
  }
 }
}
'''
    with tempfile.TemporaryDirectory(prefix='tavern-barrel-shape-') as directory:
        path = Path(directory) / 'BarrelShapeOracle.java'
        path.write_text(source)
        subprocess.run(['javac', str(path)], check=True, capture_output=True, text=True)
        output = subprocess.check_output(['java', '-cp', directory, 'BarrelShapeOracle'], text=True)
    result = {}
    for line in output.splitlines():
        facing, index, box = line.split(':', 2)
        result[facing.lower(), int(index)] = json.loads(box)
    assert len(result) == 36
    return result


def condition_matches(condition, states):
    expression = re.sub(r"q\.block_state\('([^']+)'\)", lambda m: repr(states[m[1]]), condition)
    expression = expression.replace('&&', ' and ').replace('||', ' or ')
    parsed = ast.parse(expression, mode='eval')
    allowed = (ast.Expression, ast.BoolOp, ast.And, ast.Or, ast.Compare,
               ast.Eq, ast.Constant, ast.UnaryOp, ast.USub)
    assert all(isinstance(node, allowed) for node in ast.walk(parsed)), condition
    return eval(compile(parsed, '<barrel-state>', 'eval'), {'__builtins__': {}}, {})


def checked_states(core, part, expected):
    count = 0
    for (facing, index), bounds in expected.items():
        column, row = index % 3, index // 3
        for layer in range(3):
            states = {'minecraft:cardinal_direction': facing,
                      'kaleidoscope_tavern:dx': column - 1,
                      'kaleidoscope_tavern:dy': layer,
                      'kaleidoscope_tavern:dz': row - 1}
            definition = core if (column, row, layer) == (1, 1, 0) else part
            components = dict(definition['components'])
            for permutation in definition.get('permutations', []):
                if condition_matches(permutation['condition'], states):
                    components.update(permutation['components'])
            for name in ('minecraft:collision_box', 'minecraft:selection_box'):
                actual = components[name]
                assert isinstance(actual, dict), (states, name, actual)
                lo = [actual['origin'][0] + 8, actual['origin'][1], actual['origin'][2] + 8]
                hi = [lo[i] + actual['size'][i] for i in range(3)]
                assert lo + hi == bounds, (states, name, lo + hi, bounds)
            count += 1
    assert count == 108
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--java-source', type=Path)
    args = parser.parse_args()
    read = lambda name: json.loads((ROOT / f'runtime/BP/blocks/{name}.json').read_text())['minecraft:block']
    count = checked_states(read('barrel_core'), read('barrel_part'), author_shapes(args.java_source))
    print(json.dumps({'barrelShapeStates': count, 'oracle': 'original Java getShape', 'client': False}))


if __name__ == '__main__':
    main()
