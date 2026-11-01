import {expect,test} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const tool=path.resolve(process.cwd(),'scripts/extract-handwriting.mjs');

function invoke(...args:string[]){
  return spawnSync(process.execPath,[tool,...args],{cwd:process.cwd(),encoding:'utf8'});
}

test('private handwriting crop utility rejects public checkout as source',()=>{
  const output=invoke('--source',path.resolve('reference/4569.mp4'),
    '--manifest','/tmp/handwriting-private-map.json','--output','/tmp/handwriting-private-preview');
  expect(output.status).not.toBe(0);
  expect(output.stderr).toContain('Video must be outside the public repository');
});

test('private handwriting crop utility refuses the separate 4568 greeting',()=>{
  const output=invoke('--source','/tmp/4568.mp4',
    '--manifest','/tmp/handwriting-private-map.json','--output','/tmp/handwriting-private-preview');
  expect(output.status).not.toBe(0);
  expect(output.stderr).toContain('Expected the non-birthday 4569.mp4');
});

test('private handwriting crop utility rejects missing required paths',()=>{
  const output=invoke('--source','/tmp/4569.mp4');
  expect(output.status).not.toBe(0);
  expect(output.stderr).toContain('Required argument: --manifest');
});
