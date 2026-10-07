"""Select four reviewed future inputs; never approve or reconcile installed drift."""
from pathlib import Path, PurePosixPath
import subprocess
from family_update import common as c

def recipe_path(review):
    name=PurePosixPath(review['recipe']['path'])
    assert name.parts and not name.is_absolute() and '..' not in name.parts and '\\' not in str(name), 'Recipe must remain inside the committed extension'
    return c.EXTENSION/str(name),str(name)

def input_refs():
    path=c.CONFIG.get('prospective_preserved_inputs')
    if not path:return {}
    review=c.read(Path(path));recipe,_=recipe_path(review)
    return {'prospective_preserved_inputs':c.sha(Path(path)),
            'prospective_recipe':c.sha(recipe),
            'prospective_native_validation':c.sha(Path(review['native_validation']['path']))}

def committed(path,name):
    assert path.read_bytes()==subprocess.check_output(['git','show','HEAD:'+name],cwd=c.EXTENSION), 'Committed source bytes differ'

def separate(path,protected):
    assert path.is_absolute() and '..' not in path.parts, 'Input path must be absolute and normalized'
    assert not any(p.is_symlink() for p in [path,*path.parents]), 'Input path contains a symlink'
    path=path.resolve(strict=True)
    for other in protected:
        other=Path(other).resolve()
        assert path!=other and path not in other.parents and other not in path.parents, 'Prospective input overlaps a protected path'
    entries=list(path.rglob('*'))
    assert path.is_dir() and not any(p.is_symlink() for p in entries), 'Prospective pack contains a symlink'
    assert all(p.stat().st_nlink==1 for p in entries if p.is_file()), 'Prospective input shares physical files'
    return path

