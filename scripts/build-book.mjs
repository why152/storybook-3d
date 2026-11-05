import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

function build(){
  if(process.argv.length!==3)throw new Error('用法：npm run book:build -- <book.json>');
  const config=resolve(process.argv[2]);
  const {id,version}=JSON.parse(readFileSync(config,'utf8'));
  for(const [field,value] of Object.entries({id,version})){
    if(typeof value!=='string'||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)||value.length>48){
      throw new Error(field+' 须由小写字母、数字和单连字符组成，最长 48 字符');
    }
  }
  const repo=fileURLToPath(new URL('../',import.meta.url));
  const parent=join(repo,'build','books',id,'releases');
  const output=join(parent,version);
  if(existsSync(output))throw new Error('此版本已经出包。请修改 version 后重新构建。');
  mkdirSync(parent,{recursive:true});
  const stage=mkdtempSync(join(parent,'.build-'));
  try{
    const vite=join(repo,'node_modules','vite','bin','vite.js');
    const result=spawnSync(process.execPath,[vite,'build','--mode','template','--outDir',stage],{
      cwd:repo,stdio:'inherit',env:{...process.env,STORYBOOK_TEMPLATE_CONFIG:config},
    });
    if(result.error)throw result.error;
    if(result.status!==0)throw new Error('绘本出包失败');
    renameSync(stage,output);
    console.log('交付目录 '+output);
  }finally{
    rmSync(stage,{recursive:true,force:true});
  }
}

try{build();}catch(error){
  console.error(error.message);
  process.exitCode=1;
}
