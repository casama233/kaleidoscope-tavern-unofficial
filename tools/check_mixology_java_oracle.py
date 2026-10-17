#!/usr/bin/env python3
"""Compare real JS matching with the exact primary NeoForge Java matcher."""
import hashlib,json,subprocess,tempfile,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
COMMIT='a2d6402a3c1eec093aef7e7d10ac5145906c199e'
URL=f'https://raw.githubusercontent.com/neoforged/NeoForge/{COMMIT}/src/main/java/net/neoforged/neoforge/common/util/RecipeMatcher.java'
SOURCE_SHA256='d0db81049ed607c1b10b332ce0e1f650f4e39e105fa873afc4530835fc79dd26'
def main():
    with tempfile.TemporaryDirectory(prefix='tavern-java-matcher-') as folder:
        target=Path(folder)
        source=urllib.request.urlopen(URL,timeout=30).read()
        assert hashlib.sha256(source).hexdigest()==SOURCE_SHA256,'Primary matcher changed'
        path=target/'net/neoforged/neoforge/common/util/RecipeMatcher.java';path.parent.mkdir(parents=True);path.write_bytes(source)
        annotation=target/'org/jetbrains/annotations/Nullable.java';annotation.parent.mkdir(parents=True);annotation.write_text('package org.jetbrains.annotations; @java.lang.annotation.Target({java.lang.annotation.ElementType.TYPE_USE}) public @interface Nullable {}')
        harness=target/'MatcherOracle.java'
        harness.write_text('''import java.util.*;import java.util.function.Predicate;import net.neoforged.neoforge.common.util.RecipeMatcher;
public class MatcherOracle { public static void main(String[] args){
 for(int mask=0;mask<512;mask++){List<Predicate<Integer>> rules=new ArrayList<>();
  for(int row=0;row<3;row++){final int bits=(mask>>(row*3))&7;rules.add(item->(bits&(1<<item))!=0);}
  System.out.println(RecipeMatcher.findMatches(List.of(0,1,2),rules)!=null);
 }
}}''')
        subprocess.run(['javac','-d',str(target),str(path),str(annotation),str(harness)],check=True)
        java=subprocess.check_output(['java','-cp',str(target),'MatcherOracle'],text=True).splitlines()
        module=(ROOT/'runtime/BP/scripts/core/mixology-categories.js').as_uri()
        script='''import {matchShakerRecipe} from MODULE;
const output=[];for(let mask=0;mask<512;mask++){
 const ingredientPredicates=Array.from({length:3},(_,row)=>[0,1,2].filter(item=>mask&(1<<(row*3+item))).map(item=>({item:'oracle:item_'+item})));
 output.push(String(matchShakerRecipe({ingredientPredicates},[0,1,2].map(item=>({item:'oracle:item_'+item})),{tags:()=>[]})));
}console.log(output.join('\\n'));'''.replace('MODULE',json.dumps(module))
        js=subprocess.check_output(['node','--input-type=module','-e',script],text=True).splitlines()
        assert len(java)==len(js)==512 and java==js,'JS differs from actual Java matcher'
        print(json.dumps({'primary_source':URL,'cases':512,'matching_results_identical':True,'real_java_executed':True,'minecraft_players_simulated':False}))
if __name__=='__main__':main()