def select(preserved,original):
    path=c.CONFIG.get('prospective_preserved_inputs')
    if not path:return [Path(p['path']) for p in preserved],None
    assert c.EXTENSION and not any(c.CONFIG.get(key) for key in ['approved_runtime_retention','extension_hold','held_sources','preserved_reconciliation','preserved_additions']), 'Prospective inputs require the current complete source selection without reconciliation'
    path=Path(path);review=c.read(path)
    assert path.is_absolute() and set(review)=={'schema','source_commit','recipe','native_validation','packs'}, 'Prospective review schema differs'
    assert set(review['recipe'])==set(review['native_validation'])=={'path','sha256'}, 'Prospective reference schema differs'
    assert type(review['schema']) is int and review['schema']==1 and not c.git(c.EXTENSION,'status','--porcelain'), 'Prospective source must be clean'
    head=c.git(c.EXTENSION,'rev-parse','HEAD')
    assert review['source_commit']==head, 'Prospective source commit differs'
    for source in [c.EXTENSION,*c.SOURCES.values()]:
        assert not path.resolve().is_relative_to(Path(source).resolve()), 'Prospective review must remain outside Git sources'
    baseline=c.read(c.EXTENSION/'baseline.json');committed(c.EXTENSION/'baseline.json','baseline.json')
    recipe,relative=recipe_path(review);committed(recipe,relative)
    assert c.sha(recipe)==review['recipe']['sha256'], 'Recipe reference changed'
    data=c.read(recipe);names=set(data['output_hashes'])
    assert data['schema']==1 and len(names)==4 and names==set(data['uuids'])==set(review['packs']), 'Exactly the four committed outputs are required'
    uuids=list(data['uuids'].values());assert len(set(uuids))==4, 'Duplicate prospective identity'
    old={p['uuid']:p for p in original['packs']};current={p['uuid']:p for p in preserved}
    assert len(old)==len(original['packs']) and len(current)==len(preserved), 'Duplicate captured identity'
    policy=c.read(c.R/'production-before/senluo-policy.json')
    approved=c.read(Path(policy['approved_receipt']));admitted={p['uuid']:p for p in approved['packs']}
    assert set(old)==set(admitted) and set(current)=={uid for uid,p in admitted.items() if p['source']['owner']=='preserved'}, 'Prospective review cannot add or omit current identities'
    protected=[c.B,c.W,c.Q,c.R,c.C,c.EXTENSION,*c.SOURCES.values()]
    outputs={};manifests={};roots=[]
    for name in sorted(names):
        row=review['packs'][name];uid=data['uuids'][name]
        assert set(row)=={'path','uuid'}, 'Prospective pack schema differs'
        assert row['uuid']==uid and uid in current and uid in old and uid in admitted, 'Prospective scope may not add or replace identities'
        assert admitted[uid]['source']['owner']=='preserved', 'Only current approved preserved packs may change'
        assert all(current[uid][k]==old[uid][k]==admitted[uid][k] for k in ['side','version','files']), 'Installed drift cannot use prospective input review'
        root=separate(Path(row['path']),protected)
        assert all(root!=other and root not in other.parents and other not in root.parents for other in roots), 'Prospective pack paths overlap'
        roots.append(root);actual=c.hashes(root)
        assert actual==data['output_hashes'][name], 'Prospective files differ from committed recipe output'
        manifest=c.read(root/'manifest.json');header=manifest['header'];modules=manifest['modules']
        assert header['uuid']==uid and modules and all(m['version']==header['version'] for m in modules), 'Prospective manifest/module identity differs'
        prior_manifest=Path(current[uid]['path'])/'manifest.json'
        assert c.sha(prior_manifest)==current[uid]['files']['manifest.json'], 'Captured manifest changed'
        prior_modules=c.read(prior_manifest)['modules']
        assert [(m['uuid'],m['type']) for m in modules]==[(m['uuid'],m['type']) for m in prior_modules], 'Prospective module identity changed'
        assert header['version']!=old[uid]['version'], 'Prospective output must use a new pack version'
        side='resource' if all(m['type']=='resources' for m in modules) else 'behavior'
        assert side==old[uid]['side'], 'Prospective pack side changed'
        outputs[name]={'uuid':uid,'path':str(root),'side':side,'version':header['version']}
        manifests[uid]=manifest
    assert sorted(row['side'] for row in outputs.values())==['behavior','behavior','resource','resource'], 'Two complete pairs are required'
    for uid,manifest in manifests.items():
        version=manifest['header']['version']
        peers=[]
        for dep in manifest.get('dependencies',[]):
            other=manifests.get(dep.get('uuid'))
            if other:
                assert dep['version']==other['header']['version'], 'Prospective pair dependency version differs'
                if other['header']['version']==version and any(m['type']=='resources' for m in other['modules'])!=any(m['type']=='resources' for m in manifest['modules']):peers.append(dep['uuid'])
        assert peers, 'Prospective pair dependency missing'
    native=review['native_validation'];proof_path=Path(native['path'])
    assert proof_path.is_absolute() and c.sha(proof_path)==native['sha256'], 'Native validation reference changed'
    assert Path(c.CONFIG['extension_validation']).resolve()==proof_path.resolve(), 'Prospective and extension validation must agree'
    proof=c.read(proof_path)
    from family_update.extension_validation import source_binding,verify_extension
    binding=source_binding(proof,baseline)
    assert binding['actual_current_source_commit']==head, 'Prospective source changed during Native binding'
    tested_ref=proof['tested_family_receipt'];assert c.sha(tested_ref['path'])==tested_ref['sha256'], 'Native tested receipt changed'
    tested=c.read(Path(tested_ref['path']))
    reports=verify_extension(tested,old)
    assert reports, 'Actual changed-extension functional evidence is required'
    tested_rows={p['uuid']:p for p in tested['packs']}
    assert len(tested_rows)==len(tested['packs']), 'Native tested receipt duplicates an identity'
    for name,row in outputs.items():
        native_row=tested_rows.get(row['uuid'])
        assert native_row and native_row['files']==data['output_hashes'][name] and all(native_row[k]==row[k] for k in ['side','version']), 'Prospective output differs from Native tested bytes/version'
    evidence={'schema':1,'review':c.report_ref(path),'source_commit':head,**binding,'version':baseline['version'],
              'source_trees':baseline['source_trees'],'recipe':c.report_ref(recipe),
              'native_validation':c.report_ref(proof_path),'tested_family_receipt':tested_ref,
              'extension_reports':reports,'packs':outputs,'current_live_reconciled':False,
              'full_family_acceptance_still_required':True,'client':False,'production_ready':False}
    assert c.git(c.EXTENSION,'rev-parse','HEAD')==head and not c.git(c.EXTENSION,'status','--porcelain'), 'Prospective source changed during review'
    replacements={r['uuid']:Path(r['path']) for r in outputs.values()}
    return [replacements.get(p['uuid'],Path(p['path'])) for p in preserved],evidence

def verify_candidate(receipt,evidence):
    if evidence is None:return
    recipe=c.read(Path(evidence['recipe']['path']));rows={p['uuid']:p for p in receipt['packs']}
    assert len(rows)==len(receipt['packs']), 'Candidate duplicates an identity'
    for name,expected in evidence['packs'].items():
        row=rows[expected['uuid']]
        assert row['source']['owner']=='preserved' and row['files']==recipe['output_hashes'][name] and all(row[k]==expected[k] for k in ['side','version']), 'Assembled prospective bytes/identity changed'
