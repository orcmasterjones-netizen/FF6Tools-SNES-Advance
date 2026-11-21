// Generate the native FF6Tools definition as an inspection aid. GPL-3.0.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
if(process.argv.length!==4){
    console.error('Usage: node tools/inspect-definition.cjs Regular.sfc definition.json');
    process.exit(2);
}
const context=vm.createContext({console,crypto:require('node:crypto').webcrypto});
for(const name of ['vendor/gfx.js','vendor/romtools.js','vendor/rom-observer.js','profile.js','author-profile.js','engine.js','author-layout.js'])
    vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
context.input=fs.readFileSync(process.argv[2]);
(async()=>{
    const definition=await vm.runInContext(`(async()=>{
        const session=await AdvanceRom.open(Uint8Array.from(input));
        const d=makeDefinition(session.domains);
        d.name="SNES Advance Regular · inspection";
        d.crc32=ROM.crc32(session.original);
        for(const [key,table] of Object.entries(d.assembly)){
            if(!tables[key]){delete d.assembly[key]; continue;}
            table.stringTable={length:tables[key].count,string:{}};
            for(let i=0;i<tables[key].count;i++)
                table.stringTable.string[i]=permitted(key,i)?recordLabel(session.original,key,i):"Reserved";
            for(const field of Object.values(table.assembly.assembly)) field.disabled=true;
        }
        return d;
    })()`,context);
    fs.writeFileSync(process.argv[3],JSON.stringify(definition,null,2)+'\n',{flag:'wx'});
    console.log('Created inspection definition. Edit and export ROMs with index.html.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
